import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lightbulb, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const SEASON_GROUPS = [
  { label: "Spring", months: [3, 4, 5], color: "bg-green-50 border-green-200" },
  { label: "Summer", months: [6, 7, 8], color: "bg-amber-50 border-amber-200" },
  { label: "Fall", months: [9, 10, 11], color: "bg-orange-50 border-orange-200" },
  { label: "Winter", months: [12, 1, 2], color: "bg-blue-50 border-blue-200" },
];

export default async function MaintenancePage() {
  const supabase = await createClient();
  const currentMonth = new Date().getMonth() + 1;

  const [{ data: tasks }, { data: logs }, { data: improvements }] = await Promise.all([
    supabase
      .from("maintenance_tasks")
      .select("*")
      .not("month_due", "is", null)
      .order("month_due", { ascending: true }),
    supabase
      .from("maintenance_logs")
      .select("task_id, completed_date")
      .gte("completed_date", `${new Date().getFullYear()}-01-01`),
    supabase
      .from("improvements")
      .select("id")
      .neq("status", "done"),
  ]);

  const completedThisYear = new Set(logs?.map((l) => l.task_id));

  const tasksByMonth: Record<number, any[]> = {};
  tasks?.forEach((task) => {
    if (task.month_due) {
      if (!tasksByMonth[task.month_due]) tasksByMonth[task.month_due] = [];
      tasksByMonth[task.month_due].push(task);
    }
  });

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Annual tasks and seasonal checklists
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/maintenance/tasks">
            <Button variant="outline" size="sm">
              <ListTodo className="w-4 h-4" /> All Tasks
            </Button>
          </Link>
          <Link href="/maintenance/improvements">
            <Button variant="outline" size="sm">
              <Lightbulb className="w-4 h-4" />
              {improvements?.length ? (
                <span className="bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {improvements.length}
                </span>
              ) : null}
              Ideas
            </Button>
          </Link>
        </div>
      </div>

      {/* Seasonal groups */}
      <div className="space-y-6">
        {SEASON_GROUPS.map(({ label, months, color }) => {
          const seasonTasks = months.flatMap((m) => tasksByMonth[m] ?? []);
          if (seasonTasks.length === 0) return null;

          return (
            <div key={label}>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                {label}
              </h2>
              <div className={cn("rounded-xl border p-4 space-y-2", color)}>
                {months.map((month) => {
                  const mTasks = tasksByMonth[month];
                  if (!mTasks?.length) return null;
                  return (
                    <div key={month}>
                      <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        {MONTHS[month - 1]}
                        {month === currentMonth && (
                          <span className="ml-1.5 text-primary">← this month</span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {mTasks.map((task: any) => {
                          const done = completedThisYear.has(task.id);
                          return (
                            <Link key={task.id} href="/maintenance/tasks">
                              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/70 hover:bg-white transition-colors">
                                <CheckCircle2
                                  className={cn(
                                    "w-4 h-4 shrink-0",
                                    done ? "text-green-600" : "text-muted-foreground"
                                  )}
                                  fill={done ? "currentColor" : "none"}
                                />
                                <span
                                  className={cn(
                                    "text-sm flex-1",
                                    done && "line-through text-muted-foreground"
                                  )}
                                >
                                  {task.title}
                                </span>
                                <Badge
                                  variant={
                                    task.priority === "high"
                                      ? "destructive"
                                      : task.priority === "medium"
                                      ? "warning"
                                      : "secondary"
                                  }
                                >
                                  {task.priority}
                                </Badge>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
