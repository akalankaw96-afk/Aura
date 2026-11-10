import { CallCalling, Messages2, Sms } from "iconsax-react";
import { MemberShell } from "@/components/layout/MemberShell";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SUPPORT } from "@/content/support";

const ICONS = { email: Sms, whatsapp: Messages2, hotline: CallCalling };

export function SupportScreen() {
  return (
    <MemberShell publicPage crumb="Support" title={SUPPORT.title} subtitle={SUPPORT.subtitle}>
      <ul aria-label="Support contact methods" className="grid gap-4 md:grid-cols-3 lg:gap-6">
        {SUPPORT.channels.map(({ id, title, description, contact, href, action }) => {
          const Icon = ICONS[id];
          return (
            <li key={id} className="min-w-0">
              <Card className="flex h-full flex-col gap-4 p-5 shadow-sm sm:p-6">
                <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-icon-brand">
                  <Icon size={24} color="currentColor" />
                </span>
                <div className="flex flex-1 flex-col gap-2">
                  <h2 className="text-h5 text-ink">{title}</h2>
                  <p className="text-body-sm text-ink-secondary">{description}</p>
                  {contact && <p className="break-words text-label-md text-ink">{contact}</p>}
                </div>
                {href ? (
                  <ButtonLink
                    href={href}
                    size="md"
                    variant={id === "email" ? "primary" : "outline"}
                    className="self-start"
                    target={id === "whatsapp" ? "_blank" : undefined}
                    rel={id === "whatsapp" ? "noopener noreferrer" : undefined}
                  >
                    {action}
                  </ButtonLink>
                ) : (
                  <p className="rounded-md bg-surface-subtle px-4 py-3 text-body-sm text-ink-secondary">{SUPPORT.unavailable}</p>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </MemberShell>
  );
}
