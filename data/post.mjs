import { doc } from "./doc.mjs";

/**
 * 記事1本。
 * date: 公開日(YYYY-MM-DD) / action: 記事の最後に出す「今日の一歩」 / books: books.mjs の id
 */
export const post = ({ slug, date, title, excerpt, category, tags = [], action, books = [], body }) => ({
	slug, date, title, excerpt, category, tags, action, books, ...doc(body),
});
