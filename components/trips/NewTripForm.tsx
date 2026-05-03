"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export function NewTripForm({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const today = format(new Date(), "yyyy-MM-dd");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [attendees, setAttendees] = useState<string[]>([currentUserId]);
  const [error, setError] = useState<string | null>(null);

  function toggleAttendee(id: string) {
    setAttendees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  async function create() {
    if (!name.trim()) { setError("Trip name is required."); return; }
    if (!startDate || !endDate) { setError("Dates are required."); return; }
    setError(null);

    const { data: trip, error: err } = await supabase
      .from("trips")
      .insert({
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        notes: notes || null,
        created_by: currentUserId,
      })
      .select()
      .single();

    if (err || !trip) { setError(err?.message ?? "Failed to create trip."); return; }

    if (attendees.length > 0) {
      await supabase.from("trip_attendees").insert(
        attendees.map((uid) => ({ trip_id: trip.id, user_id: uid }))
      );
    }

    startTransition(() => {
      router.push(`/trips/${trip.id}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Trip name</label>
        <input
          type="text"
          placeholder="e.g. Canada Day Long Weekend"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Arrival</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Departure</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          placeholder="Any notes about this trip…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Who&apos;s coming?</label>
        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => {
            const selected = attendees.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleAttendee(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-medium">
                  {(p.full_name ?? "?")[0].toUpperCase()}
                </div>
                {p.full_name ?? "Member"}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end pt-1">
        <Button onClick={create} disabled={isPending}>
          {isPending ? "Creating…" : "Create Trip"}
        </Button>
      </div>
    </div>
  );
}
