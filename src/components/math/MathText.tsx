"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Render Markdown + LaTeX ($...$, $$...$$).
 * Safety: rehype-raw is NEVER added, so raw HTML in content is rendered as
 * text, not executed. No dangerouslySetInnerHTML anywhere.
 */
export function MathText({ text, className }: MathTextProps) {
  return (
    <div className={className ? `md ${className}` : "md"}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
