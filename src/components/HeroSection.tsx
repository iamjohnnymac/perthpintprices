import { Pub } from '@/types/pub'
import HappyHourPreview from './HappyHourPreview'

interface HeroSectionProps {
  pubs: Pub[]
}

export default function HeroSection({ pubs }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-4 sm:pb-6 text-center">
        <h1 className="font-serif text-[2.5rem] sm:text-[3.5rem] lg:text-[4.25rem] text-charcoal leading-[1.08] mb-1.5">
          Perth&apos;s pint prices,{' '}
          <span className="text-amber">sorted.</span>
        </h1>
        <p className="text-base sm:text-lg text-stone-warm max-w-md mx-auto mb-4 leading-relaxed">
          Perth&apos;s cheapest pints, verified weekly.
        </p>
        <HappyHourPreview pubs={pubs} />
      </div>
    </section>
  )
}
