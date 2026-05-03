"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

interface Expense {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  paid_by: string;
  date: string;
  profiles: { full_name: string | null } | null;
}

interface Split {
  id: string;
  expense_id: string;
  user_id: string;
  amount_owed: number;
  is_settled: boolean;
}

interface Attendee {
  id: string;
  full_name: string | null;
}

export function ExpensesClient({
  tripId,
  expenses: initial,
  splits: initialSplits,
  attendees,
  currentUserId,
}: {
  tripId: string;
  expenses: Expense[];
  splits: Split[];
  attendees: Attendee[];
  currentUserId: string;
}) {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<Expense[]>(initial);
  const [splits, setSplits] = useState<Split[]>(initialSplits);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  async function addExpense() {
    if (!description.trim() || !amount || !paidBy) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    const { data: expense } = await supabase
      .from("expenses")
      .insert({
        trip_id: tripId,
        description: description.trim(),
        amount: amt,
        paid_by: paidBy,
        date,
      })
      .select("*, profiles(full_name)")
      .single();

    if (!expense) return;

    // Split equally among all attendees
    const perPerson = amt / attendees.length;
    const splitInserts = attendees.map((a) => ({
      expense_id: expense.id,
      user_id: a.id,
      amount_owed: parseFloat(perPerson.toFixed(2)),
      is_settled: a.id === paidBy,
    }));

    const { data: newSplits } = await supabase
      .from("expense_splits")
      .insert(splitInserts)
      .select();

    setExpenses((prev) => [expense as Expense, ...prev]);
    if (newSplits) setSplits((prev) => [...prev, ...(newSplits as Split[])]);

    setShowForm(false);
    setDescription("");
    setAmount("");
  }

  async function deleteExpense(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setSplits((prev) => prev.filter((s) => s.expense_id !== id));
  }

  async function toggleSettled(split: Split) {
    const val = !split.is_settled;
    setSplits((prev) => prev.map((s) => s.id === split.id ? { ...s, is_settled: val } : s));
    await supabase.from("expense_splits").update({ is_settled: val }).eq("id", split.id);
  }

  // Calculate settlement summary
  // Net balance: positive = owed money, negative = owes money
  const balances: Record<string, number> = {};
  attendees.forEach((a) => { balances[a.id] = 0; });

  expenses.forEach((exp) => {
    balances[exp.paid_by] = (balances[exp.paid_by] ?? 0) + exp.amount;
  });
  splits.filter((s) => !s.is_settled).forEach((s) => {
    balances[s.user_id] = (balances[s.user_id] ?? 0) - s.amount_owed;
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Add Expense
        </Button>
      </div>

      {/* Summary */}
      {expenses.length > 0 && (
        <Card className="mb-5 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">Settlement Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-3">
              Total spent: <strong className="text-foreground">{formatCurrency(total)}</strong>
              {attendees.length > 0 && (
                <> · {formatCurrency(total / attendees.length)} per person</>
              )}
            </div>
            <div className="space-y-1.5">
              {attendees.map((a) => {
                const bal = balances[a.id] ?? 0;
                return (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 font-medium">{a.full_name ?? "Member"}</span>
                    {bal > 0.01 ? (
                      <span className="text-green-700 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        owed {formatCurrency(bal)}
                      </span>
                    ) : bal < -0.01 ? (
                      <span className="text-rose-700 flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" />
                        owes {formatCurrency(-bal)}
                      </span>
                    ) : (
                      <Badge variant="success">settled up</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense list */}
      <div className="space-y-2">
        {expenses.map((exp) => {
          const expSplits = splits.filter((s) => s.expense_id === exp.id);
          return (
            <Card key={exp.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{exp.description}</div>
                    <div className="text-xs text-muted-foreground">
                      Paid by {exp.profiles?.full_name ?? "?"} ·{" "}
                      {format(new Date(exp.date), "MMM d")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold">{formatCurrency(exp.amount)}</span>
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {expSplits.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border flex flex-wrap gap-2">
                    {expSplits.map((split) => {
                      const person = attendees.find((a) => a.id === split.user_id);
                      return (
                        <button
                          key={split.id}
                          onClick={() => toggleSettled(split)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            split.is_settled
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          {person?.full_name?.split(" ")[0] ?? "?"}: {formatCurrency(split.amount_owed)}
                          {split.is_settled ? " ✓" : ""}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No expenses yet. Add grocery runs and shared costs here.
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader onClose={() => setShowForm(false)}>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <input
                type="text"
                placeholder="e.g. Grocery run, Propane refill…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Amount ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Paid by</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="flex h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {attendees.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name ?? "Member"}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Cost will be split equally among all {attendees.length} attendees.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={addExpense} disabled={!description.trim() || !amount}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
