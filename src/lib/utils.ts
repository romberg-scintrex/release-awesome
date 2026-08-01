export const SITE = {
  name: "Gregorius Dimas A Yudhana",
  shortName: "Grek",
  role: "Software Engineer",
  university: "Universitas Brawijaya",
  location: "Jakarta, Indonesia",
  email: "dimas.yudhana@gmail.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.grek.co.id",
  description: "Backend engineer (Go) and Frontend engineer (React, Next.js) with a passion for building scalable and modern web applications.",
  social: {
    github: "https://github.com/dimasyudhana",
    linkedin: "https://www.linkedin.com/in/gregorius-dimas-a-yudhana-820008251/",
    facebook: "https://www.facebook.com/profile.php?id=100081008444052",
    instagram: "https://www.instagram.com/dimas.yudhana/",
  }
} as const;