import Link from "next/link";

interface ComingSoonProps {
  title: string;
  milestone: string;
  description: string;
}

export function ComingSoon({ title, milestone, description }: ComingSoonProps) {
  return (
    <section
      aria-labelledby="tieu-de"
      className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5"
    >
      <p className="inline-block rounded-full bg-[var(--bg-sunken)] px-3 py-1 text-xs font-semibold text-[var(--copper)]">
        {milestone}
      </p>
      <h1 id="tieu-de" className="mt-2 text-2xl font-bold">
        {title}
      </h1>
      <p className="mt-2 text-[var(--ink-muted)]">{description}</p>
      <Link href="/" className="mt-4 inline-block underline">
        Về trang chủ
      </Link>
    </section>
  );
}
