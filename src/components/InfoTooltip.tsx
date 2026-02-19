'use client'

interface InfoTooltipProps {
  text: string
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span className="relative group inline-flex items-center ml-1.5">
      <span className="text-xs text-stone-400 cursor-help hover:text-stone-600 transition-colors select-none">ⓘ</span>
      <span className="
        pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
        w-56 rounded-lg bg-stone-900 text-white text-xs leading-relaxed px-3 py-2 shadow-xl
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
        before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2
        before:border-4 before:border-transparent before:border-t-stone-900
      ">
        {text}
      </span>
    </span>
  )
}
