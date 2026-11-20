import * as signalR from "@microsoft/signalr";
import { API_BASE_URL, apiJson, ensureAccessToken, refreshAccessToken } from "@/lib/http";
import { log } from "@/lib/log";

const HUB_URL = API_BASE_URL.replace(/\/api\/?$/, "") + "/hubs/chat";

export interface ChatMessageDto {
  id: string;
  senderProfileId: string;
  senderName: string;
  senderPhotoUrl: string;
  receiverProfileId: string;
  receiverName: string;
  conversationId: string;
  messageText: string;
  sentAt: string;
  isRead: boolean;
  isMe: boolean;
  isFlaggedBySafety: boolean;
  safetyFlagReason?: string | null;
  isContactShareRequest: boolean;
  isContactShareAccepted: boolean;
  /** S03-T07: the asked member said "not now" / the asker cancelled */
  isContactShareDeclined?: boolean;
  isContactShareCancelled?: boolean;
}

/** Result of a hub call: ok, or the server's "CODE: message" (e.g. "LIMIT_REACHED: …", "BLOCKED: …"). */
export type HubResult = { ok: true } | { ok: false; error: string };

export interface ConversationDto {
  conversationId: string;
  partnerProfileId: string;
  partnerName: string;
  partnerPhotoUrl: string;
  partnerProfession: string;
  partnerVerified: boolean;
  partnerOnline: boolean;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
  isContactShared: boolean;
  partnerPhoneNumber?: string | null;
  /** none · sent (I asked) · received (they asked) · accepted — from the server (S03-T07) */
  contactShareState?: "none" | "sent" | "received" | "accepted";
  /** I blocked this member: read-only until I unblock */
  isBlocked?: boolean;
}

export interface TypingIndicatorDto {
  conversationId: string;
  userName: string;
  isTyping: boolean;
}

export interface ContactUnlockedDto {
  conversationId: string;
  unlockedBy: string;
  phoneNumber: string;
  partnerPhoneNumber: string;
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "reconnecting";

class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private messageListeners: ((msg: ChatMessageDto) => void)[] = [];
  private typingListeners: ((typing: TypingIndicatorDto) => void)[] = [];
  private readListeners: ((convId: string, msgId: string) => void)[] = [];
  private contactShareRequestedListeners: ((convId: string, requesterId: string) => void)[] = [];
  private contactUnlockedListeners: ((payload: ContactUnlockedDto) => void)[] = [];
  private contactShareClosedListeners: ((convId: string, byProfileId: string, how: "declined" | "cancelled") => void)[] = [];
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  private currentStatus: ConnectionStatus = "disconnected";

  public getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  private setStatus(status: ConnectionStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach((l) => l(status));
  }

