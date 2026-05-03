import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewTripForm } from "@/components/trips/NewTripForm";

export default async function NewTripPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .order("full_name");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto">
      <Link
        href="/trips"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Trips
      </Link>
      <h1 className="text-xl font-bold mb-5">Plan a Trip</h1>
      <NewTripForm profiles={profiles ?? []} currentUserId={user?.id ?? ""} />
    </div>
  );
}
