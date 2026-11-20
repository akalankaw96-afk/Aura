"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Input, useToast } from "@/components/ui";
import { changeRole, findUserByPhone, getStaff, type StaffUser } from "@/lib/staff";

/** Admin only: make a member a Moderator, or back to Member (S02-T08). Used by /admin/roles. */
/* ───────────── Staff (Admin only) ───────────── */

export function StaffManager() {
  const toast = useToast();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState<StaffUser | null>(null);
  const load = useCallback(() => {
    getStaff().then(setStaff).catch(() => undefined);
  }, []);
  useEffect(load, [load]);

  const find = async () => {
    try {
      setFound(await findUserByPhone(phone.trim()));
    } catch (err) {
      setFound(null);
      toast.error("Not found", err instanceof Error ? err.message : "");
    }
  };
  const setRole = async (u: StaffUser, role: "Member" | "Moderator") => {
    try {
      await changeRole(u.userId, role);
      toast.success(role === "Moderator" ? `${u.fullName} is now a moderator` : `${u.fullName} is a member again`, "Their sessions were ended so the change applies now.");
      setFound(null);
      setPhone("");
      load();
    } catch (err) {
      toast.error("That didn’t work", err instanceof Error ? err.message : "");
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="mb-3 text-h6 text-ink">Staff</h2>
        <ul className="flex flex-col gap-2">
          {staff.map((u) => (
            <li key={u.userId} className="flex items-center gap-3 border-b border-line pb-2">
              <span className="min-w-0 flex-1">
                <span className="block text-label-md text-ink">{u.fullName}</span>
                <span className="block text-caption text-ink-tertiary">{u.phoneNumber}</span>
              </span>
              <Badge tone={u.role === "Admin" ? "premium" : "info"}>{u.role}</Badge>
              {u.role === "Moderator" && (
                <Button size="sm" variant="outline" onClick={() => setRole(u, "Member")}>Remove</Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-h6 text-ink">Add a moderator</h2>
        <p className="text-body-sm text-ink-secondary">The person must already have a Vikasitha account.</p>
        <div className="flex gap-2">
          <Input aria-label="Mobile number" placeholder="+94 77 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} containerClassName="flex-1" />
          <Button onClick={find} disabled={!phone.trim()}>Find</Button>
        </div>
        {found && (
          <div className="flex items-center gap-3 rounded-lg bg-surface-subtle p-3">
            <span className="min-w-0 flex-1">
              <span className="block text-label-md text-ink">{found.fullName}</span>
              <span className="block text-caption text-ink-tertiary">{found.phoneNumber} · {found.role}</span>
            </span>
            {found.role === "Member" && <Button size="sm" onClick={() => setRole(found, "Moderator")}>Make moderator</Button>}
          </div>
        )}
      </Card>
    </div>
  );
}
