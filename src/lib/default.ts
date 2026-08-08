import {
    Code2,
    Server,
    Database,
    Layout,
    Wrench,
    Cloud,
    Users,
    Plane,
    GitBranch,
    BookOpen,
    Dumbbell,
    type LucideIcon,
} from 'lucide-react'

import type { Project, Testimonial, Stat, SlideItem } from "@/lib/types";

// Re-export the shared types so existing imports (`@/lib/data`) keep working.
export type { Project, ProjectCategory, Testimonial, GalleryItem, Stat } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
//  SEED DATA — used as a fallback when Supabase isn't configured,
//  and mirrored by supabase/seed.sql for the live database.
// ─────────────────────────────────────────────────────────────
export const seedProjects: Project[] = [
  {
    id: "1",
    slug: "personal-website",
    title: "Personal Website",
    shortDescription: "A personal website built with Next.js and TypeScript.",
    longDescription: "This is a personal website that showcases my projects, skills, and experience. It is built using Next.js and TypeScript, and it features a responsive design, dark mode, and a blog section.",
    categories: ["Web"],
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase"],
    year: 2025,
    thumbnailURL: "https://picsum.photos/seed/smart-campus/1200/800",
    gallery: [
      {
        type: "image",
        url: "https://picsum.photos/seed/smart-campus-a/1600/1000",
        caption: "Home dashboard",
      },
      {
        type: "image",
        url: "https://picsum.photos/seed/smart-campus-b/1600/1000",
        caption: "Timetable",
      },
      {
        type: "video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        caption: "Walkthrough",
      },
    ],
    featured: true,
    published: true,
    liveURL: null,
    githubURL: "https://github.com/dimasyudhana",
    linkedinURL: "https://www.linkedin.com/in/gregorius-dimas-a-yudhana-820008251/",
    gradient: "from-brand-violet via-brand-fuchsia to-brand-rose",
    sortOrder: 1,
  },
  {
    id: "2",
    slug: "go-pdf-document-generator",
    title: "High-Volume PDF Invoice Generator",
    shortDescription: "Service pembuatan PDF bertingkat tinggi menggunakan worker pool concurrency.",
    longDescription: "Backend service independen berbasis Go yang memanfaatkan goroutines dan worker pool untuk mencetak ribuan dokumen e-invoice dan laporan keuangan PDF secara simultan tanpa mengganggu performa server utama.",
    categories: ["Backend Services"],
    technologies: ["Go", "gofpdf", "PostgreSQL", "S3 Storage", "Docker"],
    year: 2025,
    thumbnailURL: "https://picsum.photos/seed/pdf-gen/1200/800",
    gallery: [
      {
        type: "image",
        url: "https://picsum.photos/seed/pdf-gen-a/1600/1000",
        caption: "Worker Pool & Queue Concurrency Monitor",
      },
      {
        type: "image",
        url: "https://picsum.photos/seed/pdf-gen-b/1600/1000",
        caption: "Generated Invoice Sample Output",
      },
    ],
    featured: true,
    published: true,
    liveURL: null,
    githubURL: "https://github.com/dimasyudhana",
    linkedinURL: "https://www.linkedin.com/in/gregorius-dimas-a-yudhana-820008251/",
    gradient: "from-amber-600 via-orange-700 to-stone-900",
    sortOrder: 2,
  },
  {
    id: "3",
    slug: "go-rate-limiter-api-gateway",
    title: "Distributed Rate Limiter & API Gateway",
    shortDescription: "API Gateway cepat dengan sliding-window rate limiting berbasis Redis.",
    longDescription: "Middleware reverse proxy bertingkat enterprise yang dibangun menggunakan Go net/http dan Redis Lua script. Mampu menahan spike traffic tinggi, memvalidasi JWT secara terpusat, dan menyediakan dynamic route routing.",
    categories: ["Backend Services"],
    technologies: ["Go", "Redis", "Docker", "JWT", "Prometheus"],
    year: 2025,
    thumbnailURL: "https://picsum.photos/seed/rate-limiter/1200/800",
    gallery: [
      {
        type: "image",
        url: "https://picsum.photos/seed/rate-limiter-a/1600/1000",
        caption: "RPS Throughput & Benchmark",
      },
    ],
    featured: false,
    published: true,
    liveURL: null,
    githubURL: "https://github.com/dimasyudhana",
    linkedinURL: null,
    gradient: "from-emerald-600 via-teal-700 to-cyan-900",
    sortOrder: 3,
  },
  {
    id: "4",
    slug: "analytics-realtime-dashboard-ui",
    title: "Enterprise Analytics Dashboard UI",
    shortDescription: "Antarmuka dashboard analitik dengan charting interaktif dan theme kustom.",
    longDescription: "Aplikasi Single Page Application (SPA) kompleks dengan visualisasi data real-time, drag-and-drop widget layout, server-state management efisien, serta fitur Dark/Light mode berbasis Tailwind CSS dan Shadcn UI.",
    categories: ["Web"],
    technologies: ["React", "TypeScript", "Tailwind CSS", "Recharts", "TanStack Query", "Vite"],
    year: 2026,
    thumbnailURL: "https://picsum.photos/seed/analytics-ui/1200/800",
    gallery: [
      {
        type: "image",
        url: "https://picsum.photos/seed/analytics-ui-a/1600/1000",
        caption: "Interactive Charting & Date Range Picker",
      },
      {
        type: "image",
        url: "https://picsum.photos/seed/analytics-ui-b/1600/1000",
        caption: "Custom Widget Builder Modal",
      },
    ],
    featured: true,
    published: true,
    liveURL: "https://analytics-demo.example.com",
    githubURL: "https://github.com/dimasyudhana",
    linkedinURL: "https://www.linkedin.com/in/gregorius-dimas-a-yudhana-820008251/",
    gradient: "from-violet-600 via-fuchsia-600 to-pink-600",
    sortOrder: 4,
  },
  {
    id: "5",
    slug: "design-system-component-library",
    title: "Modular Design System & UI Kit",
    shortDescription: "Koleksi komponen UI reusable yang accessible (WCAG compliant) dan headless.",
    longDescription: "Design system modern yang dibangun di atas Radix UI primitives dan Tailwind CSS. Dilengkapi dokumentasi Storybook interaktif, komutasi keyboard navigation penuh, serta enkapsulasi state menggunakan Zustand.",
    categories: ["Web"],
    technologies: ["React", "TypeScript", "Tailwind CSS", "Storybook", "Radix UI", "Zustand"],
    year: 2025,
    thumbnailURL: "https://picsum.photos/seed/design-system/1200/800",
    gallery: [
      {
        type: "image",
        url: "https://picsum.photos/seed/design-system-a/1600/1000",
        caption: "Component Gallery & Variant Controls",
      },
    ],
    featured: false,
    published: true,
    liveURL: "https://designsystem-demo.example.com",
    githubURL: "https://github.com/dimasyudhana",
    linkedinURL: null,
    gradient: "from-cyan-500 via-blue-600 to-indigo-600",
    sortOrder: 5,
  },
  {
    id: "6",
    slug: "kanban-project-management-app",
    title: "Collaborative Kanban Task Board",
    shortDescription: "Aplikasi manajemen tugas interaktif dengan fitur drag-and-drop dan optimis UI.",
    longDescription: "Antarmuka manajer proyek gaya Trello/Jira dengan fitur drag and drop halus via `@hello-pangea/dnd`, optimistic UI updates untuk response instan tanpa lag, serta integrasi React Hook Form + Zod untuk validasi input kompleks.",
    categories: ["Web"],
    technologies: ["React", "TypeScript", "Tailwind CSS", "React Hook Form", "Zod", "Redux Toolkit"],
    year: 2025,
    thumbnailURL: "https://picsum.photos/seed/kanban-board/1200/800",
    gallery: [
      {
        type: "image",
        url: "https://picsum.photos/seed/kanban-board-a/1600/1000",
        caption: "Kanban Board Drag & Drop View",
      },
      {
        type: "image",
        url: "https://picsum.photos/seed/kanban-board-b/1600/1000",
        caption: "Task Details & Filtering Sidebar",
      },
    ],
    featured: false,
    published: true,
    liveURL: "https://kanban-demo.example.com",
    githubURL: "https://github.com/dimasyudhana",
    linkedinURL: "https://www.linkedin.com/in/gregorius-dimas-a-yudhana-820008251/",
    gradient: "from-rose-500 via-purple-600 to-slate-900",
    sortOrder: 6,
  },
];

