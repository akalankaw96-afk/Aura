import React from "react";
import { cn } from "@/lib/cn";
import { StatusIcon, type StatusType } from "./StatusIcon";

/**
 * Figma: Alert (Type = Success / Error / Warning / Info)
 * Inline message inside a card — for things the user must act on.
 */
const styles: Record<StatusType, string> = {
  success: "border-success-line bg-success-bg",
  error: "border-error-line bg-error-bg",
  warning: "border-warning-line bg-warning-bg",
  info: "border-info-line bg-info-bg",
};
const titleColor: Record<StatusType, string> = {
  success: "text-success-fg",
  error: "text-error-fg",
  warning: "text-warning-fg",
  info: "text-info-fg",
};

export interface AlertProps {
  type?: StatusType;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function Alert({ type = "info", title, children, action, className }: AlertProps) {
  return (
    <div role={type === "error" ? "alert" : "status"} className={cn("flex w-full animate-fade-up gap-2.5 rounded-md border px-3.5 py-3", styles[type], className)}>
      <StatusIcon type={type} size={18} className="mt-px" />
      <div className="min-w-0 flex-1">
        <p className={cn("text-body-sm font-bold leading-5", titleColor[type])}>{title}</p>
        {children && <div className="text-body-sm text-ink-secondary">{children}</div>}
        {action && <div className="mt-1.5 text-body-sm">{action}</div>}
      </div>
    </div>
  );
}
