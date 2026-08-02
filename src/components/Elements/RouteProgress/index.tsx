"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function RouteProgress() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((k) => k + 1);
    setShow(true);
    const hide = setTimeout(() => setShow(false), 750);
    return () => clearTimeout(hide);
  }, [pathname]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={key}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            scaleX: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: 0.3, delay: 0.45 },
          }}
          style={{ transformOrigin: "left" }}
          className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-brand-violet via-brand-fuchsia to-brand-rose shadow-[0_0_12px_rgba(217,70,239,0.55)]"
        />
      )}
    </AnimatePresence>
  );
}
