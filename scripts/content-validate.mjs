// M2 full validator. Fails build (exit 1) on structural errors.
// Coverage gaps are REPORTED (warn) but never auto-filled.
// Mirrors src/domain/question-schema.ts + taxonomy.ts (scripts cannot import TS).
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { parse as parseYaml } from "yaml";

const root = process.cwd();
const errors = [];
const warns = [];
const fail = (msg) => errors.push(msg);

function readYamlFile(path) {
  try {
    return parseYaml(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`${path}: YAML loi cu phap (${e.message})`);
    return null;
  }
}

function parseFrontmatter(path, text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) {
    fail(`${path}: thieu YAML frontmatter`);
    return {};
  }
  try {
    return parseYaml(m[1]);
  } catch (e) {
    fail(`${path}: frontmatter loi (${e.message})`);
    return {};
  }
}

// ---- taxonomy ----
const taxonomyPath = join(root, "content", "taxonomy.yaml");
const taxonomy = existsSync(taxonomyPath) ? readYamlFile(taxonomyPath) : null;
const topicIds = new Set();
const subtopicOf = new Map(); // subId -> topicId
if (!taxonomy || !Array.isArray(taxonomy.topics) || taxonomy.topics.length === 0) {
  fail("content/taxonomy.yaml: thieu danh sach topics");
} else {
  for (const t of taxonomy.topics) {
    if (!t.id || !t.title) fail(`taxonomy: topic thieu id/title (${JSON.stringify(t)})`);
    if (topicIds.has(t.id)) fail(`taxonomy: trung topic id '${t.id}'`);
    topicIds.add(t.id);
    for (const s of t.subtopics ?? []) {
      if (!s.id || !s.title) fail(`taxonomy: subtopic thieu id/title trong '${t.id}'`);
      if (subtopicOf.has(s.id)) fail(`taxonomy: trung subtopic id '${s.id}'`);
      subtopicOf.set(s.id, t.id);
    }
  }
}

// ---- lessons ----
const lessonsDir = join(root, "content", "lessons");
const lessonTopics = new Set();
if (existsSync(lessonsDir)) {
  for (const f of readdirSync(lessonsDir)) {
    if (!f.endsWith(".md")) continue;
    const p = join(lessonsDir, f);
    const raw = readFileSync(p, "utf8");
    const fm = parseFrontmatter(p, raw);
    if (fm.topicId && !topicIds.has(fm.topicId)) {
      fail(`${p}: topicId '${fm.topicId}' khong ton tai trong taxonomy`);
    }
    const body = raw.replace(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/, "").trim();
    if (body.length < 50) fail(`${p}: noi dung bai hoc qua ngan (< 50 ky tu)`);
    if (fm.topicId) {
      if (lessonTopics.has(fm.topicId)) fail(`${p}: trung bai hoc cho topic '${fm.topicId}'`);
      lessonTopics.add(fm.topicId);
    }
  }
}

// ---- questions ----
const questionsDir = join(root, "content", "questions");
const seenIds = new Map(); // id -> file
const coverage = new Map(); // topicId -> {mcq:{nb,th,vd}, tf4:n}
const VALID_LEVELS = new Set(["nb", "th", "vd"]);
const VALID_STATUS = new Set(["draft", "reviewed", "published"]);

