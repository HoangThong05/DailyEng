/**
 * Sinh nội dung bộ từ (từ, phiên âm, nghĩa, câu ví dụ) bằng Claude rồi xuất
 * thành file SQL seed chạy lại được nhiều lần.
 *
 * Chạy:   node scripts/generate-decks.mts            # sinh mọi bộ còn thiếu
 *         node scripts/generate-decks.mts toeic-*    # chỉ các slug khớp mẫu
 *         node scripts/generate-decks.mts --sql-only # không gọi API, chỉ xuất SQL từ JSON có sẵn
 * Cần:    ANTHROPIC_API_KEY trong .env.local — chạy với
 *           node --env-file=.env.local scripts/generate-decks.mts
 *         (hoặc đã `ant auth login`). Node 22.6+ (chạy TypeScript trực tiếp).
 *
 * Kết quả:
 *   scripts/generated/<slug>.json   — nội dung thô, commit vào git, là nguồn sự thật
 *   supabase/seed/<category>.sql    — dựng từ JSON, chạy trong Supabase SQL Editor
 *
 * Bộ đã có JSON thì bỏ qua (xoá file JSON để sinh lại). Trong cùng nhóm, các
 * từ đã sinh ở bộ trước được đưa vào prompt để bộ sau không lặp lại.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const generatedDir = join(here, "generated");
const seedDir = join(root, "supabase", "seed");

type Spec = {
  slug: string;
  name: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  category: string;
  position: number;
  count: number;
  topic: string;
};

const WordSchema = z.object({
  term: z.string().describe("English word or short phrase, lowercase unless a proper noun"),
  phonetic: z.string().describe("IPA transcription in slashes, e.g. /ˈɪnvɔɪs/"),
  meaning_vi: z.string().describe("Short Vietnamese meaning, 1–6 words, with part of speech hint if useful, e.g. 'hoá đơn (n)'"),
  example_en: z.string().describe("One natural example sentence using the term"),
  example_vi: z.string().describe("Vietnamese translation of the example"),
});

const DeckSchema = z.object({ words: z.array(WordSchema) });
type GeneratedWord = z.infer<typeof WordSchema>;

const SYSTEM = `You write vocabulary content for DailyEng, a Vietnamese app for learning English.
Rules:
- Each entry is a single headword or a fixed phrase learners actually meet (e.g. "check in", "as soon as possible").
- Do not repeat words already used in the same category (a list is provided); do not repeat within the deck.
- Pick words by real usefulness for the stated topic and level, not by alphabetical order.
- meaning_vi: concise, natural Vietnamese; add a part-of-speech hint in parentheses when it disambiguates.
- example_en: 6–14 words, everyday register, shows the typical collocation; example_vi is a faithful translation.
- phonetic: British-neutral IPA inside slashes.
Return exactly the requested number of entries.`;

function loadSpecs(): Spec[] {
  const file = JSON.parse(readFileSync(join(here, "deck-specs.json"), "utf8"));
  return file.decks as Spec[];
}

function generatedPath(slug: string) {
  return join(generatedDir, `${slug}.json`);
}

function readGenerated(slug: string): GeneratedWord[] | null {
  const path = generatedPath(slug);
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as GeneratedWord[]) : null;
}

/** Từ đã dùng trong cùng nhóm (từ các bộ đã sinh), để nhắc AI tránh lặp. */
function usedTermsInCategory(specs: Spec[], category: string, exceptSlug: string) {
  const terms = new Set<string>();
  for (const spec of specs) {
    if (spec.category !== category || spec.slug === exceptSlug) continue;
    for (const word of readGenerated(spec.slug) ?? []) terms.add(word.term.toLowerCase());
  }
  return [...terms];
}

async function generateDeck(client: Anthropic, spec: Spec, avoid: string[]): Promise<GeneratedWord[]> {
  const avoidText = avoid.length > 0 ? `\n\nAlready used in this category — do NOT include:\n${avoid.join(", ")}` : "";

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 32000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Deck: "${spec.name}" — ${spec.description}\nLevel: ${spec.level}\nTopic guidance: ${spec.topic}\n\nGenerate exactly ${spec.count} entries.${avoidText}`,
      },
    ],
    output_config: { format: zodOutputFormat(DeckSchema) },
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Refused: ${response.stop_details?.explanation ?? "no explanation"}`);
  }
  const parsed = response.parsed_output;
  if (!parsed) throw new Error("Không đọc được JSON từ phản hồi.");

  // Lọc trùng (không phân biệt hoa thường) trong bộ và với danh sách tránh.
  const seen = new Set(avoid);
  const words: GeneratedWord[] = [];
  for (const word of parsed.words) {
    const key = word.term.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    words.push({ ...word, term: word.term.trim() });
  }
  return words;
}

