'use client'

import { useState, useRef } from 'react'

interface InfoTooltipProps {
  text: string
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLSpanElement>(null)

  const show = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      setPos({ x: r.left + r.width / 2, y: r.bottom + 8 })
    }
    setVisible(true)
  }

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
        className="inline-flex items-center ml-1.5 cursor-help text-xs text-stone-400 hover:text-stone-600 transition-colors select-none"
      >
        ⓘ
      </span>
      {visible && (
        <span
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
          className="pointer-events-none w-56 rounded-lg bg-stone-900 text-white text-xs leading-relaxed px-3 py-2 shadow-xl"
        >
          <span
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: 4,
              borderStyle: 'solid',
              borderColor: 'transparent transparent #1c1917 transparent',
            }}
          />
          {text}
        </span>
      )}
    </>
  )
}
