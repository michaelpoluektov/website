import type { AstroInstance } from "astro";
import { z } from "astro/zod";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.valueOf()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Use a valid calendar date in YYYY-MM-DD format.");

export const postSchema = z.object({
  slug: slugSchema.refine(
    (slug) => slug !== "tags",
    'The slug "tags" is reserved for the blog tag directory.',
  ),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  publishedAt: dateSchema,
  readingMinutes: z.number().int().positive(),
  author: z.string().trim().min(1).optional(),
  draft: z.boolean().default(false),
  tags: z
    .array(z.object({ slug: slugSchema, label: z.string().trim().min(1) }))
    .default([]),
  toc: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z][a-z0-9-]*$/),
        title: z.string().trim().min(1),
      }),
    )
    .default([]),
});

export type PostMetadata = z.input<typeof postSchema>;
export type Post = z.output<typeof postSchema> & {
  url: string;
  Content: AstroInstance["default"];
};

interface PostModule {
  post: PostMetadata;
  default: AstroInstance["default"];
}

const modules = import.meta.glob<PostModule>("../posts/*.astro", {
  eager: true,
});
const slugs = new Set<string>();
const tagLabels = new Map<string, string>();

const posts: Post[] = Object.entries(modules).map(([file, module]) => {
  const result = postSchema.safeParse(module.post);
  if (!result.success) {
    throw new Error(
      `Invalid post metadata in ${file}: ${result.error.message}`,
    );
  }

  const metadata = result.data;
  if (slugs.has(metadata.slug)) {
    throw new Error(`Duplicate post slug "${metadata.slug}" in ${file}.`);
  }
  slugs.add(metadata.slug);

  const postTags = new Set<string>();
  for (const tag of metadata.tags) {
    if (postTags.has(tag.slug)) {
      throw new Error(`Duplicate tag "${tag.slug}" in ${file}.`);
    }
    postTags.add(tag.slug);

    const existingLabel = tagLabels.get(tag.slug);
    if (existingLabel !== undefined && existingLabel !== tag.label) {
      throw new Error(`Conflicting labels for tag "${tag.slug}" in ${file}.`);
    }
    tagLabels.set(tag.slug, tag.label);
  }

  return {
    ...metadata,
    url: `/blog/${metadata.slug}/`,
    Content: module.default,
  };
});

export function getPosts(includeDrafts = import.meta.env.DEV): Post[] {
  return posts
    .filter((post) => includeDrafts || !post.draft)
    .toSorted(
      (a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) ||
        a.slug.localeCompare(b.slug),
    );
}

export function getTags(includeDrafts = import.meta.env.DEV) {
  const tags = new Map<
    string,
    { slug: string; label: string; posts: Post[] }
  >();
  for (const post of getPosts(includeDrafts)) {
    for (const tag of post.tags) {
      const entry = tags.get(tag.slug) ?? { ...tag, posts: [] };
      entry.posts.push(post);
      tags.set(tag.slug, entry);
    }
  }
  return Array.from(tags.values()).toSorted((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
