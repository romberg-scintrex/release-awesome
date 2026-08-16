import { cn } from "@/lib/utils";
import { type PropsWithChildren } from "react";

interface GradientTextProps {
  className?: string;
  // `variant` is kept for API compatibility with existing call sites, but the
  // editorial design uses a single restrained accent instead of rainbow gradients.
  variant?: "warm" | "cool" | "fire";
  as?: "span" | "h1" | "h2" | "h3" | "h4";
}

export function GradientText({
  children,
  className,
  as: Tag = "span",
}: PropsWithChildren<GradientTextProps>) {
  return (
    <Tag className={cn("text-[#6d28d9] dark:text-[#a78bfa]", className)}>{children}</Tag>
  );
}
