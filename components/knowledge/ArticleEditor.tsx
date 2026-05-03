"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Save, Eye, Pencil } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ArticleEditorProps {
  article?: {
    id: string;
    title: string;
    slug: string;
    content: string;
    category_id: string;
    knowledge_categories?: { slug: string };
  };
  categories: Category[];
  defaultCategoryId?: string;
}

export function ArticleEditor({
  article,
  categories,
  defaultCategoryId,
}: ArticleEditorProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(article?.title ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [categoryId, setCategoryId] = useState(
    article?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? ""
  );
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function save() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const slug = slugify(title);
    const category = categories.find((c) => c.id === categoryId);

    if (article) {
      const { error: err } = await supabase
        .from("knowledge_articles")
        .update({ title: title.trim(), content, category_id: categoryId, slug })
        .eq("id", article.id);
      if (err) { setError(err.message); return; }
    } else {
      const { error: err } = await supabase.from("knowledge_articles").insert({
        title: title.trim(),
        slug,
        content,
        category_id: categoryId,
        created_by: user.id,
        is_published: true,
      });
      if (err) { setError(err.message); return; }
    }

    startTransition(() => {
      router.push(`/knowledge/${category?.slug ?? "general"}/${slug}`);
      router.refresh();
    });
  }

  function renderPreview(md: string): string {
    return md
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
      .replace(/^([^<\n].+)$/gm, (m) => (m.startsWith("<") ? m : `<p>${m}</p>`))
      .replace(/<p><\/p>/g, "");
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <Input
        placeholder="Article title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-base font-medium h-12"
      />

      {/* Category */}
      <Select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </Select>

      {/* Editor / Preview toggle */}
      <div className="flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setPreview(false)}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            !preview
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Pencil className="w-3.5 h-3.5" /> Write
        </button>
        <button
          onClick={() => setPreview(true)}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            preview
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
      </div>

      {/* Content */}
      {preview ? (
        <div
          className="prose min-h-[300px] p-4 bg-muted/30 rounded-lg"
          dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
        />
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Write your article using Markdown…\n\n## Heading\n\nParagraph text here.\n\n- List item\n- Another item`}
          className="w-full min-h-[300px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
        />
      )}

      <div className="text-xs text-muted-foreground">
        Supports Markdown: **bold**, *italic*, `code`, ## headings, - lists
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={isPending}>
          <Save className="w-4 h-4" />
          {isPending ? "Saving…" : "Save Article"}
        </Button>
      </div>
    </div>
  );
}
