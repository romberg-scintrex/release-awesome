import { getTestimonials } from "@/lib/queries";
import { SaveTestimonial } from "@/components/Layouts/AdminTestimonials/Save";
import { TestimonialRowWithActions } from "@/components/Layouts/AdminTestimonials/RowWithActions";

export default async function AdminTestimonials() {
  
  const testimonialList = await getTestimonials();
  
  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Testimonials
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          The “what people say” section. {testimonialList.length} total.
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