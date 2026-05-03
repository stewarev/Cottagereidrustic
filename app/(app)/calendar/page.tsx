import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CottageCalendar } from "@/components/calendar/CottageCalendar";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentYear = new Date().getFullYear();

  const [{ data: stays }, { data: profiles }] = await Promise.all([
    supabase
      .from("cottage_stays")
      .select("*, profiles(id, full_name, avatar_url)")
      .gte("end_date", `${currentYear}-01-01`)
      .lte("start_date", `${currentYear + 1}-12-31`)
      .order("start_date", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .order("full_name"),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Cottage Calendar</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          See who&apos;s at the cottage and plan your visit
        </p>
      </div>

      <CottageCalendar
        stays={(stays as any) ?? []}
        profiles={profiles ?? []}
        currentUserId={user.id}
      />
    </div>
  );
}
