import { cn } from "@/lib/utils";

interface GradientMeshProps {
  className?: string;
}

export function GradientMesh({ className }: Readonly<GradientMeshProps>) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {/* film grain — the editorial texture that replaces the gradient blobs */}
      <div className="noise absolute inset-0" />
      {/* faint single-tone lift from the top so headers don't read flat (no hue) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 50% -5%, rgb(var(--fg) / 0.05), transparent 70%)",
        }}
      />
    </div>
  );
}