function checkQuestion(q, file) {
  const where = `${file}#${q.id ?? "?"}`;
  if (!q.id || typeof q.id !== "string") return fail(`${file}: cau hoi thieu id`);
  if (seenIds.has(q.id)) {
    return fail(`trung ID '${q.id}' (${seenIds.get(q.id)} va ${file})`);
  }
  seenIds.set(q.id, file);
  if (!["mcq", "tf4"].includes(q.type)) return fail(`${where}: type phai la mcq|tf4`);
  if (!topicIds.has(q.topicId)) {
    fail(`${where}: topicId '${q.topicId}' khong ton tai`);
  } else if (q.subtopicId && subtopicOf.get(q.subtopicId) !== q.topicId) {
    fail(`${where}: subtopicId '${q.subtopicId}' khong thuoc topic '${q.topicId}'`);
  }
  if (!VALID_LEVELS.has(q.level)) fail(`${where}: level phai la nb|th|vd`);
  if (!q.stem || typeof q.stem !== "string") fail(`${where}: thieu stem`);
  if (!q.explanation || typeof q.explanation !== "string") {
    fail(`${where}: thieu explanation (loi giai)`);
  }
  if (!VALID_STATUS.has(q.status)) fail(`${where}: status phai la draft|reviewed|published`);
  if (q.source?.kind === "ai-assisted" && q.status !== "draft") {
    fail(`${where}: cau AI sinh phai o status draft`);
  }
  for (const m of q.media ?? []) {
    if (!m.src || !m.alt || m.alt.length < 10) {
      fail(`${where}: media can src va alt >= 10 ky tu`);
    }
    const local = join(root, "content", "assets", basename(m.src));
    if (m.src.startsWith("/assets/") && !existsSync(local)) {
      fail(`${where}: file anh '${m.src}' khong ton tai trong content/assets/`);
    }
  }
  if (q.type === "mcq") {
    const opts = q.mcq?.options;
    if (!Array.isArray(opts) || opts.length !== 4 || opts.some((o) => typeof o !== "string" || !o)) {
      fail(`${where}: mcq phai co dung 4 lua chon`);
    }
    if (!["A", "B", "C", "D"].includes(q.mcq?.correct)) {
      fail(`${where}: mcq.correct phai la A-D`);
    }
  } else {
    const ss = q.tf4?.statements;
    if (!Array.isArray(ss) || ss.length !== 4) {
      fail(`${where}: tf4 phai co dung 4 y`);
    } else {
      const keys = ss.map((s) => s.key).sort().join(",");
      if (keys !== "a,b,c,d") fail(`${where}: tf4 phai co du 4 khoa a-d`);
      for (const s of ss) {
        if (typeof s.isTrue !== "boolean" || !s.text || !s.explanation) {
          fail(`${where}: moi y tf4 can text, isTrue, explanation`);
        }
      }
    }
  }
  const c = coverage.get(q.topicId) ?? { mcq: { nb: 0, th: 0, vd: 0 }, tf4: 0 };
  if (q.type === "mcq" && VALID_LEVELS.has(q.level)) c.mcq[q.level] += 1;
  if (q.type === "tf4") c.tf4 += 1;
  coverage.set(q.topicId, c);
}

if (!existsSync(questionsDir)) {
  warns.push("content/questions/ chua co cau hoi nao");
} else {
  for (const f of readdirSync(questionsDir)) {
    if (!f.endsWith(".yaml") && !f.endsWith(".yml")) continue;
    const data = readYamlFile(join(questionsDir, f));
    if (!Array.isArray(data)) {
      fail(`${f}: file cau hoi phai la danh sach YAML`);
      continue;
    }
    for (const q of data) checkQuestion(q, f);
  }
}

// ---- flashcards ----
const cardsDir = join(root, "content", "flashcards");
const VALID_KINDS = new Set(["term", "formula", "symbol"]);
const cardCoverage = new Map();
if (existsSync(cardsDir)) {
  for (const f of readdirSync(cardsDir)) {
    if (!f.endsWith(".yaml") && !f.endsWith(".yml")) continue;
    const data = readYamlFile(join(cardsDir, f));
    if (!Array.isArray(data)) {
      fail(`${f}: file flashcards phai la danh sach YAML`);
      continue;
    }
    for (const c of data) {
      const where = `${f}#${c.id ?? "?"}`;
      if (!c.id || typeof c.id !== "string") {
        fail(`${f}: the thieu id`);
        continue;
      }
      if (seenIds.has(c.id)) fail(`trung ID '${c.id}' (${seenIds.get(c.id)} va ${f})`);
      seenIds.set(c.id, f);
      if (!topicIds.has(c.topicId)) fail(`${where}: topicId '${c.topicId}' khong ton tai`);
      if (!VALID_KINDS.has(c.kind)) fail(`${where}: kind phai la term|formula|symbol`);
      if (!c.front || !c.back) fail(`${where}: the can front va back`);
      cardCoverage.set(c.topicId, (cardCoverage.get(c.topicId) ?? 0) + 1);
    }
  }
}

// ---- coverage report (WARN only) ----
for (const tid of topicIds) {
  const c = coverage.get(tid) ?? { mcq: { nb: 0, th: 0, vd: 0 }, tf4: 0 };
  const total = c.mcq.nb + c.mcq.th + c.mcq.vd + c.tf4;
  if (total === 0) warns.push(`topic '${tid}': chua co cau hoi nao`);
  else {
    if (c.tf4 === 0) warns.push(`topic '${tid}': thieu cau TF4 (Phan II)`);
    for (const lv of ["nb", "th", "vd"]) {
      if (c.mcq[lv] === 0) warns.push(`topic '${tid}': thieu MCQ muc ${lv}`);
    }
  }
  if ((cardCoverage.get(tid) ?? 0) === 0) warns.push(`topic '${tid}': chua co the ghi nho`);
  if (!lessonTopics.has(tid)) warns.push(`topic '${tid}': chua co bai hoc`);
}

for (const w of warns) console.log(`[content:validate] WARN: ${w}`);
if (errors.length > 0) {
  for (const e of errors) console.error(`[content:validate] ERROR: ${e}`);
  process.exit(1);
}
console.log(`[content:validate] OK. ${seenIds.size} id (cau + the), ${topicIds.size} chu de.`);
