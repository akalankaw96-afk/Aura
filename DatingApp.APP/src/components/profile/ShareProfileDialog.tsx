"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CloseCircle, Copy, Link1, MessageText, Sms, Whatsapp } from "iconsax-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requireMember } from "@/lib/session";

export function ShareProfileDialog({ url, onClose }: { url: string; onClose: () => void }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState("");
  const shareText = encodeURIComponent(`See this profile on Vikasitha: ${url}`);
  const channels = [
    { label: "WhatsApp", Icon: Whatsapp, href: `https://wa.me/?text=${shareText}`, newTab: true },
    { label: "SMS", Icon: MessageText, href: `sms:?body=${shareText}` },
    { label: "Email", Icon: Sms, href: `mailto:?subject=${encodeURIComponent("Vikasitha profile")}&body=${shareText}` },
  ];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

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
    } catch {
      // Some browsers deny clipboard access. The link is still selectable.
    }
    linkRef.current?.focus();
    linkRef.current?.select();
    setFeedback("Link selected. Use your browser’s Copy command.");
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-dvh w-full max-w-none overflow-y-auto rounded-t-xl border border-line bg-surface-card text-ink shadow-xl backdrop:bg-black/45 sm:inset-0 sm:m-auto sm:h-fit sm:max-w-md sm:rounded-xl"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <header className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-h5">Share profile</h2>
            <p id={descriptionId} className="text-body-sm text-ink-secondary">Copy the profile link or share it with someone.</p>
          </div>
          <button type="button" aria-label="Close share dialog" onClick={onClose} className="shrink-0 rounded-full p-1 text-ink-tertiary hover:bg-surface-subtle focus-visible:shadow-ring-brand">
            <CloseCircle size={24} color="currentColor" />
          </button>
        </header>

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
              <Button size="sm" className="shrink-0" aria-label="Copy profile link" onClick={copyLink} leftIcon={<Copy size={16} color="currentColor" />}>
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
      </div>
    </dialog>
  );
}
