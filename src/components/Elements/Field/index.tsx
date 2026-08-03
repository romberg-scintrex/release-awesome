import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

export function Field({
  label,
  htmlFor,
  error,
  children,
}: Readonly<{
  label: string;
  htmlFor: string;
  error: string | null;
  children: React.ReactNode;
}>) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-ink-400"
      >
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${htmlFor}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 inline-flex items-center gap-1 text-xs text-rose-500"
          >
            <AlertCircle size={11} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}