export const seedTestimonials: Testimonial[] = [
  {
    id: "seed-t1",
    quote:
      "Kalana's work has this rare quality - every detail looks intentional. The product feels handmade, but ships like a machine.",
    name: "John Boast",
    role: "Lead Engineer, Bloomroom",
    avatarURL: null,
    published: true,
    sortOrder: 1,
  },
  {
    id: "seed-t2",
    quote:
      "One of the most thoughtful junior engineers I've collaborated with. He treats the user, the codebase, and his teammates with the same care.",
    name: "Peter Zalai",
    role: "Senior Designer, Surge",
    avatarURL: null,
    published: true,
    sortOrder: 2,
  },
  {
    id: "seed-t3",
    quote:
      "Picked up Spring Boot in a weekend and shipped a clean microservice the following week. Curious, kind, and quick.",
    name: "Richard Barker",
    role: "University of Moratuwa",
    avatarURL: null,
    published: true,
    sortOrder: 3,
  },
];


// ─────────────────────────────────────────────────────────────
//  STATIC CONTENT (not managed via the admin panel for now)
// ─────────────────────────────────────────────────────────────
export interface SkillGroup {
  category: string;
  icon: LucideIcon;
  items: { name: string; level: number }[];
  accent: string;
}

export const skillGroups: SkillGroup[] = [
  {
    category: "Languages",
    icon: Code2,
    accent: "from-brand-violet to-brand-fuchsia",
    items: [
      { name: "Golang", level: 95 },
      { name: "JavaScript", level: 72 },
      { name: "TypeScript", level: 70 },
      { name: "Python", level: 60 },
    ],
  },
  {
    category: "Frontend",
    icon: Layout,
    accent: "from-brand-cyan to-brand-violet",
    items: [
      { name: "React", level: 74 },
      { name: "Next.js", level: 72 },
      { name: "Tailwind CSS", level: 80 },
    ],
  },
  {
    category: "Backend & APIs",
    icon: Server,
    accent: "from-brand-emerald to-brand-cyan",
    items: [
      { name: "Golang", level: 95 },
      { name: "Node.js", level: 72 },
      { name: "NestJS", level: 72 },
      { name: "REST APIs", level: 90 },
      { name: "GraphQL", level: 0 },
    ],
  },
  {
    category: "Databases",
    icon: Database,
    accent: "from-brand-amber to-brand-rose",
    items: [
      { name: "PostgreSQL", level: 90 },
      { name: "MySQL", level: 85 },
      { name: "MongoDB", level: 82 },
      { name: "QdrantDB", level: 60 },
      { name: "Redis", level: 78 },
    ],
  },
  {
    category: "DevOps & Cloud",
    icon: Cloud,
    accent: "from-brand-violet to-brand-cyan",
    items: [
      { name: "Docker", level: 88 },
      { name: "Kubernetes", level: 76 },
      { name: "AWS", level: 78 },
      { name: "CI / CD", level: 82 },
    ],
  },
  {
    category: "Platform & Tools",
    icon: Wrench,
    accent: "from-brand-rose to-brand-fuchsia",
    items: [
      { name: "Keycloak", level: 78 },
      { name: "WSO2 API Manager", level: 75 },
      { name: "Kafka", level: 78 },
      { name: "Git", level: 92 },
      { name: "VSCode", level: 90 },
      { name: "Figma", level: 80 },
    ],
  },
];

