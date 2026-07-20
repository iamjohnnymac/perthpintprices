import SubPageNav from '@/components/SubPageNav'
import PintOfTheDay from '@/components/PintOfTheDay'
import Footer from '@/components/Footer'
import type { PintOfTheDayData } from '@/lib/pintOfTheDay'

export default function PintOfTheDayPage({ initialData }: { initialData: PintOfTheDayData | null }) {
  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav breadcrumbs={[
        { label: 'Discover', href: '/discover' },
        { label: 'Pint of the Day' },
      ]} />
      <h1 className="sr-only">Perth Pint of the Day</h1>
      <div className="max-w-container mx-auto px-6 py-8 sm:py-12">
        <PintOfTheDay initialData={initialData} />
      </div>
      <Footer />
    </main>
  )
}
