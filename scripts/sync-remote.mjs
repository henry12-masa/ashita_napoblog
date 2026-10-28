// data/ の記事を、稼働中のEmDashサイトに反映する(記事の追加・更新、テーマ・タグの追加、固定ページ)。
// seed は空のデータベースにしか適用されないため、公開後の更新はこのスクリプトで行う。
//
// 使い方:
//   ローカル:  node scripts/sync-remote.mjs --url http://localhost:4360   (開発用の dev-bypass で認証)
//   本番:      npx emdash login --url https://ashita.napoblog.com   (最初に一度)
//              node scripts/sync-remote.mjs --url https://ashita.napoblog.com
//   --dry-run で書き込まずに件数だけ表示。--only slug1,slug2 で指定した記事だけを同期する。
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { CATEGORIES, TAGS } from "../data/taxonomies.mjs";
import { posts, aboutPage } from "../data/posts.mjs";
import { postData } from "./build-seed.mjs";

const args = process.argv.slice(2);
const argValue = (name) => {
	const i = args.indexOf(name);
	return i >= 0 ? args[i + 1] : undefined;
};
const BASE = (argValue("--url") ?? "http://localhost:4360").replace(/\/$/, "");
const DRY = args.includes("--dry-run");
const ONLY = argValue("--only")?.split(",").map((s) => s.trim()).filter(Boolean);
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE);

// ---- 認証
const headers = { "content-type": "application/json", "X-EmDash-Request": "1" };

function findStoredToken() {
	const candidates = [
		join(homedir(), ".config", "emdash", "auth.json"),
		join(process.env.XDG_CONFIG_HOME ?? "", "emdash", "auth.json"),
		join(process.env.APPDATA ?? "", "emdash", "auth.json"),
	];
	for (const file of candidates) {
		if (!file || !existsSync(file)) continue;
		const json = JSON.parse(readFileSync(file, "utf8"));
		// 保存形式の違いに備えて、URLをキーにした形と単一の形の両方を探す
		const entry = json[BASE] ?? json[new URL(BASE).origin] ?? json.instances?.[BASE] ?? json;
		const token = entry?.accessToken ?? entry?.token ?? entry?.access_token;
		if (token) return token;
	}
	return null;
}

async function authenticate() {
	if (process.env.EMDASH_TOKEN) {
		headers.authorization = `Bearer ${process.env.EMDASH_TOKEN}`;
		return "EMDASH_TOKEN";
	}
	const stored = findStoredToken();
	if (stored) {
		headers.authorization = `Bearer ${stored}`;
		return "emdash login の資格情報";
	}
	if (isLocal) {
		const res = await fetch(`${BASE}/_emdash/api/setup/dev-bypass?redirect=/`, { redirect: "manual" });
		const cookies = res.headers.getSetCookie?.() ?? [];
		if (!cookies.length) throw new Error("dev-bypass でセッションを取得できませんでした");
		headers.cookie = cookies.map((c) => c.split(";")[0]).join("; ");
		return "dev-bypass";
	}
	throw new Error("認証情報がありません。先に `npx emdash login --url " + BASE + "` を実行してください。");
}

async function api(method, path, body) {
	const res = await fetch(`${BASE}/_emdash/api${path}`, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await res.text();
	let json;
	try {
		json = JSON.parse(text);
	} catch {
		json = { raw: text.slice(0, 300) };
	}
	if (!res.ok) {
		const err = new Error(`${method} ${path} → ${res.status} ${JSON.stringify(json).slice(0, 400)}`);
		err.status = res.status;
		throw err;
	}
	return json.data ?? json;
}

// ---- 1. 用語(テーマ・タグ)
async function ensureTerms() {
	const wanted = {
		category: CATEGORIES.map(({ slug, label }) => ({ slug, label })),
		tag: Object.entries(TAGS).map(([slug, label]) => ({ slug, label })),
	};
	const added = [];
	for (const [name, terms] of Object.entries(wanted)) {
		const result = await api("GET", `/taxonomies/${name}/terms?limit=500`);
		const existing = new Set((result.items ?? result.terms ?? result).map((t) => t.slug));
		for (const term of terms) {
			if (existing.has(term.slug)) continue;
			added.push(`${name}:${term.slug}`);
			if (!DRY) await api("POST", `/taxonomies/${name}/terms`, term);
		}
	}
	return added;
}

// ---- 2. 記事と固定ページ
async function listAll(collection) {
	const map = new Map();
	let cursor;
	do {
		const qs = new URLSearchParams({ limit: "100", status: "all" });
		if (cursor) qs.set("cursor", cursor);
		const result = await api("GET", `/content/${collection}?${qs}`);
		for (const item of result.items ?? []) map.set(item.slug, item);
		cursor = result.nextCursor;
	} while (cursor);
	return map;
}

// 作成・更新は下書きとして保存されるため、続けて公開する
async function upsert(collection, existing, slug, payload) {
	const current = existing.get(slug);
	if (DRY) return current ? "updated" : "created";
	if (current) {
		await api("PUT", `/content/${collection}/${current.id}`, payload);
		await api("POST", `/content/${collection}/${current.id}/publish`, {});
		return "updated";
	}
	const result = await api("POST", `/content/${collection}`, { ...payload, slug });
	const id = result.item?.id ?? result.id;
	await api("POST", `/content/${collection}/${id}/publish`, {});
	return "created";
}

async function syncPosts() {
	const count = { created: 0, updated: 0 };
	const failures = [];
	const targets = ONLY ? posts.filter((p) => ONLY.includes(p.slug)) : posts;
	if (ONLY) {
		const missing = ONLY.filter((slug) => !targets.some((p) => p.slug === slug));
		if (missing.length) throw new Error(`--only に data/ にない slug があります: ${missing.join(", ")}`);
	}
	const existing = await listAll("posts");
	// 筆者(seed の byline-editorial)を付ける。見つからなければ筆者なしで保存する
	let bylines;
	try {
		const result = await api("GET", "/admin/bylines?limit=100");
		const editorial = (result.items ?? result.bylines ?? result).find?.((b) => b.slug === "editorial");
		if (editorial) bylines = [{ bylineId: editorial.id }];
	} catch {}
	for (const p of targets) {
		const payload = {
			data: postData(p),
			taxonomies: { category: [p.category], tag: p.tags },
			...(bylines ? { bylines } : {}),
		};
		try {
			count[await upsert("posts", existing, p.slug, payload)]++;
		} catch (error) {
			failures.push(`${p.slug}: ${error.message}`);
		}
	}
	if (!ONLY) {
		try {
			count[await upsert("pages", await listAll("pages"), aboutPage.slug, { data: aboutPage.data })]++;
		} catch (error) {
			failures.push(`page ${aboutPage.slug}: ${error.message}`);
		}
	}
	return { ...count, failures, total: targets.length };
}

const how = await authenticate();
console.log(`同期先: ${BASE}(認証: ${how})${DRY ? " [dry-run]" : ""}`);
const terms = await ensureTerms();
console.log(`用語の追加: ${terms.length ? terms.join(", ") : "なし"}`);
const result = await syncPosts();
console.log(`記事・固定ページ: 新規 ${result.created} / 更新 ${result.updated}(対象の記事 ${result.total}本)`);
for (const f of result.failures) console.log("  失敗 " + f);