/** Escape chuỗi cho SQL literal. */
function q(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function buildSeedSql(category: string, specs: Spec[]) {
  const lines: string[] = [
    `-- DailyEng — seed nhóm "${category}". SINH TỰ ĐỘNG bởi scripts/generate-decks.mts, đừng sửa tay.`,
    `-- Chạy SAU schema-07-nhom-bo-tu.sql. Chạy lại nhiều lần được: bộ đã có thì cập nhật tên/mô tả,`,
    `-- từ đã có (deck_id, term) thì giữ nguyên để không mất tiến độ học của người dùng.`,
    ``,
  ];

  for (const spec of specs) {
    const words = readGenerated(spec.slug);
    if (!words) continue;

    lines.push(
      `-- ${spec.name} (${words.length} từ)`,
      `insert into public.decks (slug, name, description, level, category, position)`,
      `values (${q(spec.slug)}, ${q(spec.name)}, ${q(spec.description)}, ${q(spec.level)}, ${q(spec.category)}, ${spec.position})`,
      `on conflict (slug) do update set`,
      `  name = excluded.name, description = excluded.description, level = excluded.level,`,
      `  category = excluded.category, position = excluded.position;`,
      ``,
      `insert into public.words (deck_id, term, phonetic, meaning_vi, example_en, example_vi, position)`,
      `select d.id, w.term, w.phonetic, w.meaning_vi, w.example_en, w.example_vi, w.position`,
      `from public.decks d`,
      `join (values`,
    );
    lines.push(
      words
        .map(
          (w, i) =>
            `  (${q(w.term)}, ${q(w.phonetic)}, ${q(w.meaning_vi)}, ${q(w.example_en)}, ${q(w.example_vi)}, ${i + 1})`,
        )
        .join(",\n"),
    );
    lines.push(
      `) as w(term, phonetic, meaning_vi, example_en, example_vi, position) on true`,
      `where d.slug = ${q(spec.slug)}`,
      `on conflict (deck_id, term) do nothing;`,
      ``,
    );
  }
  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const sqlOnly = args.includes("--sql-only");
  const patterns = args.filter((arg) => !arg.startsWith("--"));
  const matches = (slug: string) =>
    patterns.length === 0 ||
    patterns.some((p) => new RegExp(`^${p.replace(/\*/g, ".*")}$`).test(slug));

  const specs = loadSpecs();
  mkdirSync(generatedDir, { recursive: true });
  mkdirSync(seedDir, { recursive: true });

  if (!sqlOnly) {
    const client = new Anthropic();
    const todo = specs.filter((spec) => matches(spec.slug) && !readGenerated(spec.slug));
    console.log(`Cần sinh ${todo.length} bộ.`);

    // Sinh tuần tự trong cùng nhóm để bộ sau biết từ của bộ trước; các nhóm
    // khác nhau chạy song song.
    const byCategory = new Map<string, Spec[]>();
    for (const spec of todo) byCategory.set(spec.category, [...(byCategory.get(spec.category) ?? []), spec]);

    await Promise.all(
      [...byCategory.entries()].map(async ([category, list]) => {
        for (const spec of list) {
          const avoid = usedTermsInCategory(specs, category, spec.slug);
          process.stdout.write(`→ ${spec.slug} (${spec.count} từ, tránh ${avoid.length}) … `);
          try {
            const words = await generateDeck(client, spec, avoid);
            writeFileSync(generatedPath(spec.slug), JSON.stringify(words, null, 2) + "\n");
            console.log(`xong, ${words.length} từ`);
          } catch (error) {
            if (error instanceof Anthropic.RateLimitError) {
              console.log("bị giới hạn tốc độ — chạy lại sau ít phút, bộ này sẽ được sinh tiếp.");
            } else if (error instanceof Anthropic.APIError) {
              console.log(`lỗi API ${error.status}: ${error.message}`);
            } else {
              console.log(`lỗi: ${(error as Error).message}`);
            }
          }
        }
      }),
    );
  }

  const categories = [...new Set(specs.map((spec) => spec.category))];
  for (const category of categories) {
    const list = specs.filter((spec) => spec.category === category && readGenerated(spec.slug));
    if (list.length === 0) continue;
    const path = join(seedDir, `${category}.sql`);
    writeFileSync(path, buildSeedSql(category, list));
    const total = list.reduce((sum, spec) => sum + (readGenerated(spec.slug)?.length ?? 0), 0);
    console.log(`SQL: supabase/seed/${category}.sql — ${list.length} bộ, ${total} từ`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
