import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type CrowdLevel = 1 | 2 | 3 | 4

export interface CrowdReport {
  pub_id: string
  crowd_level: CrowdLevel
  report_count: number
  latest_report: string
  minutes_ago: number
}

export const CROWD_LEVELS = {
  1: { label: 'Empty', emoji: '😴', color: 'bg-blue-500' },
  2: { label: 'Moderate', emoji: '👥', color: 'bg-green-500' },
  3: { label: 'Busy', emoji: '🍻', color: 'bg-yellow-500' },
  4: { label: 'Packed', emoji: '🔥', color: 'bg-red-500' },
} as const

export async function getCrowdLevels(): Promise<Record<string, CrowdReport>> {
  const { data, error } = await supabase.rpc('get_live_crowd_levels')
  
  if (error) {
    console.error('Error fetching crowd levels:', error)
    return {}
  }
  
  const crowdMap: Record<string, CrowdReport> = {}
  for (const report of data || []) {
    crowdMap[report.pub_id] = report
  }
  return crowdMap
}

export async function reportCrowdLevel(pubId: string, level: CrowdLevel): Promise<boolean> {
  const { error } = await supabase
    .from('crowd_reports')
    .insert({
      pub_id: pubId,
      crowd_level: level,
    })
  
  if (error) {
    console.error('Error reporting crowd level:', error)
    return false
  }
  return true
}
