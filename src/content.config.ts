import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const postsCollection = defineCollection({
	// Content Layer：掃描 posts 下的 Markdown（.obsidian 等本機資料不含 .md，不會被掃入）
	loader: glob({
		pattern: "**/*.md",
		base: "./src/content/posts",
		generateId: ({ entry }) => {
			// entry 為相對 base 的路徑字串（如 "aws/index.md"）
			const rel = entry.replace(/\.md$/, "");
			// <dir>/index.md → <dir>，保持既有 /posts/<dir>/ 路由不變
			return rel.endsWith("/index") ? rel.slice(0, -"/index".length) : rel;
		},
	}),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().default(""),
		lang: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});
const specCollection = defineCollection({
	loader: glob({ pattern: "*.md", base: "./src/content/spec" }),
	schema: z.object({}),
});
export const collections = {
	posts: postsCollection,
	spec: specCollection,
};
