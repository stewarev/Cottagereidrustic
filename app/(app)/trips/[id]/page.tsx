import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Utensils, Package, DollarSign } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select(
      "*, trip_attendees(user_id, profiles(full_name, avatar_url))"
    )
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const nights = differenceInDays(
    parseISO(trip.end_date),
    parseISO(trip.start_date)
  );

  const attendees = trip.trip_attendees ?? [];

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Link
        href="/trips"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Trips
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{trip.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(parseISO(trip.start_date), "MMMM d")} –{" "}
          {format(parseISO(trip.end_date), "MMMM d, yyyy")}
          {nights > 0 && ` · ${nights} night${nights !== 1 ? "s" : ""}`}
        </p>
        {trip.notes && (
          <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg">
            {trip.notes}
          </p>
        )}
      </div>

      {/* Attendees */}
      {attendees.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">Attendees</div>
          <div className="flex flex-wrap gap-2">
            {attendees.map((a: any) => (
              <div
                key={a.user_id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm"
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium text-primary">
                  {(a.profiles?.full_name ?? "?")[0].toUpperCase()}
                </div>
                {a.profiles?.full_name ?? "Member"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href={`/trips/${id}/meals`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Meal Plan</div>
                <div className="text-xs text-muted-foreground">Plan who cooks what</div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/trips/${id}/supplies`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Supplies</div>
                <div className="text-xs text-muted-foreground">What to bring</div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/trips/${id}/expenses`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Expenses</div>
                <div className="text-xs text-muted-foreground">Split costs</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
