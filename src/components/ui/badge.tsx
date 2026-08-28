import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em]",
  {
    variants: {
      tone: {
        neutral: "bg-surface-2 text-muted",
        pass: "bg-pass/15 text-pass",
        fail: "bg-fail/15 text-fail",
        warn: "bg-warn/15 text-warn",
        info: "bg-capability/15 text-capability",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
