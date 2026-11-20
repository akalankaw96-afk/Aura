"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Add, Copy, Key, Lock1, More, Refresh, SecurityUser, Trash, UserAdd, UserMinus, UserTick } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Badge, Button, Checkbox, Input, SegmentedTabs, Select, useToast, Modal as SharedModal } from "@/components/ui";
import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  createStaffAccount,
  deleteRole,
  getRoles,
  getStaffAccounts,
  makeTempPassword,
  resetStaffPassword,
  saveRole,
  updateStaffAccount,
  type AdminRole,
  type Permission,
  type StaffAccount,
} from "@/lib/adminApi";
import { StaffManager } from "./StaffManager";
import { AdminPageHeader, DemoBanner } from "./AdminShell";

/**
 * /admin/roles (Admin only) — three tabs:
 *  Roles & permissions : role list + permission checklist; create / edit / delete custom roles
 *                        (Admin and Moderator are built-in: can't be deleted, Admin can't be edited)
 *  Staff accounts      : name, username, role, status, last login; add account (username + temporary
 *                        password the person must change at first login), change role, deactivate,
 *                        reset password (new temporary password shown once)
 *  Moderators (live)   : the existing "make a member a moderator by mobile" tool on the real API
 */
type Tab = "roles" | "staff" | "live";

export function AdminRoles() {
  const [tab, setTab] = useState<Tab>("roles");
  const [roles, setRoles] = useState<AdminRole[] | null>(null);
  const [staff, setStaff] = useState<StaffAccount[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [r, s] = await Promise.all([getRoles(), getStaffAccounts()]);
      setRoles(r.data);
      setStaff(s.data);
      setDemo(r.demo || s.demo);
      setError(null);
    } catch (e) {
      setRoles([]);
      setStaff([]);
      setError(e instanceof Error ? e.message : "We couldn’t load roles.");
    }
  };
  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <AdminPageHeader title="Roles & staff" subtitle="Decide what each staff member can see and do." />
      <DemoBanner show={demo && tab !== "live"} />
      <div className="-mx-4 mb-5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <SegmentedTabs
          label="Roles and staff"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "roles" as Tab, label: "Roles & permissions", count: roles?.length },
            { id: "staff" as Tab, label: "Staff accounts", count: staff?.length },
            { id: "live" as Tab, label: "Moderators (live)" },
          ]}
        />
      </div>
      {error && tab !== "live" && <p className="mb-4 text-body-sm text-error-fg">{error}</p>}
      {tab === "roles" && <RolesPanel roles={roles} onChanged={load} />}
      {tab === "staff" && <StaffPanel staff={staff} roles={roles ?? []} onChanged={load} />}
      {tab === "live" && (
        <>
          <p className="mb-4 text-body-sm text-ink-secondary">Works today on the live server: give an existing member the Moderator role, or remove it.</p>
          <StaffManager />
        </>
      )}
    </>
  );
}

/* ───────────── Roles & permissions ───────────── */

