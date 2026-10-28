# 定期記事追加の手順(水・土)

「あしたの習慣」(https://ashita.napoblog.com)に、自己啓発の記事を1本追加する。作業フォルダは `C:\Users\thier\Desktop\jikokeihatsu-blog`。

## 1. テーマを決める

1. `node scripts/check-posts.mjs` で既存の記事一覧とテーマ別の本数を見る
2. 本数がいちばん少ないテーマ(同数なら直近で書いていないほう)から選ぶ
3. 既存の記事と内容が重ならない題材にする。タイトルが違っても、中心の主張や紹介する研究が同じなら重複とみなす
4. 読者が実際に悩んでいること(先延ばし、人間関係、睡眠、お金の不安など)に結びつく題材を選ぶ

## 2. 調べる(省略しない)

- 記事で紹介する研究・数字・制度・人物の所属は、WebSearch で一次情報か信頼できる解説(大学・公的機関・学術誌・著者本人)に当たって確かめる
- 確かめられないことは書かない。結果が分かれている研究は「結果が分かれている」と書く
- 「21日で習慣になる」「目標を書いた3%の卒業生」のような出どころ不明の通説は、事実として書かない
- 紹介する本は、日本語版の正式な書名と著者名を出版社や書店のページで確かめる。邦訳がない本は紹介しない

## 3. 書く

- `data/posts-auto.mjs` の配列の末尾に `post({...})` を1つ足す。書式は `data/posts-habits.mjs` などの既存記事と同じ
  - `slug`:英小文字とハイフン。既存と重ならない
  - `date`:実行日(YYYY-MM-DD)
  - `category`:`data/taxonomies.mjs` の CATEGORIES の slug
  - `tags`:`data/taxonomies.mjs` の TAGS のキーから1〜3個(新しいタグは作らない)
  - `action`:記事の最後に出す「今日の一歩」。今日すぐできる、具体的で小さな行動を1文で
  - `books`:`data/books.mjs` の id を1〜3個。新しい本を紹介するときは `data/books.mjs` に足す(blurb は事実だけ、効果をうたわない)
- 本文は `## 見出し` で6〜10節。`[[slug]]` で関連する既存記事に2〜3か所リンクする
- 本文の字数は **2,300〜2,600字**(`node scripts/check-posts.mjs <slug>` で確かめる。足りなければ節を足す)
- 文体:です・ます調の落ち着いた話し言葉。キャラクター口調・語尾の遊びは使わない。「必ず」「絶対」「人生が変わる」などの断定や誇張をしない
- 心の不調・睡眠・運動・お金など、専門家の判断が要る話題では「医療や専門家への相談の代わりではない」ことを本文に添える。個別の投資・金融商品はすすめない

## 4. 反映する

1. `node scripts/build-seed.mjs`(検証エラーがないこと)
2. `data/books.mjs` を変えたときは `npx astro check` → `npm run deploy`(本棚と紹介本の表示はコード側のデータを使うため)
3. `npx emdash whoami --url https://ashita.napoblog.com` でトークンを更新(期限切れなら 401。そのときは同期せず、ユーザーに `npx emdash login --url https://ashita.napoblog.com` を頼んで終える)
4. `node scripts/sync-remote.mjs --url https://ashita.napoblog.com --only <slug>`(全件を書き直さない)
5. `curl -s -o /dev/null -w "%{http_code}" https://ashita.napoblog.com/posts/<slug>` が 200 になることを確認
6. GitHub に反映:`git -C C:/Users/thier/Desktop/jikokeihatsu-blog add -A` → `commit -m "記事追加: <タイトル>"` → `push`。git 操作が許可されずに止まったら、無理に回避せず、報告に「push が必要」と書く

## 5. 記録と報告

- `AUTO_POST_LOG.md` の末尾に「日付・slug・タイトル・テーマ・字数・紹介本・push できたか」を1行で足す
- 最後の報告は短く:追加した記事のタイトルとURL、字数、確かめた主な出典、push の有無、ユーザーにやってほしいこと(あれば)
