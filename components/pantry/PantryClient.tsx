"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: string | null;
  unit: string | null;
  last_updated_by: string | null;
  last_updated_at: string;
  profiles: { full_name: string | null } | null;
}

const CATEGORIES = [
  "Dry goods", "Canned goods", "Condiments", "Spices", "Drinks",
  "Cleaning", "First aid", "Tools", "Propane", "Fuel", "Other",
];

const emptyForm = { name: "", category: "Dry goods", quantity: "", unit: "" };

export function PantryClient({
  items: initial,
  currentUserId,
}: {
  items: PantryItem[];
  currentUserId: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<PantryItem[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<PantryItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  function openAdd() {
    setEditItem(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(item: PantryItem) {
    setEditItem(item);
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity ?? "",
      unit: item.unit ?? "",
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      category: form.category,
      quantity: form.quantity || null,
      unit: form.unit || null,
      last_updated_by: currentUserId,
      last_updated_at: new Date().toISOString(),
    };
    if (editItem) {
      const { data } = await supabase
        .from("pantry_items")
        .update(payload)
        .eq("id", editItem.id)
        .select("*, profiles(full_name)")
        .single();
      if (data) setItems((prev) => prev.map((i) => i.id === editItem.id ? (data as PantryItem) : i));
    } else {
      const { data } = await supabase
        .from("pantry_items")
        .insert(payload)
        .select("*, profiles(full_name)")
        .single();
      if (data) setItems((prev) => [...prev, data as PantryItem]);
    }
    setShowForm(false);
  }

  async function deleteItem(id: string) {
    await supabase.from("pantry_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setShowForm(false);
  }

  const filtered = items.filter(
    (i) =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const byCategory = CATEGORIES.map((cat) => ({
    cat,
    items: filtered.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  const uncategorized = filtered.filter(
    (i) => !CATEGORIES.includes(i.category)
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search pantry…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      <div className="space-y-5">
        {byCategory.map(({ cat, items: catItems }) => (
          <div key={cat}>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
              {cat}
            </h3>
            <div className="space-y-1.5">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.quantity && `${item.quantity}${item.unit ? " " + item.unit : ""} · `}
                      Updated {formatDate(item.last_updated_at)}
                      {item.profiles?.full_name ? ` by ${item.profiles.full_name}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(item)}
                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {uncategorized.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
              Other
            </h3>
            <div className="space-y-1.5">
              {uncategorized.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="flex-1 text-sm font-medium">{item.name}</div>
                  <button onClick={() => openEdit(item)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No items recorded yet. Add what's at the cottage.
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader onClose={() => setShowForm(false)}>
            <DialogTitle>{editItem ? "Edit Item" : "Add Pantry Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Item name</label>
              <input
                type="text"
                placeholder="e.g. Rice, Candles, WD-40…"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="flex h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Quantity</label>
                <input
                  type="text"
                  placeholder="e.g. Half full, 2 boxes"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Unit</label>
                <input
                  type="text"
                  placeholder="e.g. kg, L, cans"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-between pt-1">
              {editItem && (
                <Button variant="destructive" size="sm" onClick={() => deleteItem(editItem.id)}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={save} disabled={!form.name.trim()}>Save</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
