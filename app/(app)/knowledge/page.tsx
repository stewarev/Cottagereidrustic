import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function KnowledgePage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("knowledge_categories")
    .select(
      "*, knowledge_articles(count)"
    )
    .order("sort_order", { ascending: true });

  const { data: articleCounts } = await supabase
    .from("knowledge_articles")
    .select("category_id")
    .eq("is_published", true);

  const countMap: Record<string, number> = {};
  articleCounts?.forEach((a) => {
    countMap[a.category_id] = (countMap[a.category_id] ?? 0) + 1;
  });

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Guides, how-tos, and cottage wisdom
          </p>
        </div>
        <Link href="/knowledge/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            New Article
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categories?.map((cat: any) => (
          <Link key={cat.id} href={`/knowledge/${cat.slug}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="text-3xl mt-1">{cat.icon}</div>
                <div className="font-medium text-sm leading-tight">{cat.name}</div>
                <div className="text-xs text-muted-foreground">
                  {countMap[cat.id] ?? 0}{" "}
                  {(countMap[cat.id] ?? 0) === 1 ? "article" : "articles"}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
