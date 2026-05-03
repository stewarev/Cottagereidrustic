import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ArticleEditor } from "@/components/knowledge/ArticleEditor";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category: categorySlug, slug } = await params;
  const supabase = await createClient();

  const [{ data: article }, { data: categories }] = await Promise.all([
    supabase
      .from("knowledge_articles")
      .select("*, knowledge_categories(slug)")
      .eq("slug", slug)
      .single(),
    supabase
      .from("knowledge_categories")
      .select("id, name, slug")
      .order("sort_order"),
  ]);

  if (!article) notFound();

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Link
        href={`/knowledge/${categorySlug}/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to article
      </Link>
      <h1 className="text-xl font-bold mb-5">Edit Article</h1>
      <ArticleEditor article={article} categories={categories ?? []} />
    </div>
  );
}
