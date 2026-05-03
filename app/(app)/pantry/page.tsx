import { createClient } from "@/lib/supabase/server";
import { PantryClient } from "@/components/pantry/PantryClient";

export default async function PantryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from("pantry_items")
    .select("*, profiles(full_name)")
    .order("category", { ascending: true });

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pantry & Inventory</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          What&apos;s already at the cottage
        </p>
      </div>
      <PantryClient items={(items as any) ?? []} currentUserId={user?.id ?? ""} />
    </div>
  );
}
