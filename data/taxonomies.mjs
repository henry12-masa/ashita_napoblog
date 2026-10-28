// カテゴリ(テーマ)とタグ
export const CATEGORIES = [
	{ slug: "habits", label: "習慣づくり", lead: "続かないのは意志が弱いからではありません。仕組みで続ける方法。" },
	{ slug: "mindset", label: "考え方とこころ", lead: "落ち込んだとき、不安なときに、自分を責めずに立て直す考え方。" },
	{ slug: "time", label: "時間と集中", lead: "忙しさに流されず、大事なことに時間と注意を使うために。" },
	{ slug: "learning", label: "学びと読書", lead: "読んだら忘れない、学んだら使える。身につく学び方。" },
	{ slug: "career", label: "仕事と生き方", lead: "強み、選択、長い人生の働き方。自分の軸のつくり方。" },
	{ slug: "relationships", label: "人間関係", lead: "人に振り回されず、人を大切にする。関係を楽にする考え方。" },
	{ slug: "body", label: "からだと睡眠", lead: "やる気も集中も、まずは体から。睡眠と運動の土台づくり。" },
];

export const TAGS = {
	beginner: "はじめての人へ",
	"small-step": "小さな一歩",
	research: "研究からわかること",
	classic: "名著を読む",
	stress: "ストレス・不安",
	morning: "朝の過ごし方",
	writing: "書く習慣",
	smartphone: "スマホとの距離",
};

export const categoryBySlug = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
