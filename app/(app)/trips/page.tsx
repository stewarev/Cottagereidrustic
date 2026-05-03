import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight } from "lucide-react";
import { format, parseISO, isPast, isFuture, isToday } from "date-fns";

export default async function TripsPage() {
  const supabase = await createClient();

  const { data: trips } = await supabase
    .from("trips")
    .select("*, trip_attendees(user_id, profiles(full_name, avatar_url))")
    .order("start_date", { ascending: false });

  const upcoming = trips?.filter(
    (t) => isFuture(parseISO(t.start_date)) || isToday(parseISO(t.start_date))
  );
  const past = trips?.filter((t) => isPast(parseISO(t.end_date)));

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trips</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Plan meals, supplies, and who&apos;s coming
          </p>
        </div>
        <Link href="/trips/new">
          <Button>
            <Plus className="w-4 h-4" /> New Trip
          </Button>
        </Link>
      </div>

      {/* Upcoming */}
      {upcoming && upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            Upcoming
          </h2>
          <div className="space-y-2">
            {upcoming.map((trip: any) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {past && past.length > 0 && (
        <section>
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            Past Trips
          </h2>
          <div className="space-y-2">
            {past.map((trip: any) => (
              <TripCard key={trip.id} trip={trip} past />
            ))}
          </div>
        </section>
      )}

      {(!trips || trips.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-4xl mb-3">⛵</div>
          <p className="text-sm">No trips yet. Plan your first one!</p>
          <Link href="/trips/new" className="mt-4 inline-block">
            <Button size="sm">
              <Plus className="w-4 h-4" /> Plan a trip
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, past }: { trip: any; past?: boolean }) {
  const attendees = trip.trip_attendees ?? [];
  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="text-center w-12 shrink-0">
            <div className="text-xs text-muted-foreground uppercase">
              {format(parseISO(trip.start_date), "MMM")}
            </div>
            <div className="text-xl font-bold leading-tight">
              {format(parseISO(trip.start_date), "d")}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-medium text-sm ${past ? "text-muted-foreground" : ""}`}>
              {trip.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(parseISO(trip.start_date), "MMM d")} –{" "}
              {format(parseISO(trip.end_date), "MMM d, yyyy")}
            </div>
            {attendees.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {attendees.slice(0, 4).map((a: any) => (
                  <div
                    key={a.user_id}
                    className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-medium text-primary"
                    title={a.profiles?.full_name ?? ""}
                  >
                    {(a.profiles?.full_name ?? "?")[0].toUpperCase()}
                  </div>
                ))}
                {attendees.length > 4 && (
                  <span className="text-xs text-muted-foreground">+{attendees.length - 4}</span>
                )}
              </div>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
