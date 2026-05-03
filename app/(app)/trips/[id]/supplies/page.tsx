import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SupplyChecklist } from "@/components/trips/SupplyChecklist";

export default async function SuppliesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: trip }, { data: supplies }, { data: profiles }] =
    await Promise.all([
      supabase.from("trips").select("name, trip_attendees(user_id, profiles(full_name))").eq("id", id).single(),
      supabase.from("supply_items").select("*").eq("trip_id", id).order("category", { ascending: true }),
      supabase.from("profiles").select("id, full_name").order("full_name"),
    ]);

  if (!trip) notFound();

  const attendeeProfiles = (trip.trip_attendees ?? []).map((a: any) => ({
    id: a.user_id,
    full_name: a.profiles?.full_name ?? null,
  }));

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Link
        href={`/trips/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> {trip.name}
      </Link>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Supplies</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Food, water, alcohol, and gear to bring
        </p>
      </div>
      <SupplyChecklist
        tripId={id}
        supplies={supplies ?? []}
        profiles={attendeeProfiles}
      />
    </div>
  );
}