export interface TimelineEntry {
  year: string;
  title: string;
  org: string;
  description: string;
  type: "education" | "experience";
}

export const timeline: TimelineEntry[] = [
  {
    year: "2024 - Present",
    title: "B.Sc. (Hons) in Information Technology and Management",
    org: "University of Moratuwa",
    description:
      "Reading for an honours degree spanning software engineering, distributed systems, and the business of technology.",
    type: "education",
  },
  {
    year: "2026",
    title: "Software Engineering Intern",
    org: "Open to opportunities - actively looking",
    description:
      "Seeking a software engineering / full-stack internship for the 2026 industrial training cycle.",
    type: "experience",
  },
  {
    year: "2025",
    title: "Software Engineer · Part-time (Remote)",
    org: "Ryzera (Pvt) Ltd",
    description:
      "Building and shipping production features remotely while studying full-time.",
    type: "experience",
  },
  {
    year: "2022",
    title: "G.C.E. Advanced Level - Physical Science",
    org: "Z-score 1.498",
    description:
      "Physical Science stream - Combined Maths, Physics, and Chemistry.",
    type: "education",
  },
  {
    year: "2018",
    title: "G.C.E. Ordinary Level - 9 A's",
    org: "Nine A passes (A9)",
    description:
      "Straight A's including English Literature, Business & Accounting Studies, and ICT.",
    type: "education",
  },
];

export interface Hobby {
  name: string;
  icon: LucideIcon;
}

export const hobbies: Hobby[] = [
  { name: "Running", icon: Dumbbell },
  { name: "Hiking", icon: Plane },
  { name: "Leadership", icon: Users },
  { name: "Maintainer", icon: GitBranch },
  { name: "Reading", icon: BookOpen },
];

