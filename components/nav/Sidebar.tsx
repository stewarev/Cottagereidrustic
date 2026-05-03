"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BookOpen,
  Calendar,
  Wrench,
  Utensils,
  Package,
  Users,
  LogOut,
  DollarSign,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/knowledge", icon: BookOpen, label: "Knowledge Base" },
  { href: "/calendar", icon: Calendar, label: "Cottage Calendar" },
  { href: "/trips", icon: Utensils, label: "Trip Planning" },
  { href: "/pantry", icon: Package, label: "Pantry" },
  { href: "/maintenance", icon: Wrench, label: "Maintenance" },
  { href: "/maintenance/improvements", icon: Lightbulb, label: "Improvements" },
  { href: "/expenses", icon: DollarSign, label: "Expenses" },
  { href: "/members", icon: Users, label: "Members" },
];

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
}

export function Sidebar({ userName, userEmail, avatarUrl }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden sm:flex flex-col w-56 shrink-0 border-r border-border bg-card h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏡</span>
          <div>
            <div className="font-bold text-sm leading-tight">Reid Rustic</div>
            <div className="text-xs text-muted-foreground">Georgian Bay</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / sign out */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-2 px-2 mb-2">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={userName ?? ""}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
              {(userName ?? userEmail ?? "?")[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{userName ?? "Member"}</div>
            <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
