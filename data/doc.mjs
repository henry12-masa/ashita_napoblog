// 記事の本文(簡単な書式のテキスト)を Portable Text に変換する。
//   "## 見出し" → h2、"### 見出し" → h3、"> 引用" → 引用、"- 項目" の行 → 箇条書き、"1. 項目" → 番号付き
//   段落の中の **太字** → 強調、[[slug]] → ほかの記事へのリンク(『記事タイトル』表記)
let keyCounter = 0;
const key = () => `k${(keyCounter++).toString(36)}`;

/** [[slug]] の解決に使う: slug → タイトル。posts.mjs が記事を読み込んだあとに埋める */
export const postTitles = new Map();

function spans(text, markDefs, links) {
	const children = [];
	const re = /\*\*(.+?)\*\*|\[\[([a-z0-9-]+)\]\]/g;
	let last = 0;
	let m;
	const push = (t, marks = []) => t && children.push({ _type: "span", _key: key(), text: t, marks });
	while ((m = re.exec(text))) {
		push(text.slice(last, m.index));
		if (m[1]) {
			push(m[1], ["strong"]);
		} else {
			const linkKey = key();
			markDefs.push({ _type: "link", _key: linkKey, href: `/posts/${m[2]}` });
			links.push(m[2]);
			push(`『[[${m[2]}]]』`, [linkKey]);
		}
		last = m.index + m[0].length;
	}
	push(text.slice(last));
	return children;
}

function block(style, text, links, list) {
	const markDefs = [];
	const b = { _type: "block", _key: key(), style, markDefs, children: spans(text, markDefs, links) };
	if (list) Object.assign(b, { listItem: list, level: 1 });
	return b;
}

export function doc(source) {
	const links = [];
	const content = [];
	for (const para of source.trim().split(/\n\s*\n/).map((p) => p.trim())) {
		const lines = para.split("\n").map((l) => l.trim());
		if (lines.every((l) => l.startsWith("- "))) {
			for (const l of lines) content.push(block("normal", l.slice(2), links, "bullet"));
		} else if (lines.every((l) => /^\d+\. /.test(l))) {
			for (const l of lines) content.push(block("normal", l.replace(/^\d+\. /, ""), links, "number"));
		} else if (para.startsWith("### ")) content.push(block("h3", para.slice(4), links));
		else if (para.startsWith("## ")) content.push(block("h2", para.slice(3), links));
		else if (para.startsWith("> ")) content.push(block("blockquote", lines.map((l) => l.replace(/^> ?/, "")).join(""), links));
		else content.push(block("normal", lines.join(""), links));
	}
	return { content, links };
}

/** [[slug]] の仮の文字列を記事タイトルに置き換える(全記事がそろってから呼ぶ) */
export function resolveLinks(content) {
	for (const b of content) {
		for (const c of b.children ?? []) {
			c.text = c.text.replace(/『\[\[([a-z0-9-]+)\]\]』/g, (_, slug) => {
				if (!postTitles.has(slug)) throw new Error(`存在しない記事へのリンク: ${slug}`);
				return `『${postTitles.get(slug)}』`;
			});
		}
	}
	return content;
}
