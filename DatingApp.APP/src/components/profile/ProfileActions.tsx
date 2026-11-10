"use client";

import { HeartAdd, MessageText, TickCircle } from "iconsax-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useIsConnected } from "@/lib/connections";
import { requirePaidAction } from "@/lib/usage";

/** The Message and Send interest actions shared by profile details and favourites. */
export function ProfileActions({ profileId, sent, blocked = false, onSend }: {
  profileId: string;
  sent: boolean;
  blocked?: boolean;
  onSend: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const connected = useIsConnected(profileId);
  const interestExists = sent || connected;

  function message() {
    if (!requirePaidAction("messages", "message members")) return;
    if (connected) {
      router.push("/messages");
      return;
    }
    toast.info("Chat unlocks after they accept", sent ? "Your interest is waiting for a reply." : "Send an interest first.");
  }

  return (
    <div className="flex gap-3 max-sm:w-full">
      <Button variant="outline" size="md" className="max-sm:flex-1" leftIcon={<MessageText size={18} color="currentColor" />} onClick={message}>
        Message
      </Button>
      <Button size="md" className="max-sm:flex-1" disabled={interestExists || blocked} onClick={onSend} leftIcon={interestExists ? <TickCircle size={18} color="currentColor" /> : <HeartAdd size={18} color="currentColor" />}>
        {connected ? "Interest accepted" : sent ? "Interest sent" : "Send interest"}
      </Button>
    </div>
  );
}
