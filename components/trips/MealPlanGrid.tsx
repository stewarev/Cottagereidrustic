"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, ChevronDown, ChevronRight, Check, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_ICONS: Record<MealType, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

interface Meal {
  id: string;
  trip_id: string;
  name: string;
  meal_type: MealType;
  date: string;
  notes: string | null;
}

interface MealItem {
  id: string;
  meal_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  assigned_to: string | null;
  cost: number | null;
  is_brought: boolean;
}

interface Profile {
  id: string;
  full_name: string | null;
}

interface MealPlanGridProps {
  tripId: string;
  tripDays: string[];
  meals: Meal[];
  mealItems: MealItem[];
  profiles: Profile[];
  currentUserId: string;
}

export function MealPlanGrid({
  tripId,
  tripDays,
  meals: initialMeals,
  mealItems: initialItems,
  profiles,
}: MealPlanGridProps) {
  const supabase = createClient();
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [items, setItems] = useState<MealItem[]>(initialItems);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  // Add meal dialog
  const [mealDialog, setMealDialog] = useState<{ date: string; mealType: MealType } | null>(null);
  const [mealName, setMealName] = useState("");

  // Add item dialog
  const [itemDialog, setItemDialog] = useState<string | null>(null); // meal_id
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemAssigned, setItemAssigned] = useState("");

  async function addMeal() {
    if (!mealDialog || !mealName.trim()) return;
    const { data } = await supabase
      .from("meals")
      .insert({
        trip_id: tripId,
        name: mealName.trim(),
        meal_type: mealDialog.mealType,
        date: mealDialog.date,
      })
      .select()
      .single();
    if (data) setMeals((prev) => [...prev, data as Meal]);
    setMealDialog(null);
    setMealName("");
  }

  async function addItem() {
    if (!itemDialog || !itemName.trim()) return;
    const { data } = await supabase
      .from("meal_items")
      .insert({
        meal_id: itemDialog,
        name: itemName.trim(),
        quantity: itemQty || null,
        assigned_to: itemAssigned || null,
        is_brought: false,
      })
      .select()
      .single();
    if (data) setItems((prev) => [...prev, data as MealItem]);
    setItemDialog(null);
    setItemName("");
    setItemQty("");
    setItemAssigned("");
  }

  async function toggleBrought(item: MealItem) {
    const newVal = !item.is_brought;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_brought: newVal } : i))
    );
    await supabase
      .from("meal_items")
      .update({ is_brought: newVal })
      .eq("id", item.id);
  }

  async function deleteMeal(mealId: string) {
    await supabase.from("meals").delete().eq("id", mealId);
    setMeals((prev) => prev.filter((m) => m.id !== mealId));
    setItems((prev) => prev.filter((i) => i.meal_id !== mealId));
  }

  return (
    <div className="space-y-6">
      {tripDays.map((day) => {
        const dayMeals = meals.filter((m) => m.date === day);
        const dayMealsByType: Partial<Record<MealType, Meal>> = {};
        dayMeals.forEach((m) => { dayMealsByType[m.meal_type] = m; });

        return (
          <div key={day}>
            <h2 className="font-semibold mb-3">
              {format(parseISO(day), "EEEE, MMMM d")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MEAL_TYPES.map((mealType) => {
                const meal = dayMealsByType[mealType];
                const mealItemsList = meal ? items.filter((i) => i.meal_id === meal.id) : [];
                const broughtCount = mealItemsList.filter((i) => i.is_brought).length;
                const expanded = meal && expandedMeal === meal.id;

                return (
                  <div key={mealType} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground font-medium capitalize">
                          {MEAL_ICONS[mealType]} {mealType}
                        </span>
                        {meal && (
                          <button
                            onClick={() => deleteMeal(meal.id)}
                            className="text-muted-foreground hover:text-destructive p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {meal ? (
                        <div>
                          <div className="font-medium text-sm leading-tight">{meal.name}</div>
                          {mealItemsList.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {broughtCount}/{mealItemsList.length} items brought
                            </div>
                          )}
                          <div className="flex gap-1.5 mt-2">
                            <button
                              onClick={() => setExpandedMeal(expanded ? null : meal.id)}
                              className="text-xs text-primary hover:underline"
                            >
                              {expanded ? "Hide" : "Items"}
                              {mealItemsList.length > 0 && ` (${mealItemsList.length})`}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setMealDialog({ date: day, mealType });
                            setMealName("");
                          }}
                          className="w-full text-left text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
                        >
                          <Plus className="w-3 h-3" /> Add meal
                        </button>
                      )}
                    </div>

                    {expanded && meal && (
                      <div className="border-t border-border p-2.5 space-y-1.5 bg-muted/20">
                        {mealItemsList.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <button
                              onClick={() => toggleBrought(item)}
                              className={cn(
                                "w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
                                item.is_brought
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-muted-foreground"
                              )}
                            >
                              {item.is_brought && <Check className="w-2.5 h-2.5" />}
                            </button>
                            <span className={cn("text-xs flex-1", item.is_brought && "line-through text-muted-foreground")}>
                              {item.name}
                              {item.quantity && ` (${item.quantity})`}
                            </span>
                            {item.assigned_to && (
                              <span className="text-xs text-muted-foreground">
                                {profiles.find((p) => p.id === item.assigned_to)?.full_name?.split(" ")[0] ?? "?"}
                              </span>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => setItemDialog(meal.id)}
                          className="text-xs text-primary flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3 h-3" /> Add ingredient
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Add meal dialog */}
      <Dialog open={!!mealDialog} onOpenChange={(o) => !o && setMealDialog(null)}>
        <DialogContent>
          <DialogHeader onClose={() => setMealDialog(null)}>
            <DialogTitle>
              Add {mealDialog?.mealType} — {mealDialog?.date && format(parseISO(mealDialog.date), "MMM d")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Meal name</label>
              <input
                type="text"
                placeholder="e.g. Pancakes, Grilled salmon…"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMeal()}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMealDialog(null)}>Cancel</Button>
              <Button onClick={addMeal} disabled={!mealName.trim()}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add ingredient dialog */}
      <Dialog open={!!itemDialog} onOpenChange={(o) => !o && setItemDialog(null)}>
        <DialogContent>
          <DialogHeader onClose={() => setItemDialog(null)}>
            <DialogTitle>Add Ingredient</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Item</label>
              <input
                type="text"
                placeholder="e.g. Eggs, Olive oil…"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Quantity</label>
              <input
                type="text"
                placeholder="e.g. 1 dozen, 500g…"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Assigned to <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <select
                value={itemAssigned}
                onChange={(e) => setItemAssigned(e.target.value)}
                className="flex h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Unassigned</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name ?? "Member"}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setItemDialog(null)}>Cancel</Button>
              <Button onClick={addItem} disabled={!itemName.trim()}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
