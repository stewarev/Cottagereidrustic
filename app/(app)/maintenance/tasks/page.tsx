import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TasksClient } from "@/components/maintenance/TasksClient";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: tasks }, { data: logs }, { data: profiles }] = await Promise.all([
    supabase
      .from("maintenance_tasks")
      .select("*")
      .order("month_due", { ascending: true, nullsFirst: false }),
    supabase
      .from("maintenance_logs")
      .select("*, profiles(full_name)")
      .order("completed_date", { ascending: false }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Link
        href="/maintenance"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Maintenance
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">All Tasks</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Log completion and add notes
        </p>
      </div>

      <TasksClient
        tasks={tasks ?? []}
        logs={logs ?? []}
        profiles={profiles ?? []}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
