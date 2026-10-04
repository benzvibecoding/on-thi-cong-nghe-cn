import type { Question } from "@/domain/question-schema";

/** Serialize one question to the repo YAML format (single-item list). Client-side, no deps. */

function q(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function indent(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : pad + line))
    .join("\n");
}

export function questionToYaml(question: Question): string {
  const lines: string[] = [`- id: ${question.id}`, `  type: ${question.type}`];
  lines.push(`  topicId: ${question.topicId}`);
  if (question.subtopicId) lines.push(`  subtopicId: ${question.subtopicId}`);
  lines.push(`  level: ${question.level}`);
  if (question.skill) lines.push(`  skill: ${question.skill}`);
  lines.push(`  stem: ${q(question.stem)}`);
  if (question.media && question.media.length > 0) {
    lines.push(`  media:`);
    for (const m of question.media) {
      lines.push(`    - src: ${m.src}`);
      lines.push(`      alt: ${q(m.alt)}`);
      if (m.credit) lines.push(`      credit: ${q(m.credit)}`);
    }
  }
  if (question.type === "mcq" && question.mcq) {
    lines.push(`  mcq:`);
    lines.push(`    options:`);
    for (const o of question.mcq.options) lines.push(`    - ${q(o)}`);
    lines.push(`    correct: ${question.mcq.correct}`);
  }
  if (question.type === "tf4" && question.tf4) {
    lines.push(`  tf4:`);
    if (question.tf4.context) lines.push(`    context: ${q(question.tf4.context)}`);
    lines.push(`    statements:`);
    for (const s of question.tf4.statements) {
      lines.push(`      - key: ${s.key}`);
      lines.push(`        text: ${q(s.text)}`);
      lines.push(`        isTrue: ${s.isTrue}`);
      lines.push(`        explanation: ${q(s.explanation)}`);
    }
  }
  lines.push(`  explanation: ${q(question.explanation)}`);
  if (question.commonMistake) lines.push(`  commonMistake: ${q(question.commonMistake)}`);
  const src = question.source;
  const extra = [
    src.ref ? `ref: ${q(src.ref)}` : "",
    src.year !== undefined ? `year: ${src.year}` : "",
  ].filter(Boolean);
  lines.push(`  source: { kind: ${src.kind}${extra.length > 0 ? `, ${extra.join(", ")}` : ""} }`);
  lines.push(`  status: ${question.status}`);
  if (question.reviewedBy) lines.push(`  reviewedBy: ${q(question.reviewedBy)}`);
  if (question.reviewedAt) lines.push(`  reviewedAt: ${q(question.reviewedAt)}`);
  lines.push(`  version: ${question.version}`);
  lines.push(
    `  tags: [${question.tags.map((t) => q(t)).join(", ")}]`
  );
  return lines.join("\n") + "\n";
}

export function indentBlock(text: string, spaces: number): string {
  return indent(text, spaces);
}
