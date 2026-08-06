"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const techMarquee = [
  {
    image: "https://cdn.simpleicons.org/go",
    description: "Go",
    detail: "Enterprise-grade backend language used for scalable services.",
  },
  {
    image: "https://cdn.simpleicons.org/typescript",
    description: "TypeScript",
    detail: "Typed JavaScript that improves large application maintainability.",
  },
  {
    image: "https://cdn.simpleicons.org/javascript",
    description: "JavaScript",
    detail: "Core language for the web, tooling, and interactive experiences.",
  },
  {
    image: "https://cdn.simpleicons.org/nodedotjs",
    description: "Node.js",
    detail: "JavaScript runtime for fast server-side and tooling workflows.",
  },
  {
    image: "https://cdn.simpleicons.org/react",
    description: "React",
    detail: "Frontend library for building interactive UI components.",
  },
  {
    image: "https://cdn.simpleicons.org/nextdotjs",
    description: "Next.js",
    detail: "React framework for routing, rendering, and full-stack delivery.",
  },
  {
    image: "https://cdn.simpleicons.org/postgresql",
    description: "PostgreSQL",
    detail: "Powerful relational database with reliable ACID semantics.",
  },
  {
    image: "https://cdn.simpleicons.org/mongodb",
    description: "MongoDB",
    detail: "Document database built for flexible, scalable data models.",
  },
  {
    image: "https://cdn.simpleicons.org/redis",
    description: "Redis",
    detail: "In-memory store for cache, session, and pub/sub patterns.",
  },
  {
    image: "https://cdn.simpleicons.org/docker",
    description: "Docker",
    detail: "Container platform for portable application packaging.",
  },
  {
    image: "https://cdn.simpleicons.org/kubernetes",
    description: "Kubernetes",
    detail: "Orchestration system for managing container workloads.",
  },
  {
    image: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
    description: "AWS",
    detail: "Cloud platform for infrastructure, storage, and managed services.",
  },
  {
    image: "https://cdn.simpleicons.org/apachekafka",
    description: "Kafka",
    detail: "Distributed event streaming backbone for real-time systems.",
  },
  {
    image: "https://cdn.simpleicons.org/git",
    description: "Git",
    detail: "Version control system for change tracking and collaboration.",
  },
  {
    image: "https://cdn.simpleicons.org/githubactions",
    description: "CI / CD",
    detail: "Automated delivery pipeline for continuous integration and deployment.",
  },
];

export function MarqueeTech() {
  const rows = [...techMarquee, ...techMarquee];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const isHoveringRef = useRef(false);
  const activeIndexRef = useRef<number | null>(null);

  useEffect(() => {
    let rafId = 0;

    const syncHoveredTech = () => {
      if (!isHoveringRef.current) {
        rafId = window.requestAnimationFrame(syncHoveredTech);
        return;
      }

      const hovered = document.elementFromPoint(pointerRef.current.x, pointerRef.current.y);
      const card = hovered?.closest("[data-tech-index]") as HTMLElement | null;
      const nextIndex = card ? Number(card.dataset.techIndex) : null;

      if (nextIndex !== null && nextIndex !== activeIndexRef.current) {
        activeIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
      }

      if (nextIndex === null && activeIndexRef.current !== null) {
        activeIndexRef.current = null;
        setActiveIndex(null);
      }

      rafId = window.requestAnimationFrame(syncHoveredTech);
    };

    rafId = window.requestAnimationFrame(syncHoveredTech);

    return () => window.cancelAnimationFrame(rafId);
  }, []);

  return (
    <section className="relative overflow-hidden border-y border-black/10 py-12 dark:border-white/10">

      <div className="container">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.24em] text-ink-400">
          Tools which I use on a daily basis.
        </p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[rgb(var(--bg))] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[rgb(var(--bg))] to-transparent" />

        <div
          aria-hidden
          className="flex w-max items-center gap-8 whitespace-nowrap px-4 animate-marquee"
          style={{ "--marquee-duration": "120s" } as React.CSSProperties}
          onPointerEnter={() => {
            isHoveringRef.current = true;
          }}
          onPointerMove={(event) => {
            pointerRef.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerLeave={() => {
            isHoveringRef.current = false;
            activeIndexRef.current = null;
            setActiveIndex(null);
          }}
        >
          {rows.map((label, i) => {
            const isActive = activeIndex === i;

            return (
              <div key={`${label.description}-${i}`} className="relative flex flex-col items-center">
                <motion.div
                  layout
                  whileHover={{ y: -2, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}                  
                  data-tech-index={i}                  
                  className="relative flex h-20 w-20 items-center justify-center rounded-[2rem] border border-black/5 bg-white/80 shadow-[0_8px_20px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/[0.05]"
                  onPointerEnter={() => setActiveIndex(i)}
                  onPointerMove={() => setActiveIndex(i)}
                  onPointerLeave={() => setActiveIndex(null)}
                >
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 rounded-[2rem] bg-white/70 dark:bg-white/[0.07]"
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  />

                  <Image
                    src={label.image}
                    alt={label.description}
                    width={48}
                    height={48}
                    unoptimized
                    className="relative z-10 h-12 w-12 object-contain transition-transform duration-300 ease-out"
                    loading="lazy"
                    decoding="async"
                  />
                </motion.div>

                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div
                      key={`${label.description}-${i}-tooltip`}
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="pointer-events-none absolute left-1/2 top-[calc(100%+0.80rem)] z-20 w-[14rem] -translate-x-1/2"
                      style={{ marginLeft: "calc(50% - 5rem)", marginRight: "calc(50% - 5rem)" }}
                    >
                      <p className="mt-1 text-[10px] leading-4 text-ink-500 dark:text-ink-300">
                        {label.detail}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