  public async startConnection(): Promise<boolean> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return true;
    }

    try {
      this.setStatus("connecting");
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          // Signed-in members only (S01-T06): the access token rides on ?access_token= for the WebSocket.
          // A fresh token is fetched for every (re)connect, so 15-minute tokens never strand the chat.
          accessTokenFactory: async () => (await ensureAccessToken()) ?? (await refreshAccessToken()) ?? "",
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // Register server handlers
      this.hubConnection.on("ReceiveMessage", (msg: ChatMessageDto) => {
        this.messageListeners.forEach((l) => l(msg));
      });

      this.hubConnection.on("MessageSentConfirmation", (msg: ChatMessageDto) => {
        // Confirmation event if needed
        this.messageListeners.forEach((l) => l({ ...msg, isMe: true }));
      });

      this.hubConnection.on("UserTyping", (typing: TypingIndicatorDto) => {
        this.typingListeners.forEach((l) => l(typing));
      });

      this.hubConnection.on("MessageRead", (convId: string, msgId: string) => {
        this.readListeners.forEach((l) => l(convId, msgId));
      });

      this.hubConnection.on("ContactShareRequested", (convId: string, requesterId: string) => {
        this.contactShareRequestedListeners.forEach((l) => l(convId, requesterId));
      });

      this.hubConnection.on("ContactUnlocked", (payload: ContactUnlockedDto) => {
        this.contactUnlockedListeners.forEach((l) => l(payload));
      });

      this.hubConnection.on("ContactShareDeclined", (convId: string, byProfileId: string) => {
        this.contactShareClosedListeners.forEach((l) => l(convId, byProfileId, "declined"));
      });

      this.hubConnection.on("ContactShareCancelled", (convId: string, byProfileId: string) => {
        this.contactShareClosedListeners.forEach((l) => l(convId, byProfileId, "cancelled"));
      });

      this.hubConnection.onreconnecting(() => this.setStatus("reconnecting"));
      this.hubConnection.onreconnected(() => this.setStatus("connected"));
      this.hubConnection.onclose(() => this.setStatus("disconnected"));

      await this.hubConnection.start();
      this.setStatus("connected");
      return true;
    } catch (err) {
      log.warn("chat connection failed — will retry", err);
      this.setStatus("disconnected");
      return false;
    }
  }

  public async joinConversation(conversationId: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke("JoinConversation", conversationId);
      } catch (err) {
        log.warn("JoinConversation failed", err);
      }
    }
  }

  public async leaveConversation(conversationId: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke("LeaveConversation", conversationId);
      } catch (err) {
        log.warn("LeaveConversation failed", err);
      }
    }
  }

  /** Calls a hub method; a HubException comes back as its "CODE: message" text. */
  private async call(method: string, ...args: unknown[]): Promise<HubResult> {
    if (this.hubConnection?.state !== signalR.HubConnectionState.Connected) {
      return { ok: false, error: "OFFLINE: Chat is reconnecting. Please try again in a moment." };
    }
    try {
      await this.hubConnection.invoke(method, ...args);
      return { ok: true };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      // "An unexpected error occurred invoking 'X' on the server. HubException: CODE: message"
      const error = raw.includes("HubException:") ? raw.slice(raw.indexOf("HubException:") + "HubException:".length).trim() : raw;
      return { ok: false, error };
    }
  }

  public async sendMessage(
    senderProfileId: string,
    receiverProfileId: string,
    messageText: string,
    conversationId?: string
  ): Promise<HubResult> {
    // The server knows who is sending from the access token; the ids here are only the receiver.
    void senderProfileId;
    void conversationId;
    return this.call("SendMessage", receiverProfileId, messageText);
  }

  public async sendTyping(conversationId: string, userName: string, isTyping: boolean) {
    void userName; // the server sends the member's own name
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke("SendTyping", conversationId, isTyping);
      } catch (err) {
        log.warn("typing indicator not sent", err); // harmless: the next keystroke tries again
      }
    }
  }

  public async markAsRead(conversationId: string, messageId: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        void conversationId;
        await this.hubConnection.invoke("MarkAsRead", messageId);
      } catch (err) {
        log.warn("read receipt not sent", err); // the next history load marks it again
      }
    }
  }

  /** Asking for numbers needs Gold — "PLAN_REQUIRED: …" otherwise. */
  public async requestContactShare(conversationId: string, senderProfileId: string, receiverProfileId: string): Promise<HubResult> {
    void conversationId;
    void senderProfileId;
    return this.call("RequestContactShare", receiverProfileId);
  }

  public async acceptContactShare(conversationId: string, accepterProfileId: string, partnerProfileId: string): Promise<HubResult> {
    void conversationId;
    void accepterProfileId;
    return this.call("AcceptContactShare", partnerProfileId);
  }

  /** "Not now" to the partner's request (S03-T07). */
  public declineContactShare(partnerProfileId: string): Promise<HubResult> {
    return this.call("DeclineContactShare", partnerProfileId);
  }

  /** Take back my own request (S03-T07). */
  public cancelContactShare(partnerProfileId: string): Promise<HubResult> {
    return this.call("CancelContactShare", partnerProfileId);
  }

  // Event subscription helpers
  public onMessageReceived(callback: (msg: ChatMessageDto) => void) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== callback);
    };
  }

  public onUserTyping(callback: (typing: TypingIndicatorDto) => void) {
    this.typingListeners.push(callback);
    return () => {
      this.typingListeners = this.typingListeners.filter((l) => l !== callback);
    };
  }

  public onMessageRead(callback: (convId: string, msgId: string) => void) {
    this.readListeners.push(callback);
    return () => {
      this.readListeners = this.readListeners.filter((l) => l !== callback);
    };
  }

  public onContactShareRequested(callback: (convId: string, requesterId: string) => void) {
    this.contactShareRequestedListeners.push(callback);
    return () => {
      this.contactShareRequestedListeners = this.contactShareRequestedListeners.filter((l) => l !== callback);
    };
  }

  public onContactUnlocked(callback: (payload: ContactUnlockedDto) => void) {
    this.contactUnlockedListeners.push(callback);
    return () => {
      this.contactUnlockedListeners = this.contactUnlockedListeners.filter((l) => l !== callback);
    };
  }

  public onContactShareClosed(callback: (convId: string, byProfileId: string, how: "declined" | "cancelled") => void) {
    this.contactShareClosedListeners.push(callback);
    return () => {
      this.contactShareClosedListeners = this.contactShareClosedListeners.filter((l) => l !== callback);
    };
  }

  public onConnectionStatusChange(callback: (status: ConnectionStatus) => void) {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== callback);
    };
  }

  public async disconnect() {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (err) {
        log.warn("chat connection did not close cleanly", err);
      }
      this.hubConnection = null;
      this.setStatus("disconnected");
    }
  }
}

export const signalrService = new SignalRService();

// REST helpers — signed in only; the server decides whose chats these are from the access token.
// They throw ApiError when the API fails (S05-T06, BUG-014) — the Messages page shows an error instead of "no chats".
export function getConversations(): Promise<ConversationDto[]> {
  return apiJson<ConversationDto[]>("/chat/conversations", { cache: "no-store", fallbackError: "We couldn’t load your chats." });
}

export function getChatHistory(conversationId: string): Promise<ChatMessageDto[]> {
  return apiJson<ChatMessageDto[]>(`/chat/history/${encodeURIComponent(conversationId)}`, {
    cache: "no-store",
    fallbackError: "We couldn’t load this conversation.",
  });
}
