'use client'

import { CrowdLevel, CROWD_LEVELS, CrowdReport } from '@/lib/supabase'

interface CrowdBadgeProps {
  report: CrowdReport
  onClick?: () => void
}

function formatTimeAgo(minutes: number): string {
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function CrowdBadge({ report, onClick }: CrowdBadgeProps) {
  const level = report.crowd_level as CrowdLevel
  const info = CROWD_LEVELS[level]
  
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold
        ${info.color} text-white shadow-sm
        hover:opacity-90 transition-opacity cursor-pointer
      `}
      title={`${report.report_count} report${report.report_count > 1 ? 's' : ''} - Click to update`}
    >
      <span>{info.emoji}</span>
      <span>{info.label}</span>
      <span className="text-white/70 text-[10px]">({formatTimeAgo(report.minutes_ago)})</span>
    </button>
  )
}

// Placeholder badge when no reports exist
export function NoCrowdBadge({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium
        bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors cursor-pointer
      "
      title="No recent reports - Click to report"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      <span>How busy?</span>
    </button>
  )
}
