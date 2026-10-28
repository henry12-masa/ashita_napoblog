// data/ の記事・テーマ・本から seed/seed.json を生成する。
// 使い方: node scripts/build-seed.mjs
// seed は「空のデータベース」にだけ適用される。公開後の更新は scripts/sync-remote.mjs で行う。
// 記事の date は並び順のためのもの(seed は公開日時を指定できず、適用した時刻が公開日になる)。
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CATEGORIES, TAGS } from "../data/taxonomies.mjs";
import { BOOKS } from "../data/books.mjs";
import { posts, aboutPage, SITE } from "../data/posts.mjs";

// ---- 検証
const seen = new Set();
for (const p of posts) {
	if (seen.has(p.slug)) throw new Error(`slug重複: ${p.slug}`);
	seen.add(p.slug);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) throw new Error(`${p.slug}: 日付の形式 ${p.date}`);
	if (!CATEGORIES.some((c) => c.slug === p.category)) throw new Error(`${p.slug}: 未定義のテーマ ${p.category}`);
	for (const t of p.tags) if (!TAGS[t]) throw new Error(`${p.slug}: 未定義のタグ ${t}`);
	for (const b of p.books) if (!BOOKS[b]) throw new Error(`${p.slug}: 未定義の本 ${b}`);
	if (!p.action) throw new Error(`${p.slug}: 今日の一歩がない`);
}

/** 記事1本を EmDash の data に変換する(sync-remote.mjs と共通) */
export function postData(p) {
	return {
		title: p.title,
		excerpt: p.excerpt,
		content: p.content,
		action: p.action,
		books: p.books.join(","),
	};
}

export const seed = {
	$schema: "https://emdashcms.com/seed.schema.json",
	version: "1",
	meta: { name: SITE.name, description: SITE.tagline, author: SITE.author },
	settings: { title: SITE.name, tagline: SITE.tagline },
	collections: [
		{
			slug: "posts",
			label: "記事",
			labelSingular: "記事",
			urlPattern: "/posts/{slug}",
			supports: ["drafts", "revisions", "preview", "scheduling", "search", "seo"],
			fields: [
				{ slug: "title", label: "タイトル", type: "string", required: true, searchable: true },
				{ slug: "featured_image", label: "アイキャッチ", type: "image" },
				{ slug: "excerpt", label: "抜粋", type: "text", searchable: true },
				{ slug: "content", label: "本文", type: "portableText", searchable: true },
				{ slug: "action", label: "今日の一歩(記事の最後に表示)", type: "text", searchable: true },
				{ slug: "books", label: "紹介する本(data/books.mjs の id をカンマ区切り)", type: "string" },
			],
		},
		{
			slug: "pages",
			label: "固定ページ",
			labelSingular: "固定ページ",
			urlPattern: "/pages/{slug}",
			supports: ["drafts", "revisions", "preview", "search", "seo"],
			fields: [
				{ slug: "title", label: "タイトル", type: "string", required: true, searchable: true },
				{ slug: "content", label: "本文", type: "portableText", searchable: true },
			],
		},
	],
	taxonomies: [
		{
			name: "category", label: "テーマ", labelSingular: "テーマ", hierarchical: true, collections: ["posts"],
			terms: CATEGORIES.map(({ slug, label }) => ({ slug, label })),
		},
		{
			name: "tag", label: "タグ", labelSingular: "タグ", hierarchical: false, collections: ["posts"],
			terms: Object.entries(TAGS).map(([slug, label]) => ({ slug, label })),
		},
	],
	bylines: [{ id: "byline-editorial", slug: "editorial", displayName: SITE.author }],
	menus: [
		{
			name: "primary",
			label: "メインメニュー",
			items: [
				{ type: "custom", label: "記事一覧", url: "/posts" },
				{ type: "custom", label: "テーマ", url: "/themes" },
				{ type: "custom", label: "本棚", url: "/books" },
				{ type: "custom", label: "このサイトについて", url: "/pages/about" },
			],
		},
	],
	widgetAreas: [
		{
			name: "sidebar",
			label: "サイドバー",
			description: "記事ページに表示",
			widgets: [
				{ type: "component", componentId: "core:search", title: "検索" },
				{ type: "component", componentId: "core:categories", title: "テーマ" },
				{ type: "component", componentId: "core:recent-posts", title: "新しい記事", props: { count: 5, showDate: false } },
			],
		},
		{
			name: "footer",
			label: "フッター",
			description: "フッターに表示",
			widgets: [
				{
					type: "content",
					title: "編集方針",
					content: [
						{
							_type: "block", _key: "f0", style: "normal",
							children: [{
								_type: "span", _key: "f1",
								text: "研究と名著をもとに、すぐに試せる形で書いています。効果をうたいすぎず、わかっていないことはわからないと書きます。医療や心理療法の代わりではありません。",
							}],
						},
					],
				},
			],
		},
	],
	content: {
		posts: posts.map((p) => ({
			id: `post-${p.slug}`,
			slug: p.slug,
			status: "published",
			data: postData(p),
			bylines: [{ byline: "byline-editorial" }],
			taxonomies: { category: [p.category], tag: p.tags },
		})),
		pages: [aboutPage],
	},
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	writeFileSync(new URL("../seed/seed.json", import.meta.url), JSON.stringify(seed, null, "\t") + "\n");
	const chars = posts.map((p) => p.content.flatMap((b) => b.children.map((c) => c.text)).join("").length);
	console.log(`seed/seed.json を生成: 記事${posts.length}本(本文 平均${Math.round(chars.reduce((a, b) => a + b) / chars.length)}字・最短${Math.min(...chars)}字)`);
}
