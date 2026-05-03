import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { MEMBER_COLORS } from "@/lib/utils";

export default async function MembersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Family Members</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Everyone with access to the cottage app
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {profiles?.map((profile, i) => (
          <Card key={profile.id}>
            <CardContent className="p-4 flex items-center gap-3">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name ?? ""}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    MEMBER_COLORS[i % MEMBER_COLORS.length]
                  }`}
                >
                  {(profile.full_name ?? profile.email ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-medium">{profile.full_name ?? "Member"}</div>
                <div className="text-sm text-muted-foreground">{profile.email}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
        <strong>Adding new members:</strong> New members can sign in with Google at the login page.
        Their profile will be created automatically on first sign-in. Ask them to visit this app
        and sign in with their Google account.
      </div>
    </div>
  );
}
