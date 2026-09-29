import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDepartment } from "@/lib/content/repo";
import { store } from "@/lib/store";
import { splitFrontmatter } from "@/lib/content/normalize";
import { hasRawHtml } from "@/lib/content/validate";
import { Editor } from "@/components/editor/Editor";

export const metadata = { title: "Edit" };

export default async function EditPage({ params }: { params: Promise<{ dept: string; slug: string }> }) {
  const user = await requireUser("editor");
  const { dept, slug } = await params;
  const d = await getDepartment(dept);
  if (!d) notFound();
  // Load the latest main, not the deployed copy, so saves compare against the real current version.
  const file = await store().read(dept, slug);
  if (!file) notFound();
  const { data, body } = splitFrontmatter(file.content);
  return (
    <Editor
      dept={dept}
      deptTitle={d.meta.title}
      slug={slug}
      baseSha={file.sha}
      meta={data}
      body={body.replace(/^\n+/, "")}
      hasHtml={hasRawHtml(body)}
      role={user.role}
      storeMode={store().mode}
    />
  );
}
