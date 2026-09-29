import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDepartment } from "@/lib/content/repo";
import { store } from "@/lib/store";
import { Editor } from "@/components/editor/Editor";

export const metadata = { title: "New section" };

const TEMPLATE = `## Goal

One line: what this procedure achieves.

## Prerequisites

- Access, tools, or files needed.

## Steps

1. First action.
2. Second action.

## Check

Expected: what you see when it worked.

## Troubleshooting

| Problem | Fix |
| - | - |
| Symptom | Action |
`;

export default async function NewDocPage({ params }: { params: Promise<{ dept: string }> }) {
  const user = await requireUser("admin");
  const { dept } = await params;
  const d = await getDepartment(dept);
  if (!d) notFound();
  return (
    <Editor
      dept={dept}
      deptTitle={d.meta.title}
      slug={null}
      baseSha={null}
      meta={{ title: "", summary: "", tags: [dept], owner: user.name, featured: false, order: 100 }}
      body={TEMPLATE}
      hasHtml={false}
      role={user.role}
      storeMode={store().mode}
    />
  );
}
