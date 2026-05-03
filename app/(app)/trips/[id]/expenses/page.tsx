import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ExpensesClient } from "@/components/trips/ExpensesClient";

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: trip }, { data: expenses }, { data: splits }] = await Promise.all([
    supabase
      .from("trips")
      .select("name, trip_attendees(user_id, profiles(full_name))")
      .eq("id", id)
      .single(),
    supabase
      .from("expenses")
      .select("*, profiles(full_name)")
      .eq("trip_id", id)
      .order("date", { ascending: false }),
    supabase
      .from("expense_splits")
      .select("*")
      .in(
        "expense_id",
        (await supabase.from("expenses").select("id").eq("trip_id", id)).data?.map((e) => e.id) ?? []
      ),
  ]);

  if (!trip) notFound();

  const attendees = (trip.trip_attendees ?? []).map((a: any) => ({
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
        <h1 className="text-xl font-bold">Expenses</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Track spending and settle up fairly
        </p>
      </div>
      <ExpensesClient
        tripId={id}
        expenses={(expenses as any) ?? []}
        splits={splits ?? []}
        attendees={attendees}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
