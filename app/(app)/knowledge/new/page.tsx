import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArticleEditor } from "@/components/knowledge/ArticleEditor";

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: defaultCategoryId } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("knowledge_categories")
    .select("id, name, slug")
    .order("sort_order");

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Link
        href="/knowledge"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Knowledge Base
      </Link>
      <h1 className="text-xl font-bold mb-5">New Article</h1>
      <ArticleEditor
        categories={categories ?? []}
        defaultCategoryId={defaultCategoryId}
      />
    </div>
  );
}
