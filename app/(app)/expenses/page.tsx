import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export default async function ExpensesOverviewPage() {
  const supabase = await createClient();

  const { data: trips } = await supabase
    .from("trips")
    .select("id, name, start_date")
    .order("start_date", { ascending: false })
    .limit(10);

  if (!trips || trips.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Expenses</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Expenses are tracked per trip.{" "}
          <Link href="/trips" className="text-primary underline">
            Go to Trips
          </Link>{" "}
          to view or add expenses.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Select a trip to view or add expenses
        </p>
      </div>
      <div className="space-y-2">
        {trips.map((trip) => (
          <Link key={trip.id} href={`/trips/${trip.id}/expenses`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium text-sm">{trip.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(trip.start_date), "MMMM yyyy")}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
