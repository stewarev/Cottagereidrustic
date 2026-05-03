import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MealPlanGrid } from "@/components/trips/MealPlanGrid";
import { eachDayOfInterval, parseISO, format } from "date-fns";

export default async function MealsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: trip }, { data: meals }, { data: mealItems }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("trips")
        .select("*, trip_attendees(user_id, profiles(full_name))")
        .eq("id", id)
        .single(),
      supabase
        .from("meals")
        .select("*")
        .eq("trip_id", id)
        .order("date", { ascending: true }),
      supabase
        .from("meal_items")
        .select("*")
        .in(
          "meal_id",
          (
            await supabase
              .from("meals")
              .select("id")
              .eq("trip_id", id)
          ).data?.map((m) => m.id) ?? []
        ),
      supabase.from("profiles").select("id, full_name").order("full_name"),
    ]);

  if (!trip) notFound();

  const tripDays = eachDayOfInterval({
    start: parseISO(trip.start_date),
    end: parseISO(trip.end_date),
  }).map((d) => format(d, "yyyy-MM-dd"));

  const attendeeProfiles =
    (trip.trip_attendees ?? []).map((a: any) => ({
      id: a.user_id,
      full_name: a.profiles?.full_name ?? null,
    }));

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Link
        href={`/trips/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> {trip.name}
      </Link>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Meal Plan</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Plan meals and who brings each ingredient
        </p>
      </div>
      <MealPlanGrid
        tripId={id}
        tripDays={tripDays}
        meals={meals ?? []}
        mealItems={mealItems ?? []}
        profiles={attendeeProfiles}
        currentUserId=""
      />
    </div>
  );
}
