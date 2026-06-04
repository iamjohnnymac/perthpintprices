/**
 * GET /api/weekly-snapshot
 * Alias of /api/cron/weekly-snapshot — same canonical computation, one source
 * of truth. Kept so the older path keeps working.
 */
export { GET } from '@/app/api/cron/weekly-snapshot/route'
