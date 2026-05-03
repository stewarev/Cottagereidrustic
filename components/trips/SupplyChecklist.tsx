"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Check, Home, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SupplyCategory = "food" | "water" | "alcohol" | "supplies" | "other";
const CATEGORIES: { key: SupplyCategory; label: string; icon: string }[] = [
  { key: "food", label: "Food", icon: "🍱" },
  { key: "water", label: "Water", icon: "💧" },
  { key: "alcohol", label: "Drinks & Alcohol", icon: "🍷" },
  { key: "supplies", label: "Supplies & Gear", icon: "🧰" },
  { key: "other", label: "Other", icon: "📦" },
];

interface SupplyItem {
  id: string;
  trip_id: string;
  name: string;
  category: SupplyCategory;
  quantity: string | null;
  unit: string | null;
  assigned_to: string | null;
  cost: number | null;
  is_brought: boolean;
  is_at_cottage: boolean;
}

interface Profile {
  id: string;
  full_name: string | null;
}

const emptyForm = {
  name: "",
  category: "food" as SupplyCategory,
  quantity: "",
  assigned_to: "",
  cost: "",
  is_at_cottage: false,
};

export function SupplyChecklist({
  tripId,
  supplies: initial,
  profiles,
}: {
  tripId: string;
  supplies: SupplyItem[];
  profiles: Profile[];
}) {
  const supabase = createClient();
  const [items, setItems] = useState<SupplyItem[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const byCategory = CATEGORIES.map(({ key, label, icon }) => ({
    key,
    label,
    icon,
    items: items.filter((i) => i.category === key),
  })).filter((c) => c.items.length > 0 || c.key === "food");

  async function toggleBrought(item: SupplyItem) {
    const val = !item.is_brought;
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_brought: val } : i));
    await supabase.from("supply_items").update({ is_brought: val }).eq("id", item.id);
  }

  async function addItem() {
    if (!form.name.trim()) return;
    const { data } = await supabase
      .from("supply_items")
      .insert({
        trip_id: tripId,
        name: form.name.trim(),
        category: form.category,
        quantity: form.quantity || null,
        assigned_to: form.assigned_to || null,
        cost: form.cost ? parseFloat(form.cost) : null,
        is_at_cottage: form.is_at_cottage,
        is_brought: form.is_at_cottage,
      })
      .select()
      .single();
    if (data) setItems((prev) => [...prev, data as SupplyItem]);
    setShowForm(false);
    setForm(emptyForm);
  }

  async function deleteItem(id: string) {
    await supabase.from("supply_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const totalItems = items.length;
  const broughtItems = items.filter((i) => i.is_brought).length;

  return (
    <div>
      {totalItems > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <div className="flex-1 bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(broughtItems / totalItems) * 100}%` }}
            />
          </div>
          <span>{broughtItems}/{totalItems} packed</span>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={() => { setForm(emptyForm); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      <div className="space-y-5">
        {CATEGORIES.map(({ key, label, icon }) => {
          const catItems = items.filter((i) => i.category === key);
          if (catItems.length === 0) return null;
          return (
            <div key={key}>
              <h3 className="font-semibold text-sm mb-2">
                {icon} {label}
              </h3>
              <div className="space-y-1.5">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border border-border bg-card",
                      item.is_brought && "opacity-60"
                    )}
                  >
                    <button
                      onClick={() => toggleBrought(item)}
                      className={cn(
                        "w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                        item.is_brought
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground"
                      )}
                    >
                      {item.is_brought && <Check className="w-3 h-3" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <span className={cn("text-sm font-medium", item.is_brought && "line-through")}>
                        {item.name}
                        {item.quantity && (
                          <span className="font-normal text-muted-foreground"> — {item.quantity}</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.assigned_to && (
                          <span className="text-xs text-muted-foreground">
                            {profiles.find((p) => p.id === item.assigned_to)?.full_name ?? "?"}
                          </span>
                        )}
                        {item.is_at_cottage && (
                          <span className="text-xs text-green-700 flex items-center gap-0.5">
                            <Home className="w-3 h-3" /> at cottage
                          </span>
                        )}
                        {item.cost && (
                          <span className="text-xs text-muted-foreground">
                            ${item.cost.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No items yet. Add what needs to be brought for this trip.
        </div>
      )}

      {/* Add item dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader onClose={() => setShowForm(false)}>
            <DialogTitle>Add Supply Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Item name</label>
              <input
                type="text"
                placeholder="e.g. Water jugs, Wine, Sunscreen…"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as SupplyCategory }))}
                  className="flex h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Quantity</label>
                <input
                  type="text"
                  placeholder="e.g. 4 jugs, 2 bottles"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Assigned to</label>
                <select
                  value={form.assigned_to}
                  onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                  className="flex h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Anyone</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name ?? "Member"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Cost ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.cost}
                  onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_at_cottage}
                onChange={(e) => setForm((f) => ({ ...f, is_at_cottage: e.target.checked }))}
                className="rounded"
              />
              Already at the cottage (no need to bring)
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={addItem} disabled={!form.name.trim()}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
