// M2/M5 pack builder: content/ -> public/packs/*.json + manifest (version + sha256).
// Copies content/assets/* to public/assets/*.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { parse as parseYaml } from "yaml";

const root = process.cwd();
const taxonomy = parseYaml(readFileSync(join(root, "content", "taxonomy.yaml"), "utf8"));
const questionsDir = join(root, "content", "questions");
const cardsDir = join(root, "content", "flashcards");
const lessonsDir = join(root, "content", "lessons");
const outDir = join(root, "public", "packs");
mkdirSync(outDir, { recursive: true });

const byTopic = new Map();
for (const f of readdirSync(questionsDir)) {
  if (!f.endsWith(".yaml") && !f.endsWith(".yml")) continue;
  const data = parseYaml(readFileSync(join(questionsDir, f), "utf8"));
  for (const q of data) {
    if (!byTopic.has(q.topicId)) byTopic.set(q.topicId, []);
    byTopic.get(q.topicId).push(q);
  }
}

const cardsByTopic = new Map();
if (existsSync(cardsDir)) {
  for (const f of readdirSync(cardsDir)) {
    if (!f.endsWith(".yaml") && !f.endsWith(".yml")) continue;
    const data = parseYaml(readFileSync(join(cardsDir, f), "utf8"));
    for (const c of data) {
      if (!cardsByTopic.has(c.topicId)) cardsByTopic.set(c.topicId, []);
      cardsByTopic.get(c.topicId).push(c);
    }
  }
}

function readLesson(topicId) {
  const path = join(lessonsDir, `${topicId}.md`);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const fm = parseYaml(m[1]);
  return { title: fm.title ?? topicId, body: (m[2] ?? "").trim() };
}

const packs = [];
for (const t of taxonomy.topics) {
  const questions = (byTopic.get(t.id) ?? []).slice().sort((a, b) => a.id.localeCompare(b.id));
  const flashcards = (cardsByTopic.get(t.id) ?? []).slice().sort((a, b) => a.id.localeCompare(b.id));
  const lesson = readLesson(t.id);
  const hash = createHash("sha256")
    .update(JSON.stringify({ questions, flashcards, lesson }))
    .digest("hex")
    .slice(0, 16);
  const pack = { topicId: t.id, title: t.title, version: taxonomy.version, hash, lesson, flashcards, questions };
  writeFileSync(join(outDir, `${t.id}.json`), JSON.stringify(pack) + "\n");
  packs.push({ topicId: t.id, title: t.title, count: questions.length, cards: flashcards.length, hash });
  console.log(`[build-packs] ${t.id}.json: ${questions.length} cau, ${flashcards.length} the (hash ${hash})`);
}

// Copy SVG/assets
const assetsSrc = join(root, "content", "assets");
const assetsDst = join(root, "public", "assets");
if (existsSync(assetsSrc)) {
  mkdirSync(assetsDst, { recursive: true });
  for (const f of readdirSync(assetsSrc)) copyFileSync(join(assetsSrc, f), join(assetsDst, f));
  console.log(`[build-packs] copied assets -> public/assets/`);
}

const manifest = { version: taxonomy.version, taxonomyVersion: taxonomy.version, packs };
writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`[build-packs] manifest: ${packs.length} packs.`);
