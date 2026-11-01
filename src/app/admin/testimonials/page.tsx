import { getListTestimonials } from "@/lib/admin/queries";
import { SaveTestimonial } from "@/components/Layouts/AdminTestimonials/Save";
import { TestimonialRowWithActions } from "@/components/Layouts/AdminTestimonials/RowWithActions";

// Reads rows the editor still has to act on, and every mutation on this page
// revalidates it - so it must never be served from a cache.
export const dynamic = "force-dynamic";

export default async function AdminTestimonials() {

  // getListTestimonials (cookie client, no published filter) - NOT the public
  // getTestimonials, which hard-filters published=true and would hide exactly
  // the drafts an editor comes here to publish.
  const testimonialList = await getListTestimonials();

  const draftCount = testimonialList.filter((t) => !t.published).length;

  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Testimonials
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          The “what people say” section. {testimonialList.length} total
          {draftCount > 0 && `, ${draftCount} not published`}.
        </p>
      </header>
      <div className="mt-6 space-y-3">
        <SaveTestimonial />
        {testimonialList.map((t) => (
          <TestimonialRowWithActions key={t.id} item={t} />
        ))}
      </div>
    </div>
  )
}
