import { Mail, MapPin, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/Elements/Badge";
import type { ContactInfoProps } from "./types";

/**
 * Pure presentational component — receives all data via props.
 * No data fetching, no side effects. Easy to test and reuse.
 */
export function ContactInfoView({
  email,
  location,
  locationFlag = "",
  timezone,
  mapEmbedSrc,
  mapTitle,
  socials,
}: Readonly<ContactInfoProps>) {
  return (
    <div className="flex h-full flex-col gap-5">
      {/* Email card */}
      <a
        href={`mailto:${email}`}
        className="group flex items-center justify-between rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-ink-900 p-5 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800"
      >
        <div className="flex items-center gap-4">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-ink-900/10 text-ink-700 dark:border-white/10 dark:text-ink-200">
            <Mail size={18} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-ink-400">Email</div>
            <div className="mt-0.5 font-medium">{email}</div>
          </div>
        </div>
        <ArrowUpRight
          size={16}
          className="text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </a>

      {/* Location card */}
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-ink-900 p-5">
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-ink-900/10 text-ink-700 dark:border-white/10 dark:text-ink-200">
              <MapPin size={18} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-ink-400">Based in</div>
              <div className="mt-0.5 font-medium">
                {location} <span>{locationFlag}</span>
              </div>
            </div>
          </div>
          <Badge>{timezone}</Badge>
        </div>
        <div className="relative mt-6 min-h-[10rem] flex-1 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          <iframe
            title={mapTitle}
            src={mapEmbedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="h-full w-full border-0 grayscale-[0.2] dark:grayscale dark:invert-[0.92] dark:hue-rotate-180"
          />
        </div>
      </div>

      {/* Social grid */}
      <div className="grid grid-cols-2 gap-3">
        {socials.map(({ Icon, label, value, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-ink-900 p-4 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800"
          >
            <div className="flex items-center gap-3">
              <Icon size={16} className="text-ink-500 dark:text-ink-300" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.14em] text-ink-400">
                  {label}
                </div>
                <div className="truncate text-sm font-medium">{value}</div>
              </div>
            </div>
            <ArrowUpRight
              size={14}
              className="text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
