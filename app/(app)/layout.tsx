import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/nav/Sidebar";
import { BottomNav } from "@/components/nav/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={profile?.full_name}
        userEmail={profile?.email ?? user.email}
        avatarUrl={profile?.avatar_url}
      />
      <main className="flex-1 min-w-0 pb-20 sm:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
