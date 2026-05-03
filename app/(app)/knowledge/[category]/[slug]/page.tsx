import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category: categorySlug, slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("knowledge_articles")
    .select(
      "*, knowledge_categories(name, slug, icon), profiles(full_name)"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!article) notFound();

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <Link
          href={`/knowledge/${categorySlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {article.knowledge_categories?.name}
        </Link>
        <Link href={`/knowledge/${categorySlug}/${slug}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
        </Link>
      </div>

      <article>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{article.title}</h1>
          <p className="text-xs text-muted-foreground mt-2">
            Last updated {formatDate(article.updated_at)}
            {article.profiles?.full_name
              ? ` by ${article.profiles.full_name}`
              : ""}
          </p>
        </div>

        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
        />
      </article>
    </div>
  );
}

function renderMarkdown(content: string): string {
  return content
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/^---$/gm, "<hr>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^([^<\n].+)$/gm, (m) => m.startsWith("<") ? m : `<p>${m}</p>`)
    .replace(/<p><\/p>/g, "");
}
