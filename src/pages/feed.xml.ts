import type { APIRoute } from "astro";
import rss from "@astrojs/rss";
import { site } from "../data/site";
import { getPosts } from "../lib/posts";

export const GET: APIRoute = () =>
  rss({
    title: `${site.profile.name} — Blog`,
    description: site.blogDescription,
    site: site.url,
    items: getPosts(false).map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: new Date(`${post.publishedAt}T00:00:00Z`),
      link: post.url,
      categories: post.tags.map((tag) => tag.label),
    })),
    customData: `<language>${site.language}</language>`,
  });
