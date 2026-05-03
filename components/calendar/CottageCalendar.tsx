"use client";

import { useState, useTransition } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isToday,
  parseISO,
  isWithinInterval,
  addMonths,
  subMonths,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MEMBER_COLORS = [
  "bg-blue-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-rose-400",
  "bg-violet-400",
  "bg-cyan-400",
];

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Stay {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  notes: string | null;
  is_confirmed: boolean;
  profiles: Profile | null;
}

interface CottageCalendarProps {
  stays: Stay[];
  profiles: Profile[];
  currentUserId: string;
}

export function CottageCalendar({
  stays: initialStays,
  profiles,
  currentUserId,
}: CottageCalendarProps) {
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stays, setStays] = useState<Stay[]>(initialStays);
  const [showForm, setShowForm] = useState(false);
  const [editStay, setEditStay] = useState<Stay | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  const profileColorMap: Record<string, string> = {};
  profiles.forEach((p, i) => {
    profileColorMap[p.id] = MEMBER_COLORS[i % MEMBER_COLORS.length];
  });

  function getStaysForDay(date: Date) {
    return stays.filter((stay) => {
      const s = parseISO(stay.start_date);
      const e = parseISO(stay.end_date);
      return isWithinInterval(startOfDay(date), {
        start: startOfDay(s),
        end: startOfDay(e),
      });
    });
  }

  function openAdd() {
    setEditStay(null);
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setEndDate(format(new Date(), "yyyy-MM-dd"));
    setNotes("");
    setShowForm(true);
  }

  function openEdit(stay: Stay) {
    setEditStay(stay);
    setStartDate(stay.start_date);
    setEndDate(stay.end_date);
    setNotes(stay.notes ?? "");
    setShowForm(true);
  }

  async function saveStay() {
    if (!startDate || !endDate) return;

    if (editStay) {
      const { data, error } = await supabase
        .from("cottage_stays")
        .update({ start_date: startDate, end_date: endDate, notes: notes || null })
        .eq("id", editStay.id)
        .select("*, profiles(id, full_name, avatar_url)")
        .single();
      if (!error && data) {
        setStays((prev) => prev.map((s) => (s.id === editStay.id ? (data as Stay) : s)));
      }
    } else {
      const { data, error } = await supabase
        .from("cottage_stays")
        .insert({
          user_id: currentUserId,
          start_date: startDate,
          end_date: endDate,
          notes: notes || null,
          is_confirmed: true,
        })
        .select("*, profiles(id, full_name, avatar_url)")
        .single();
      if (!error && data) {
        setStays((prev) => [...prev, data as Stay]);
      }
    }
    setShowForm(false);
  }

  async function deleteStay(id: string) {
    await supabase.from("cottage_stays").delete().eq("id", id);
    setStays((prev) => prev.filter((s) => s.id !== id));
    setShowForm(false);
  }

  // List unique stays for the visible month
  const monthStays = stays.filter((stay) => {
    const s = parseISO(stay.start_date);
    const e = parseISO(stay.end_date);
    return s <= monthEnd && e >= monthStart;
  });

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-semibold text-lg">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {/* Padding cells */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-background/50 h-16 sm:h-20" />
        ))}

        {days.map((day) => {
          const dayStays = getStaysForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "bg-background p-1 h-16 sm:h-20 flex flex-col",
                !isCurrentMonth && "bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                  isToday(day)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="flex flex-wrap gap-0.5 mt-0.5 overflow-hidden">
                {dayStays.slice(0, 3).map((stay) => (
                  <div
                    key={stay.id}
                    className={cn(
                      "h-1.5 rounded-full flex-1 min-w-[6px]",
                      profileColorMap[stay.user_id] ?? "bg-gray-400"
                    )}
                    title={stay.profiles?.full_name ?? "Member"}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5 text-sm">
            <div
              className={cn(
                "w-3 h-3 rounded-full",
                profileColorMap[p.id] ?? "bg-gray-400"
              )}
            />
            <span className="text-sm">{p.full_name ?? "Member"}</span>
          </div>
        ))}
      </div>

      {/* This month's stays list */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">
            {format(currentDate, "MMMM")} Stays
          </h3>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add My Stay
          </Button>
        </div>

        {monthStays.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No stays logged for this month yet.
          </p>
        ) : (
          <div className="space-y-2">
            {monthStays
              .sort(
                (a, b) =>
                  new Date(a.start_date).getTime() -
                  new Date(b.start_date).getTime()
              )
              .map((stay) => (
                <div
                  key={stay.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full shrink-0",
                      profileColorMap[stay.user_id] ?? "bg-gray-400"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">
                      {stay.profiles?.full_name ?? "Member"}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {" · "}
                      {format(parseISO(stay.start_date), "MMM d")} –{" "}
                      {format(parseISO(stay.end_date), "MMM d")}
                    </span>
                    {stay.notes && (
                      <div className="text-xs text-muted-foreground truncate">
                        {stay.notes}
                      </div>
                    )}
                  </div>
                  {stay.user_id === currentUserId && (
                    <button
                      onClick={() => openEdit(stay)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader onClose={() => setShowForm(false)}>
            <DialogTitle>
              {editStay ? "Edit Stay" : "Add My Stay"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Arrival date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Departure date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Notes <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Bringing the dog, arriving by boat"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex gap-2 justify-between pt-1">
              {editStay && editStay.user_id === currentUserId && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteStay(editStay.id)}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button onClick={saveStay} disabled={!startDate || !endDate}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
