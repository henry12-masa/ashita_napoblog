# あしたの習慣

自己啓発に特化したブログ。習慣・考え方・時間の使い方・学び方・人間関係・睡眠と運動を、研究と名著をもとに「今日できる一歩」に落として紹介する。

公開URL: https://ashita.napoblog.com

[EmDash](https://github.com/emdash-cms/emdash)(Astro製CMS)で作り、Cloudflare Workers「ashita-no-shukan」+ D1 + R2 + KV で動かしている。土台は姉妹サイト「走り継ぐ」(mini4wd-curation)。`node_modules` は game-curation へのジャンクション。

## ページ

| ページ | パス |
|---|---|
| トップ(今日の一歩・テーマ・新着・本棚) | `/` |
| 記事一覧 / 記事 | `/posts`, `/posts/:slug` |
| テーマ一覧 / テーマ別 | `/themes`, `/category/:slug` |
| タグ別 | `/tag/:slug` |
| 本棚(記事で紹介した本とAmazonリンク) | `/books` |
| 検索 | `/search` |
| このサイトについて / プライバシーポリシー | `/pages/about`, `/privacy` |

## データ

- 記事は `data/posts-*.mjs` に `post({ slug, date, title, excerpt, category, tags, action, books, body })` で書く
  - `body` の書式: `## 見出し` / `### 小見出し` / `> 引用` / `- 箇条書き` / `1. 番号` / `**太字**` / `[[slug]]`(別の記事へのリンク)
  - `action` は記事の最後に出す「今日の一歩」、`books` は `data/books.mjs` の id
  - `date` は並び順用(seed は公開日時を指定できない)
- テーマとタグは `data/taxonomies.mjs`、本は `data/books.mjs`(Amazonタグ hitomi0303-22、「書名 著者」で検索リンク)
- `node scripts/build-seed.mjs` で `seed/seed.json` を生成(seed は空のデータベースにだけ適用される)
- 公開後の記事の追加・更新は `node scripts/sync-remote.mjs --url https://ashita.napoblog.com`(先に `npx emdash login --url ...`)

## 書き方の方針

- 研究や名著にもとづいて書き、数字や研究は確かめたものだけを載せる。結果が分かれる研究はそう書く
- 「必ず変わる」などの断定はしない。医療・心理療法の代わりではないことを必要に応じて添える
- キャラクター口調は使わない

## 広告

AdSense(ca-pub-8398161859137802)のスクリプトは Base.astro。サイト専用の広告ユニットを作ったら `src/lib/ads.ts` の `AD_SLOTS` にIDを入れる(空のあいだは広告枠を出さない)。

## デプロイ

`npm run deploy`(astro build && wrangler deploy)。EMDASH_ENCRYPTION_KEY は wrangler secret に登録済み(ローカルは .env)。
