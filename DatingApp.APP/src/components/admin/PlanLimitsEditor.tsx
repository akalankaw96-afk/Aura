"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Input, useToast } from "@/components/ui";
import { getPlanLimits, updatePlanLimits, type PlanLimit } from "@/lib/matching";

/* ------------------------------------------------------------------ */
/* Plan limits (Admin) — S03-T02: monthly allowances per plan           */
/* ------------------------------------------------------------------ */

const LIMIT_PLANS: PlanLimit["planId"][] = ["free", "gold", "platinum"];
const LIMIT_FEATURES: { id: PlanLimit["feature"]; label: string; hint: string }[] = [
  { id: "Search", label: "Searches", hint: "Filtered searches (plain browsing is free)" },
  { id: "ProfileView", label: "Profile views", hint: "Different profiles opened in full" },
  { id: "Interest", label: "Interests", hint: "Interests sent" },
  { id: "NewChat", label: "New chats", hint: "Conversations started (replies are free)" },
];
const limitKey = (plan: string, feature: string) => `${plan}:${feature}`;

/** Edit the monthly limits. Empty = unlimited. Changes apply to every member straight away. */
export function PlanLimitsEditor() {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => {
    getPlanLimits()
      .then((rows) => {
        const v = Object.fromEntries(rows.map((r) => [limitKey(r.planId, r.feature), r.monthlyLimit === null ? "" : String(r.monthlyLimit)]));
        setValues(v);
        setSaved(v);
      })
      .catch((err) => toast.error("Couldn’t load the limits", err instanceof Error ? err.message : ""));
    // toast isn't a stable reference — load once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(load, [load]);

  if (!values) return <p className="py-8 text-center text-body-sm text-ink-tertiary">Loading limits…</p>;

  const invalid = Object.values(values).some((v) => v.trim() !== "" && !/^\d{1,6}$/.test(v.trim()));
  const changed = Object.keys(values).filter((k) => values[k].trim() !== (saved[k] ?? "").trim());

  const save = async () => {
    if (invalid || changed.length === 0) return;
    setSaving(true);
    try {
      const rows = await updatePlanLimits(
        changed.map((k) => {
          const [planId, feature] = k.split(":") as [PlanLimit["planId"], PlanLimit["feature"]];
          const raw = values[k].trim();
          return { planId, feature, monthlyLimit: raw === "" ? null : Number(raw) };
        }),
      );
      const v = Object.fromEntries(rows.map((r) => [limitKey(r.planId, r.feature), r.monthlyLimit === null ? "" : String(r.monthlyLimit)]));
      setValues(v);
      setSaved(v);
      toast.success("Limits saved", "Members see the new numbers straight away.");
    } catch (err) {
      toast.error("Limits not saved", err instanceof Error ? err.message : "");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-h6 text-ink">Monthly plan limits</h2>
        <p className="text-body-sm text-ink-secondary">How many of each a member can use per calendar month. Leave a box empty for unlimited. Counts reset on the 1st.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr className="text-label-sm text-ink-tertiary">
              <th className="font-semibold">Feature</th>
              {LIMIT_PLANS.map((p) => (
                <th key={p} className="font-semibold capitalize">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LIMIT_FEATURES.map((f) => (
              <tr key={f.id}>
                <td className="pr-3 align-top">
                  <span className="block text-label-md text-ink">{f.label}</span>
                  <span className="block text-caption text-ink-tertiary">{f.hint}</span>
                </td>
                {LIMIT_PLANS.map((p) => {
                  const k = limitKey(p, f.id);
                  const v = values[k] ?? "";
                  const bad = v.trim() !== "" && !/^\d{1,6}$/.test(v.trim());
                  return (
                    <td key={p} className="pr-3 align-top">
                      <Input
                        aria-label={`${f.label} per month on ${p}`}
                        inputMode="numeric"
                        placeholder="Unlimited"
                        value={v}
                        onChange={(e) => setValues((all) => ({ ...(all ?? {}), [k]: e.target.value }))}
                        error={bad ? "0–100000, or empty" : undefined}
                        containerClassName="w-[130px]"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {changed.length > 0 && <span className="text-body-sm text-ink-tertiary">{changed.length} change{changed.length === 1 ? "" : "s"} not saved</span>}
        <Button variant="outline" disabled={changed.length === 0 || saving} onClick={() => setValues(saved)}>Undo</Button>
        <Button disabled={invalid || changed.length === 0 || saving} onClick={save}>{saving ? "Saving…" : "Save limits"}</Button>
      </div>
    </Card>
  );
}
