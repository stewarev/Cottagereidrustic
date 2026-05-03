import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateShort, MEMBER_COLORS_LIGHT } from "@/lib/utils";
import { BookOpen, Calendar, Wrench, Utensils, ArrowRight, CheckCircle2 } from "lucide-react";
import { addDays, format, isWithinInterval, parseISO, startOfToday } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = startOfToday();
  const twoWeeksOut = addDays(today, 14);

  const [
    { data: upcomingTrips },
    { data: currentStays },
    { data: upcomingTasks },
    { data: recentArticles },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("trips")
      .select("*")
      .gte("end_date", format(today, "yyyy-MM-dd"))
      .order("start_date", { ascending: true })
      .limit(3),
    supabase
      .from("cottage_stays")
      .select("*, profiles(full_name, avatar_url)")
      .lte("start_date", format(today, "yyyy-MM-dd"))
      .gte("end_date", format(today, "yyyy-MM-dd")),
    supabase
      .from("maintenance_tasks")
      .select("*")
      .not("month_due", "is", null)
      .in("month_due", [today.getMonth() + 1, today.getMonth() + 2])
      .order("month_due", { ascending: true })
      .limit(4),
    supabase
      .from("knowledge_articles")
      .select("id, title, slug, updated_at, knowledge_categories(name, slug)")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase.from("profiles").select("id, full_name, avatar_url").limit(6),
  ]);

  const monthNames = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Good to see you 👋</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {format(today, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Who's at the cottage */}
      {currentStays && currentStays.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 text-sm">
              🏡 At the cottage right now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentStays.map((stay: any) => (
                <span
                  key={stay.id}
                  className="inline-flex items-center gap-1.5 text-sm text-green-900"
                >
                  {stay.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={stay.profiles.avatar_url}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs font-medium text-green-700">
                      {(stay.profiles?.full_name ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  {stay.profiles?.full_name ?? "Member"}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/knowledge">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Knowledge Base</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Guides &amp; how-tos
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/calendar">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Cottage Calendar</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Who&apos;s coming when
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/trips">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Trip Planning</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Meals &amp; supplies
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/maintenance">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Maintenance</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Tasks &amp; improvements
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Upcoming trips */}
      {upcomingTrips && upcomingTrips.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Upcoming Trips</h2>
            <Link
              href="/trips"
              className="text-xs text-primary flex items-center gap-1"
            >
              All trips <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingTrips.map((trip: any) => (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="text-center w-12 shrink-0">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        {format(parseISO(trip.start_date), "MMM")}
                      </div>
                      <div className="text-xl font-bold leading-tight">
                        {format(parseISO(trip.start_date), "d")}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{trip.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateShort(trip.start_date)} –{" "}
                        {formatDateShort(trip.end_date)}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming maintenance */}
      {upcomingTasks && upcomingTasks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Maintenance This Season</h2>
            <Link
              href="/maintenance"
              className="text-xs text-primary flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingTasks.map((task: any) => (
              <Link key={task.id} href="/maintenance/tasks">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{task.title}</span>
                    </div>
                    <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                      {monthNames[task.month_due]}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent knowledge articles */}
      {recentArticles && recentArticles.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recently Updated Guides</h2>
            <Link
              href="/knowledge"
              className="text-xs text-primary flex items-center gap-1"
            >
              All guides <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentArticles.map((article: any) => (
              <Link
                key={article.id}
                href={`/knowledge/${article.knowledge_categories?.slug}/${article.slug}`}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{article.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {article.knowledge_categories?.name}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
