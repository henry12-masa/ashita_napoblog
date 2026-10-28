// 記事の一覧と本文の字数を表示する(定期タスクでの重複確認・字数確認用)。
// 使い方: node scripts/check-posts.mjs [slug ...]   slug を渡すとその記事だけ、なければ全件とテーマ別の本数
import { posts } from "../data/posts.mjs";
import { CATEGORIES } from "../data/taxonomies.mjs";

const length = (p) => p.content.map((b) => b.children.map((c) => c.text).join("")).join("").length;
const only = process.argv.slice(2);
const list = only.length ? posts.filter((p) => only.includes(p.slug)) : posts;
for (const p of list) console.log(`${p.date}  ${p.category.padEnd(13)} ${String(length(p)).padStart(5)}字  ${p.slug}  ${p.title}`);
if (!only.length) {
	console.log("\nテーマ別の本数:");
	for (const c of CATEGORIES) console.log(`  ${c.slug.padEnd(13)} ${posts.filter((p) => p.category === c.slug).length}本  ${c.label}`);
}
