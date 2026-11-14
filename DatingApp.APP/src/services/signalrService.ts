import * as signalR from "@microsoft/signalr";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
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
}

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

      this.hubConnection.onreconnecting(() => this.setStatus("reconnecting"));
      this.hubConnection.onreconnected(() => this.setStatus("connected"));
      this.hubConnection.onclose(() => this.setStatus("disconnected"));

      await this.hubConnection.start();
      this.setStatus("connected");
      return true;
    } catch (err) {
      console.warn("SignalR connection attempt failed (offline fallback active):", err);
      this.setStatus("disconnected");
      return false;
    }
  }

  public async joinConversation(conversationId: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke("JoinConversation", conversationId);
      } catch (err) {
        console.warn("JoinConversation invoke failed:", err);
      }
    }
  }

  public async leaveConversation(conversationId: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke("LeaveConversation", conversationId);
      } catch (err) {
        console.warn("LeaveConversation invoke failed:", err);
      }
    }
  }

  public async sendMessage(
    senderProfileId: string,
    receiverProfileId: string,
    messageText: string,
    conversationId?: string
  ): Promise<boolean> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke("SendMessage", senderProfileId, receiverProfileId, messageText, conversationId);
        return true;
      } catch (err) {
        console.error("SendMessage invoke failed:", err);
      }
    }
    return false;
  }

  public async sendTyping(conversationId: string, userName: string, isTyping: boolean) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke("SendTyping", conversationId, userName, isTyping);
      } catch {
        // silent fail
      }
    }
  }

  public async markAsRead(conversationId: string, messageId: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke("MarkAsRead", conversationId, messageId);
      } catch {
        // silent fail
      }
    }
  }

  public async requestContactShare(
    conversationId: string,
    senderProfileId: string,
    receiverProfileId: string
  ): Promise<boolean> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke("RequestContactShare", conversationId, senderProfileId, receiverProfileId);
        return true;
      } catch (err) {
        console.error("RequestContactShare failed:", err);
      }
    }
    return false;
  }

  public async acceptContactShare(
    conversationId: string,
    accepterProfileId: string,
    partnerProfileId: string
  ): Promise<boolean> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke("AcceptContactShare", conversationId, accepterProfileId, partnerProfileId);
        return true;
      } catch (err) {
        console.error("AcceptContactShare failed:", err);
      }
    }
    return false;
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
      } catch {}
      this.hubConnection = null;
      this.setStatus("disconnected");
    }
  }
}

export const signalrService = new SignalRService();

// REST Helpers
export async function getConversations(profileId: string): Promise<ConversationDto[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/chat/conversations?profileId=${encodeURIComponent(profileId)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Failed to fetch conversations from API:", err);
    return [];
  }
}

export async function getChatHistory(
  conversationId: string,
  currentProfileId: string
): Promise<ChatMessageDto[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/chat/history/${encodeURIComponent(conversationId)}?currentProfileId=${encodeURIComponent(
        currentProfileId
      )}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Failed to fetch history from API:", err);
    return [];
  }
}
