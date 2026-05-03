import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImprovementBoard } from "@/components/maintenance/ImprovementBoard";

export default async function ImprovementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: improvements }, { data: profiles }] = await Promise.all([
    supabase
      .from("improvements")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Link
        href="/maintenance"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Maintenance
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Improvements &amp; Ideas</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Track cottage improvement ideas from idea to done
        </p>
      </div>

      <ImprovementBoard
        improvements={(improvements as any) ?? []}
        profiles={profiles ?? []}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
