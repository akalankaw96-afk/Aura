"use client";

import { useRef, useState } from "react";
import { Copy, Link1, MessageText, Sms, Whatsapp } from "iconsax-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { requireMember } from "@/lib/session";
import { log } from "@/lib/log";

export function ShareProfileDialog({ url, onClose }: { url: string; onClose: () => void }) {
  const linkRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState("");
  const shareText = encodeURIComponent(`See this profile on Yugadiwi: ${url}`);
  const channels = [
    { label: "WhatsApp", Icon: Whatsapp, href: `https://wa.me/?text=${shareText}`, newTab: true },
    { label: "SMS", Icon: MessageText, href: `sms:?body=${shareText}` },
    { label: "Email", Icon: Sms, href: `mailto:?subject=${encodeURIComponent("Yugadiwi profile")}&body=${shareText}` },
  ];

  function canShare() {
    if (requireMember("share profiles")) return true;
    onClose();
    return false;
  }

  async function copyLink() {
    if (!canShare()) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setFeedback("Link copied.");
        return;
      }
    } catch (err) {
      log.warn("clipboard denied — the link is selected instead", err);
    }
    linkRef.current?.focus();
    linkRef.current?.select();
    setFeedback("Link selected. Use your browser’s Copy command.");
  }

  return (
    <Modal open onClose={onClose} title="Share profile" description="Copy the profile link or share it with someone." size="sm">
        <div>
          <Input
            ref={linkRef}
            aria-label="Profile link"
            value={url}
            readOnly
            className="text-body-sm"
            icon={<Link1 size={18} color="currentColor" />}
            onFocus={(event) => event.currentTarget.select()}
            trailing={
              <Button size="sm" className="-mr-[11px] shrink-0 rounded-sm" aria-label="Copy profile link" onClick={copyLink} leftIcon={<Copy size={16} color="currentColor" />}>
                Copy
              </Button>
            }
          />
          <p role="status" className="mt-2 text-body-sm text-ink-secondary empty:sr-only">{feedback}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <ul aria-label="Share with an app" className="flex flex-wrap gap-3">
            {channels.map(({ label, Icon, href, newTab }) => (
              <li key={label}>
                <a
                  href={href}
                  target={newTab ? "_blank" : undefined}
                  rel={newTab ? "noopener noreferrer" : undefined}
                  className="group flex min-w-12 flex-col items-center gap-1.5 rounded-lg text-label-sm text-ink-secondary focus-visible:shadow-ring-brand"
                  onClick={(event) => { if (!canShare()) event.preventDefault(); }}
                >
                  <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-icon-brand transition-colors group-hover:bg-surface-muted">
                    <Icon size={23} color="currentColor" />
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <Button size="md" className="ml-auto" onClick={onClose}>Done</Button>
        </div>
    </Modal>
  );
}
