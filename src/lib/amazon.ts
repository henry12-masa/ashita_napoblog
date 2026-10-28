import { BOOKS, bookQuery } from "../../data/books.mjs";

/** Amazonアソシエイトのトラッキングid */
export const AMAZON_TAG = "hitomi0303-22";

export function amazonSearchUrl(query: string) {
	return `https://www.amazon.co.jp/s?k=${encodeURIComponent(query)}&tag=${AMAZON_TAG}`;
}

export interface Book {
	id: string;
	title: string;
	author: string;
	blurb: string;
	url: string;
}

export function getBook(id: string): Book | null {
	const b = (BOOKS as Record<string, { title: string; author: string; blurb: string }>)[id];
	return b ? { id, ...b, url: amazonSearchUrl(bookQuery(b)) } : null;
}

/** 記事の books 欄(カンマ区切りの id)から本の一覧を作る。知らない id は飛ばす */
export function booksFromField(value: unknown): Book[] {
	if (typeof value !== "string") return [];
	return value
		.split(",")
		.map((s) => getBook(s.trim()))
		.filter((b): b is Book => b !== null);
}

export function allBooks(): Book[] {
	return Object.keys(BOOKS).map((id) => getBook(id)!);
}
