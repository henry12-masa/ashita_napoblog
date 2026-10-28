// 全記事と「このサイトについて」。記事を足すときは posts-*.mjs に書く。
import { doc, postTitles, resolveLinks } from "./doc.mjs";
import habits from "./posts-habits.mjs";
import mind from "./posts-mind.mjs";
import growth from "./posts-growth.mjs";

export const posts = [...habits, ...mind, ...growth].sort((a, b) => a.date.localeCompare(b.date));
for (const p of posts) postTitles.set(p.slug, p.title);
for (const p of posts) resolveLinks(p.content);

export const SITE = {
	name: "あしたの習慣",
	tagline: "自己啓発を、今日できる小さな一歩に。習慣・考え方・時間の使い方を、研究と名著から読み解くブログ。",
	author: "あしたの習慣 編集部",
};

export const aboutPage = {
	id: "page-about",
	slug: "about",
	status: "published",
	data: {
		title: "このサイトについて",
		content: doc(`
「あしたの習慣」は、自己啓発に特化したブログです。習慣づくり、考え方、時間の使い方、学び方、人間関係、睡眠や運動まで、昨日より少し楽に、少し前向きに過ごすためのヒントを紹介しています。

## 大切にしていること

**根拠のあることを書く。**心理学などの研究や、長く読み継がれている名著をもとに書いています。研究の結果が分かれていることや、効果が小さいとわかってきたことは、そのまま書きます。

**すぐに試せる形にする。**どの記事も、最後に「今日の一歩」をつけています。読んで終わりではなく、1つだけ試してみることを大切にしています。

**できないことを約束しない。**「これで人生が変わる」「必ず成功する」といった言い方はしません。変わるのは、小さな行動を積み重ねたときです。

## ご注意

当サイトの内容は一般的な情報の提供を目的としたもので、医療や心理療法の代わりになるものではありません。強い落ち込みや不安、眠れない日が続くなどの不調があるときは、医療機関や専門の相談窓口に相談してください。

## 紹介している本について

記事で紹介している本には、Amazonへのリンクをつけています。当サイトはAmazonアソシエイト・プログラムに参加しており、リンクから商品が購入されると紹介料を受け取ることがあります。紹介する本は、記事の内容に関係のあるものだけを選んでいます。
`).content,
	},
};