function RolesPanel({ roles, onChanged }: Readonly<{ roles: AdminRole[] | null; onChanged: () => void }>) {
  const toast = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ id?: string; name: string; description: string; permissions: Permission[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);

  const role = roles?.find((r) => r.id === (selected ?? roles[0]?.id)) ?? null;
  useEffect(() => {
    if (!role) return;
    setDraft({ id: role.id, name: role.name, description: role.description ?? "", permissions: [...role.permissions] });
    setTried(false);
  }, [role?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const startNew = () => {
    setSelected("__new");
    setDraft({ name: "", description: "", permissions: ["dashboard.view"] });
    setTried(false);
  };
  const isNew = selected === "__new";
  const locked = !isNew && role?.id === "admin";
  const editing = draft && (isNew || (role && !locked));
  const dirty = useMemo(() => {
    if (!draft || isNew || !role) return isNew;
    return draft.name !== role.name || draft.description !== (role.description ?? "") || draft.permissions.slice().sort().join() !== role.permissions.slice().sort().join();
  }, [draft, role, isNew]);

  const toggle = (p: Permission) =>
    setDraft((d) => (d ? { ...d, permissions: d.permissions.includes(p) ? d.permissions.filter((x) => x !== p) : [...d.permissions, p] } : d));

  const save = async () => {
    if (!draft) return;
    setTried(true);
    if (draft.name.trim().length < 2 || !draft.permissions.length) return;
    setBusy(true);
    try {
      const { data } = await saveRole({ id: isNew ? undefined : draft.id, name: draft.name.trim(), description: draft.description.trim(), permissions: draft.permissions });
      toast.success(isNew ? `Role “${data.name}” created` : "Role saved", "Staff with this role get the change at their next sign-in.");
      setSelected(data.id);
      onChanged();
    } catch (e) {
      toast.error("Couldn’t save the role", e instanceof Error ? e.message : "");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!role || role.builtIn) return;
    if (role.staffCount > 0) {
      toast.error("Role still in use", `Move the ${role.staffCount} staff member${role.staffCount > 1 ? "s" : ""} to another role first.`);
      return;
    }
    if (!window.confirm(`Delete the role “${role.name}”?`)) return;
    try {
      await deleteRole(role.id);
      toast.success("Role deleted");
      setSelected(null);
      onChanged();
    } catch (e) {
      toast.error("Couldn’t delete the role", e instanceof Error ? e.message : "");
    }
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* role list */}
      <section className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface-card shadow-xs">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-h6 text-ink">Roles</h2>
          <Button size="sm" onClick={startNew} leftIcon={<Add size={16} color="currentColor" />}>
            New role
          </Button>
        </div>
        <ul className="divide-y divide-line">
          {roles === null && <li className="p-4 text-body-sm text-ink-tertiary">Loading…</li>}
          {roles?.map((r) => {
            const on = !isNew && role?.id === r.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelected(r.id)}
                  aria-current={on ? "true" : undefined}
                  className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors", on ? "bg-brand-subtle" : "hover:bg-surface-subtle")}
                >
                  <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", on ? "bg-brand text-ink-on-brand" : "bg-surface-subtle text-icon-brand")}>
                    <SecurityUser size={18} color="currentColor" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-label-md text-ink">
                      {r.name}
                      {r.builtIn && <Lock1 size={13} color="currentColor" className="text-ink-tertiary" aria-label="Built-in" />}
                    </span>
                    <span className="block truncate text-body-xs text-ink-tertiary">{r.description || `${r.permissions.length} permissions`}</span>
                  </span>
                  <span className="shrink-0 text-caption text-ink-tertiary">{r.staffCount} staff</span>
                </button>
              </li>
            );
          })}
          {isNew && (
            <li className="flex items-center gap-3 bg-brand-subtle px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-ink-on-brand">
                <Add size={18} color="currentColor" />
              </span>
              <span className="text-label-md text-ink">New role</span>
            </li>
          )}
        </ul>
      </section>

      {/* editor */}
      {draft && (
        <section className="flex flex-col gap-5 rounded-xl border border-line bg-surface-card p-5 shadow-xs sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-h5 text-ink">{isNew ? "Create a role" : draft.name}</h2>
              <p className="text-body-sm text-ink-secondary">
                {locked ? "The Admin role always has every permission and can’t be changed." : `${draft.permissions.length} of ${ALL_PERMISSIONS.length} permissions`}
              </p>
            </div>
            {!isNew && role && !role.builtIn && (
              <Button variant="ghost" size="sm" onClick={remove} leftIcon={<Trash size={16} color="currentColor" />} className="text-error-fg hover:bg-error-bg">
                Delete role
              </Button>
            )}
          </div>

          {editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Role name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="For example: Payments officer"
                disabled={!isNew && role?.builtIn}
                error={tried && draft.name.trim().length < 2 ? "Give the role a name" : undefined}
              />
              <Input label="Description" hint="Optional" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What this role is for" />
            </div>
          )}

          <div className="flex flex-col gap-4">
            {PERMISSION_GROUPS.map((g) => (
              <fieldset key={g.title} className="rounded-lg border border-line p-4">
                <legend className="px-1 text-overline uppercase text-brand-text">{g.title}</legend>
                <div className="grid gap-3 md:grid-cols-2">
                  {g.items.map((p) => (
                    <Checkbox
                      key={p.id}
                      checked={draft.permissions.includes(p.id)}
                      onChange={() => !locked && toggle(p.id)}
                      disabled={locked}
                      className={cn("rounded-md p-2", !locked && "hover:bg-surface-subtle")}
                    >
                      <span className="block text-label-md text-ink">{p.label}</span>
                      <span className="block text-body-xs text-ink-tertiary">{p.hint}</span>
                    </Checkbox>
                  ))}
                </div>
              </fieldset>
            ))}
            {tried && !draft.permissions.length && <p className="text-body-sm text-error-fg">Choose at least one permission</p>}
          </div>

          {editing && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
              {isNew && (
                <Button variant="outline" size="md" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
              )}
              <Button size="md" loading={busy} disabled={!dirty} onClick={save}>
                {isNew ? "Create role" : "Save changes"}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* ───────────── Staff accounts ───────────── */

function StaffPanel({ staff, roles, onChanged }: Readonly<{ staff: StaffAccount[] | null; roles: AdminRole[]; onChanged: () => void }>) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [temp, setTemp] = useState<{ name: string; password: string } | null>(null);

  const act = async (s: StaffAccount, what: "deactivate" | "activate" | "reset" | { roleId: string }) => {
    try {
      if (what === "reset") {
        const { data } = await resetStaffPassword(s.userId);
        setTemp({ name: s.fullName, password: data.temporaryPassword });
      } else if (typeof what === "object") {
        await updateStaffAccount(s.userId, { roleId: what.roleId });
        toast.success("Role changed", "Their sessions end so the change applies now.");
      } else {
        await updateStaffAccount(s.userId, { status: what === "deactivate" ? "Deactivated" : "Active" });
        toast.success(what === "deactivate" ? `${s.fullName} can’t sign in now` : `${s.fullName} is active again`);
      }
      onChanged();
    } catch (e) {
      toast.error("That didn’t work", e instanceof Error ? e.message : "");
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-h6 text-ink">Staff accounts</h2>
          <p className="text-body-xs text-ink-tertiary">Staff sign in with a username and password. New accounts must change their password first.</p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)} leftIcon={<UserAdd size={16} color="currentColor" />}>
          Add staff
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-body-sm">
          <thead className="bg-surface-subtle text-label-sm text-ink-tertiary">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-3 py-3 font-semibold">Username</th>
              <th className="px-3 py-3 font-semibold">Role</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Last sign-in</th>
              <th className="px-5 py-3 text-right font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {staff === null && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-ink-tertiary">
                  Loading…
                </td>
              </tr>
            )}
            {staff?.map((s) => (
              <tr key={s.userId} className="hover:bg-surface-subtle">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-label-md text-ink-on-brand">{s.fullName.trim()[0]?.toUpperCase()}</span>
                    <div className="min-w-0">
                      <p className="truncate text-label-md text-ink">{s.fullName}</p>
                      <p className="truncate text-caption text-ink-tertiary">{s.email ?? "No email"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-ink-secondary">{s.username}</td>
                <td className="px-3 py-3">
                  <Badge tone={s.roleId === "admin" ? "premium" : "info"} icon={false}>
                    {s.roleName}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={s.status === "Active" ? "success" : "neutral"} icon={false}>
                      {s.status}
                    </Badge>
                    {s.mustChangePassword && <span className="text-caption text-warning-fg">Must change password</span>}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-ink-tertiary">
                  {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Never"}
                </td>
                <td className="px-5 py-3 text-right">
                  <StaffActions s={s} roles={roles} onAct={(w) => void act(s, w)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adding && (
        <AddStaffModal
          roles={roles}
          onClose={() => setAdding(false)}
          onCreated={(name, password) => {
            setAdding(false);
            setTemp({ name, password });
            onChanged();
          }}
        />
      )}
      {temp && <TempPasswordModal name={temp.name} password={temp.password} onClose={() => setTemp(null)} />}
    </section>
  );
}

function StaffActions({ s, roles, onAct }: Readonly<{ s: StaffAccount; roles: AdminRole[]; onAct: (w: "deactivate" | "activate" | "reset" | { roleId: string }) => void }>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  const pick = (w: Parameters<typeof onAct>[0]) => {
    setOpen(false);
    onAct(w);
  };
  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${s.fullName}`}
        className={cn("flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary ring-1 ring-inset ring-line hover:bg-brand-subtle hover:text-brand", open && "bg-brand-subtle text-brand")}
      >
        <More size={18} color="currentColor" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-30 w-56 overflow-hidden rounded-lg border border-line bg-surface-card py-1 text-left shadow-lg">
          <p className="px-3 pb-1 pt-2 text-caption text-ink-tertiary">Change role</p>
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              role="menuitemradio"
              aria-checked={r.id === s.roleId}
              disabled={r.id === s.roleId}
              onClick={() => pick({ roleId: r.id })}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-body-sm text-ink hover:bg-brand-subtle disabled:text-ink-tertiary disabled:hover:bg-transparent"
            >
              <SecurityUser size={16} color="currentColor" className="text-icon-brand" /> {r.name}
              {r.id === s.roleId && <span className="ml-auto text-caption">Current</span>}
            </button>
          ))}
          <div className="my-1 border-t border-line" />
          <button type="button" role="menuitem" onClick={() => pick("reset")} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-body-sm text-ink hover:bg-brand-subtle">
            <Key size={16} color="currentColor" className="text-icon-brand" /> Reset password
          </button>
          {s.status === "Active" ? (
            <button type="button" role="menuitem" onClick={() => pick("deactivate")} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-body-sm text-error-fg hover:bg-error-bg">
              <UserMinus size={16} color="currentColor" /> Deactivate
            </button>
          ) : (
            <button type="button" role="menuitem" onClick={() => pick("activate")} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-body-sm text-ink hover:bg-brand-subtle">
              <UserTick size={16} color="currentColor" className="text-icon-brand" /> Activate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Small wrapper so the staff forms keep their spacing — the dialog itself is the shared `ui/Modal` (S05-T05). */
function Modal({ title, onClose, children }: Readonly<{ title: string; onClose: () => void; children: React.ReactNode }>) {
  return (
    <SharedModal open onClose={onClose} title={title} size="md" bodyClassName="gap-5">
      {children}
    </SharedModal>
  );
}

/** Simple linear check (no backtracking regex): one "@", text before it, a dot inside the domain, no spaces. */
function looksLikeEmail(v: string) {
  const at = v.indexOf("@");
  if (/\s/.test(v) || at < 1 || at !== v.lastIndexOf("@")) return false;
  const domain = v.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  return dot > 0 && dot < domain.length - 1;
}

function AddStaffModal({ roles, onClose, onCreated }: Readonly<{ roles: AdminRole[]; onClose: () => void; onCreated: (name: string, password: string) => void }>) {
  const toast = useToast();
  const [f, setF] = useState({ fullName: "", username: "", email: "", roleId: roles.find((r) => r.id === "moderator")?.id ?? roles[0]?.id ?? "", password: makeTempPassword() });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const err = {
    fullName: f.fullName.trim().length < 2 ? "Enter their name" : undefined,
    username: !/^[a-z0-9._-]{3,30}$/.test(f.username) ? "3–30 lowercase letters, numbers, dot, dash or underscore" : undefined,
    email: f.email && !looksLikeEmail(f.email) ? "Enter a valid email" : undefined,
    password: f.password.length < 10 ? "At least 10 characters" : undefined,
  };
  const ok = !Object.values(err).some(Boolean) && f.roleId;
  const submit = async () => {
    setTried(true);
    if (!ok) return;
    setBusy(true);
    try {
      await createStaffAccount({ fullName: f.fullName.trim(), username: f.username, email: f.email.trim() || undefined, password: f.password, roleId: f.roleId });
      onCreated(f.fullName.trim(), f.password);
    } catch (e) {
      toast.error("Couldn’t create the account", e instanceof Error ? e.message : "");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Add a staff member" onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} error={tried ? err.fullName : undefined} placeholder="Shehani Perera" />
        <Input
          label="Username"
          value={f.username}
          onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
          error={tried ? err.username : undefined}
          placeholder="shehani"
          autoComplete="off"
        />
        <Input label="Email" hint="Optional" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={tried ? err.email : undefined} placeholder="name@vikasitha.lk" />
        <Select label="Role" options={roles.map((r) => ({ value: r.id, label: r.name }))} value={f.roleId} onChange={(v) => setF({ ...f, roleId: v })} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-end gap-2">
          <Input
            label="Temporary password"
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
            error={tried ? err.password : undefined}
            containerClassName="flex-1"
            className="font-mono"
            autoComplete="new-password"
          />
          <Button variant="outline" size="md" onClick={() => setF({ ...f, password: makeTempPassword() })} aria-label="Generate a new password" leftIcon={<Refresh size={18} color="currentColor" />}>
            New
          </Button>
        </div>
        <p className="text-body-xs text-ink-tertiary">They must change it the first time they sign in. Share it privately (not by email).</p>
      </div>
      <p className="rounded-md bg-surface-subtle px-3 py-2 text-body-xs text-ink-secondary">
        <b className="text-ink">{roles.find((r) => r.id === f.roleId)?.name}</b> has {roles.find((r) => r.id === f.roleId)?.permissions.length ?? 0} permissions. Change them in Roles &amp; permissions.
      </p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button variant="outline" size="md" className="sm:flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button size="md" className="sm:flex-1" loading={busy} onClick={submit} leftIcon={<UserAdd size={18} color="currentColor" />}>
          Create account
        </Button>
      </div>
    </Modal>
  );
}

function TempPasswordModal({ name, password, onClose }: Readonly<{ name: string; password: string; onClose: () => void }>) {
  const toast = useToast();
  return (
    <Modal title="Temporary password" onClose={onClose}>
      <p className="text-body-sm text-ink-secondary">
        Give this to <b className="text-ink">{name}</b> privately. It’s shown only once, and they must change it when they sign in.
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-brand-focus bg-brand-subtle p-4">
        <code className="min-w-0 flex-1 break-all font-mono text-h5 tracking-wide text-ink">{password}</code>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Copy size={16} color="currentColor" />}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(password);
              toast.success("Password copied");
            } catch {
              toast.error("Couldn’t copy", "Select and copy it manually.");
            }
          }}
        >
          Copy
        </Button>
      </div>
      <Button size="md" onClick={onClose}>
        Done
      </Button>
    </Modal>
  );
}