export const techMarquee = [
  "Golang",
  "Node.js",
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Kafka",
  "Docker",
  "Kubernetes",
  "AWS",
  "Google Cloud Platform",
  "Git",
  "VSCode",
  "CI / CD",
];

// ── Headline stats shown in the home "About" section ──────────────────────────
// These are the FALLBACK values. The live values come from the admin panel
// (site_settings.stats) so they can be edited without a deploy.
export const defaultStats: Stat[] = [
  { 
    value: 3.0, 
    suffix: "/ 4.0", 
    label: "Current GPA",
  },
  {
    value: 3,
    suffix: "+",
    label: "Years writing code",
  },
  { 
    value: 3,
    suffix: "+",
    label: "Projects shipped",
  },
  {
    value: 8,
    suffix: "k",
    label: "Lines of OSS code",
  },
  {
    value: 50,
    suffix: "+",
    label: "Unit Testing",
  },
];

// Professional / engineering practice - the IT-related "real" skills that
// aren't a single tool. Shown on /skills under "How I work" (click to expand).
export interface Practice {
  name: string;
  description: string;
}

export const professionalSkills: Practice[] = [
  {
    name: "Scalable microservices",
    description:
      "Designing systems as independently deployable services that scale out cleanly and fail in isolation.",
  },
  {
    name: "System design",
    description:
      "Mapping components, data flow, and trade-offs up front so the architecture holds as it grows.",
  },
  {
    name: "Event-driven architecture",
    description:
      "Decoupling services with Kafka and RabbitMQ so work flows asynchronously and stays reliable under load.",
  },
  {
    name: "REST API design",
    description:
      "Building clear, versioned, well-documented APIs that other teams can build on with confidence.",
  },
  {
    name: "Database design",
    description:
      "Modelling normalized schemas, indexing, and tuning queries across SQL and NoSQL stores.",
  },
  {
    name: "Team collaboration",
    description:
      "Communicating clearly, sharing ownership, and writing code teammates can pick up without friction.",
  },
  {
    name: "Agile / Scrum",
    description:
      "Working in short iterations with stand-ups, sprint planning, and continuous delivery.",
  },
  {
    name: "Code review",
    description:
      "Giving and receiving feedback that keeps the codebase consistent, readable, and safe to change.",
  },
  {
    name: "Problem solving",
    description:
      "Breaking ambiguous problems into small pieces and validating with the simplest thing that works.",
  },
  {
    name: "Mentoring",
    description:
      "Helping teammates level up through pairing, documentation, and patient explanation.",
  },
];

// ── Compact headline skills for the /about page (links out to /skills). ────────
export const topSkills: string[] = [
  "Golang",
  "React",
  "Next.js",
  "TypeScript",
  "PostgreSQL",
  "Docker",
  "Kubernetes",
];

/**
 * Fallback data for <SlideDesktop/> when `settings.Slides` from
 * the CMS is empty/undefined. Files must live in `public/videos/`.
 * Next.js serves anything in `public/` from the root — so the file at
 * `public/videos/video0001.mp4` is requested as `/videos/video0001.mp4`,
 * WITHOUT the `/public` prefix.
 * Titles/descriptions are placeholder copy too; replace with your own.
 */
export const defaultSlides: SlideItem[] = [
  {
    id: "1",
    video: "/videos/video0001.mp4",
    title: "Kategori Satu",
    description: "Deskripsi singkat untuk kategori pertama.",
    href: "/kategori/satu",
    ctaLabel: "Selengkapnya",
  },
  {
    id: "2",
    video: "/videos/video0002.mp4",
    title: "Kategori Dua",
    description: "Deskripsi singkat untuk kategori kedua.",
    href: "/kategori/dua",
    ctaLabel: "Selengkapnya",
  },
  {
    id: "3",
    video: "/videos/video0003.mp4",
    title: "Kategori Tiga",
    description: "Deskripsi singkat untuk kategori ketiga.",
    href: "/kategori/tiga",
    ctaLabel: "Selengkapnya",
  },
  {
    id: "4",
    video: "/videos/video0004.mp4",
    title: "Kategori Empat",
    description: "Deskripsi singkat untuk kategori keempat.",
    href: "/kategori/empat",
    ctaLabel: "Selengkapnya",
  },
  {
    id: "5",
    video: "/videos/video0005.mp4",
    title: "Kategori Lima",
    description: "Deskripsi singkat untuk kategori kelima.",
    href: "/kategori/lima",
    ctaLabel: "Selengkapnya",
  },
];