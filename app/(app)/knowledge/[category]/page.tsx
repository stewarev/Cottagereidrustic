import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("knowledge_categories")
    .select("*")
    .eq("slug", categorySlug)
    .single();

  if (!category) notFound();

  const { data: articles } = await supabase
    .from("knowledge_articles")
    .select("id, title, slug, updated_at, created_by, profiles(full_name)")
    .eq("category_id", category.id)
    .eq("is_published", true)
    .order("updated_at", { ascending: false });

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Link
        href="/knowledge"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Knowledge Base
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{category.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{category.name}</h1>
            <p className="text-sm text-muted-foreground">
              {articles?.length ?? 0}{" "}
              {(articles?.length ?? 0) === 1 ? "article" : "articles"}
            </p>
          </div>
        </div>
        <Link href={`/knowledge/new?category=${category.id}`}>
          <Button size="sm">
            <Plus className="w-4 h-4" />
            New
          </Button>
        </Link>
      </div>

      {articles && articles.length > 0 ? (
        <div className="space-y-2">
          {articles.map((article: any) => (
            <Link
              key={article.id}
              href={`/knowledge/${categorySlug}/${article.slug}`}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{article.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Updated {formatDate(article.updated_at)}
                      {article.profiles?.full_name
                        ? ` · ${article.profiles.full_name}`
                        : ""}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">{category.icon}</div>
          <p className="text-sm">No articles yet in this category.</p>
          <Link href={`/knowledge/new?category=${category.id}`} className="mt-4 inline-block">
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4" /> Write the first one
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
