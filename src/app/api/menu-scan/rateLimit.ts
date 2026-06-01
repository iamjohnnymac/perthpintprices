interface RecentReport {
  submission_source?: unknown
  notes?: unknown
}

export function countMenuScanReports(reports: RecentReport[] | null | undefined): number {
  return (reports || []).filter((report) =>
    report.submission_source === 'menu_scan' ||
    (typeof report.notes === 'string' && report.notes.toLowerCase().includes('menu scan'))
  ).length
}
