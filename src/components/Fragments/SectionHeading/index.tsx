import { cn } from "@/lib/utils";
import { Reveal } from "@/components/Elements/Reveal";
import { TextReveal } from "@/components/Elements/RevealText";
import { type PropsWithChildren } from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  index?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  /** Heading level for the title. Page-lead headings should be "h1"; defaults to "h2". */
  as?: "h1" | "h2" | "h3";
}

export function SectionHeading({
  eyebrow,
  index,
  title,
  description,
  align = "left",
  className,
  as = "h2",
}: PropsWithChildren<SectionHeadingProps>) {
  return (
    <div
      className={cn(
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <Reveal>
          <div
            className={cn(
              "mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400",
              align === "center" && "justify-center",
            )}
          >
            <span className="tabular-nums text-ink-900 dark:text-white">
              {index ?? "-"}
            </span>
            <span className="h-px w-7 bg-ink-300 dark:bg-ink-700" />
            {eyebrow}
          </div>
        </Reveal>
      )}
      <TextReveal
        as={as}
        text={title}
        delay={0.05}
        className="font-display text-fluid-h2 font-semibold tracking-tight"
      />
      {description && (
        <Reveal delay={0.1}>
          <p className="mt-4 text-base sm:text-lg text-ink-400">
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
