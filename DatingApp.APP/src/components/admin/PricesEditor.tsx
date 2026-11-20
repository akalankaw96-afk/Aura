"use client";

import React, { useEffect, useState } from "react";
import { Badge, Button, Card, Input, useToast } from "@/components/ui";
import { getAdminPrices, updateAdminPrices, type PlanPrice } from "@/lib/billing";

/* ------------------------------------------------------------------ */
/* Prices (Admin) — S04-T01: plan and boost prices, stored in cents      */
/* ------------------------------------------------------------------ */

const priceKey = (p: Pick<PlanPrice, "product" | "planId" | "months" | "days">) => `${p.product}:${p.planId}:${p.months}:${p.days}`;
const priceLabel = (p: PlanPrice) =>
  p.product === "boost" ? `Boost · ${p.days} days` : `${p.planId === "gold" ? "Gold" : "Platinum"} · ${p.months} month${p.months === 1 ? "" : "s"}`;

/** Edit prices in rupees (whole or with cents). Changes show on the Plans page straight away. */
export function PricesEditor() {
  const toast = useToast();
  const [rows, setRows] = useState<PlanPrice[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fill = (list: PlanPrice[]) => {
    setRows(list);
    setValues(Object.fromEntries(list.map((p) => [priceKey(p), String(p.amountCents / 100)])));
  };
  useEffect(() => {
    getAdminPrices().then(fill).catch((err) => toast.error("Couldn’t load prices", err instanceof Error ? err.message : ""));
    // toast isn't a stable reference — load once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!rows) return <p className="py-8 text-center text-body-sm text-ink-tertiary">Loading prices…</p>;

  const valid = (v: string) => /^\d{1,8}(\.\d{1,2})?$/.test(v.trim());
  const changed = rows.filter((p) => valid(values[priceKey(p)] ?? "") && Math.round(Number(values[priceKey(p)]) * 100) !== p.amountCents);
  const invalid = rows.some((p) => !valid(values[priceKey(p)] ?? ""));

  const save = async () => {
    if (invalid || changed.length === 0) return;
    setSaving(true);
    try {
      fill(await updateAdminPrices(changed.map((p) => ({ product: p.product, planId: p.planId, months: p.months, days: p.days, amountCents: Math.round(Number(values[priceKey(p)]) * 100) }))));
      toast.success("Prices saved", "The Plans page shows the new prices now. Orders already made keep their price.");
    } catch (err) {
      toast.error("Prices not saved", err instanceof Error ? err.message : "");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-h6 text-ink">Prices (LKR)</h2>
        <p className="text-body-sm text-ink-secondary">What members pay for each plan length and for a boost. The saving per length is worked out from the 1-month price.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((p) => {
          const k = priceKey(p);
          const v = values[k] ?? "";
          return (
            <li key={k} className="flex flex-col gap-1 rounded-lg border border-line p-3">
              <span className="flex items-center justify-between gap-2 text-label-md text-ink">
                {priceLabel(p)}
                {p.savePercent ? <Badge tone="success">Save {p.savePercent}%</Badge> : null}
              </span>
              <Input
                aria-label={`Price of ${priceLabel(p)} in LKR`}
                inputMode="decimal"
                value={v}
                onChange={(e) => setValues((all) => ({ ...all, [k]: e.target.value }))}
                error={valid(v) ? undefined : "Enter an amount, e.g. 2500"}
              />
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {changed.length > 0 && <span className="text-body-sm text-ink-tertiary">{changed.length} change{changed.length === 1 ? "" : "s"} not saved</span>}
        <Button variant="outline" disabled={changed.length === 0 || saving} onClick={() => fill(rows)}>Undo</Button>
        <Button disabled={invalid || changed.length === 0 || saving} onClick={save}>{saving ? "Saving…" : "Save prices"}</Button>
      </div>
    </Card>
  );
}
