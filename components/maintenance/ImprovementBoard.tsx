"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, X, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";

const STATUSES = [
  { key: "idea", label: "💡 Ideas", color: "bg-slate-50 border-slate-200" },
  { key: "planned", label: "📋 Planned", color: "bg-blue-50 border-blue-200" },
  { key: "in-progress", label: "🔨 In Progress", color: "bg-amber-50 border-amber-200" },
  { key: "done", label: "✅ Done", color: "bg-green-50 border-green-200" },
] as const;

type Status = (typeof STATUSES)[number]["key"];

interface Improvement {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: "low" | "medium" | "high";
  suggested_by: string;
  estimated_cost: number | null;
  notes: string | null;
  profiles: { full_name: string | null } | null;
}

interface Profile {
  id: string;
  full_name: string | null;
}

interface ImprovementBoardProps {
  improvements: Improvement[];
  profiles: Profile[];
  currentUserId: string;
}

const emptyForm = {
  title: "",
  description: "",
  status: "idea" as Status,
  priority: "medium" as "low" | "medium" | "high",
  estimated_cost: "",
  notes: "",
};

export function ImprovementBoard({ improvements: initial, profiles, currentUserId }: ImprovementBoardProps) {
  const supabase = createClient();
  const [items, setItems] = useState<Improvement[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Improvement | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openAdd() {
    setEditItem(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(item: Improvement) {
    setEditItem(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      status: item.status,
      priority: item.priority,
      estimated_cost: item.estimated_cost ? String(item.estimated_cost) : "",
      notes: item.notes ?? "",
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
      notes: form.notes || null,
    };

    if (editItem) {
      const { data } = await supabase
        .from("improvements")
        .update(payload)
        .eq("id", editItem.id)
        .select("*, profiles(full_name)")
        .single();
      if (data) setItems((prev) => prev.map((i) => (i.id === editItem.id ? (data as Improvement) : i)));
    } else {
      const { data } = await supabase
        .from("improvements")
        .insert({ ...payload, suggested_by: currentUserId })
        .select("*, profiles(full_name)")
        .single();
      if (data) setItems((prev) => [data as Improvement, ...prev]);
    }
    setShowForm(false);
  }

  async function deleteItem(id: string) {
    await supabase.from("improvements").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setShowForm(false);
  }

  async function moveStatus(item: Improvement, status: Status) {
    const { data } = await supabase
      .from("improvements")
      .update({ status })
      .eq("id", item.id)
      .select("*, profiles(full_name)")
      .single();
    if (data) setItems((prev) => prev.map((i) => (i.id === item.id ? (data as Improvement) : i)));
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Idea
        </Button>
      </div>

      {/* Kanban columns — scroll horizontally on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-4 min-w-max sm:min-w-0 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {STATUSES.map(({ key, label, color }) => {
            const colItems = items.filter((i) => i.status === key);
            return (
              <div key={key} className={cn("rounded-xl border p-3 w-64 sm:w-auto", color)}>
                <div className="font-semibold text-sm mb-3">
                  {label}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({colItems.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {colItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-border"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-medium text-sm leading-tight flex-1">
                          {item.title}
                        </span>
                        <button
                          onClick={() => openEdit(item)}
                          className="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Badge
                          variant={
                            item.priority === "high"
                              ? "destructive"
                              : item.priority === "medium"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {item.priority}
                        </Badge>
                        {item.estimated_cost && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(item.estimated_cost)}
                          </span>
                        )}
                        {item.profiles?.full_name && (
                          <span className="text-xs text-muted-foreground">
                            — {item.profiles.full_name}
                          </span>
                        )}
                      </div>
                      {/* Quick move buttons */}
                      <div className="flex gap-1 mt-2">
                        {STATUSES.filter((s) => s.key !== key).map((s) => (
                          <button
                            key={s.key}
                            onClick={() => moveStatus(item, s.key)}
                            className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
                          >
                            → {s.label.split(" ")[1]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader onClose={() => setShowForm(false)}>
            <DialogTitle>{editItem ? "Edit Idea" : "New Idea"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <input
                type="text"
                placeholder="e.g. New composting toilet, solar expansion…"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea
                placeholder="More details…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
                  className="flex h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as any }))}
                  className="flex h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Estimated cost{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={form.estimated_cost}
                onChange={(e) => setForm((f) => ({ ...f, estimated_cost: e.target.value }))}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-2 justify-between pt-1">
              {editItem && (
                <Button variant="destructive" size="sm" onClick={() => deleteItem(editItem.id)}>
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={save} disabled={!form.title.trim()}>Save</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
