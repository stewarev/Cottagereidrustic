"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { CheckCircle2, Plus, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MONTHS = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string;
  frequency: string;
  month_due: number | null;
  priority: string;
  notes: string | null;
}

interface Log {
  id: string;
  task_id: string;
  completed_by: string;
  completed_date: string;
  notes: string | null;
  profiles: { full_name: string | null } | null;
}

interface Profile {
  id: string;
  full_name: string | null;
}

interface TasksClientProps {
  tasks: Task[];
  logs: Log[];
  profiles: Profile[];
  currentUserId: string;
}

export function TasksClient({ tasks, logs: initialLogs, profiles, currentUserId }: TasksClientProps) {
  const supabase = createClient();
  const [logs, setLogs] = useState<Log[]>(initialLogs);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [logDialog, setLogDialog] = useState<Task | null>(null);
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [logNotes, setLogNotes] = useState("");

  const thisYear = new Date().getFullYear();

  function getLogsForTask(taskId: string) {
    return logs.filter((l) => l.task_id === taskId);
  }

  function wasCompletedThisYear(taskId: string) {
    return logs.some(
      (l) =>
        l.task_id === taskId &&
        l.completed_date.startsWith(String(thisYear))
    );
  }

  async function logCompletion() {
    if (!logDialog) return;
    const profile = profiles.find((p) => p.id === currentUserId);
    const { data, error } = await supabase
      .from("maintenance_logs")
      .insert({
        task_id: logDialog.id,
        completed_by: currentUserId,
        completed_date: logDate,
        notes: logNotes || null,
      })
      .select("*, profiles(full_name)")
      .single();
    if (!error && data) {
      setLogs((prev) => [data as Log, ...prev]);
    }
    setLogDialog(null);
    setLogNotes("");
  }

  // Group tasks by category
  const categories = Array.from(new Set(tasks.map((t) => t.category))).sort();

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const catTasks = tasks.filter((t) => t.category === cat);
        return (
          <div key={cat}>
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
              {cat}
            </h2>
            <div className="space-y-1.5">
              {catTasks.map((task) => {
                const done = wasCompletedThisYear(task.id);
                const taskLogs = getLogsForTask(task.id);
                const expanded = expandedTask === task.id;

                return (
                  <div key={task.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedTask(expanded ? null : task.id)}
                    >
                      <CheckCircle2
                        className={cn(
                          "w-5 h-5 shrink-0",
                          done ? "text-green-600" : "text-muted-foreground"
                        )}
                        fill={done ? "currentColor" : "none"}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>
                          {task.title}
                        </div>
                        {task.month_due && (
                          <div className="text-xs text-muted-foreground">
                            Due: {MONTHS[task.month_due]} · {task.frequency}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
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
                        {expanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-3.5 pb-3.5 space-y-3 border-t border-border bg-muted/20">
                        {task.description && (
                          <p className="text-sm text-muted-foreground pt-3">{task.description}</p>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setLogDialog(task);
                            setLogDate(format(new Date(), "yyyy-MM-dd"));
                            setLogNotes("");
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" /> Log Completion
                        </Button>

                        {taskLogs.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                              History
                            </div>
                            <div className="space-y-1">
                              {taskLogs.slice(0, 5).map((log) => (
                                <div
                                  key={log.id}
                                  className="flex items-start gap-2 text-xs text-muted-foreground"
                                >
                                  <Clock className="w-3 h-3 mt-0.5 shrink-0" />
                                  <span>
                                    {format(new Date(log.completed_date), "MMM d, yyyy")}
                                    {log.profiles?.full_name
                                      ? ` · ${log.profiles.full_name}`
                                      : ""}
                                    {log.notes ? ` — ${log.notes}` : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Log completion dialog */}
      <Dialog open={!!logDialog} onOpenChange={(o) => !o && setLogDialog(null)}>
        <DialogContent>
          <DialogHeader onClose={() => setLogDialog(null)}>
            <DialogTitle>Log Completion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2 mb-3">
            {logDialog?.title}
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Date completed</label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Notes <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Any observations or issues found…"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setLogDialog(null)}>
                Cancel
              </Button>
              <Button onClick={logCompletion} disabled={!logDate}>
                <CheckCircle2 className="w-4 h-4" /> Mark Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
