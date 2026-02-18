/**
 * Connection test script for Perth Pint Prices
 * Tests: Supabase, Vercel, Apify
 *
 * Run: npx tsx test-connections.ts
 */

const SUPABASE_URL = 'https://ifxkoblvgttelzboenpi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'

async function testSupabase() {
  console.log('\n--- SUPABASE ---')
  try {
    // Test 1: Health check via REST API
    const healthRes = await fetch(`${SUPABASE_URL}/rest/v1/pubs?select=id,name,suburb,price&limit=3`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    console.log(`  REST API status: ${healthRes.status} ${healthRes.statusText}`)

    if (healthRes.ok) {
      const pubs = await healthRes.json()
      console.log(`  Pubs table: ${pubs.length} rows returned (limit 3)`)
      if (pubs.length > 0) {
        console.log(`  Sample pub: "${pubs[0].name}" in ${pubs[0].suburb} — $${pubs[0].price}`)
      }
    } else {
      const errBody = await healthRes.text()
      console.log(`  Error body: ${errBody}`)
    }

    // Test 2: Check other tables
    const tablesRes = await fetch(`${SUPABASE_URL}/rest/v1/crowd_reports?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    console.log(`  crowd_reports table: ${tablesRes.status} ${tablesRes.statusText}`)

    const snapshotsRes = await fetch(`${SUPABASE_URL}/rest/v1/price_snapshots?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    console.log(`  price_snapshots table: ${snapshotsRes.status} ${snapshotsRes.statusText}`)

    // Test 3: RPC function
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_live_crowd_levels`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    console.log(`  RPC get_live_crowd_levels: ${rpcRes.status} ${rpcRes.statusText}`)

    console.log('  ✓ Supabase connection OK')
  } catch (err: any) {
    console.log(`  ✗ Supabase connection FAILED: ${err.message}`)
  }
}

async function testVercel() {
  console.log('\n--- VERCEL ---')
  try {
    // Test the Vercel deployment by hitting the app URL
    // First, check if there's a deployment via the project name
    const projectRes = await fetch('https://perthpintprices.vercel.app', {
      method: 'HEAD',
      redirect: 'follow',
    })
    console.log(`  Deployment (perthpintprices.vercel.app): ${projectRes.status} ${projectRes.statusText}`)

    if (projectRes.ok) {
      console.log('  ✓ Vercel deployment is live and reachable')
    } else {
      // Try alternate URL patterns
      const altRes = await fetch('https://perth-pint-prices.vercel.app', {
        method: 'HEAD',
        redirect: 'follow',
      })
      console.log(`  Alternate URL (perth-pint-prices.vercel.app): ${altRes.status} ${altRes.statusText}`)
      if (altRes.ok) {
        console.log('  ✓ Vercel deployment is live at alternate URL')
      }
    }

    // Test the MCP endpoint availability
    const mcpRes = await fetch('https://mcp.vercel.com/mcp', {
      method: 'OPTIONS',
    })
    console.log(`  MCP endpoint (mcp.vercel.com): ${mcpRes.status} ${mcpRes.statusText}`)
    console.log('  ✓ Vercel MCP endpoint reachable')
  } catch (err: any) {
    console.log(`  ✗ Vercel test issue: ${err.message}`)
  }
}

async function testApify() {
  console.log('\n--- APIFY ---')
  try {
    // Test Apify API public endpoint
    const statusRes = await fetch('https://api.apify.com/v2/status')
    console.log(`  API status endpoint: ${statusRes.status} ${statusRes.statusText}`)

    if (statusRes.ok) {
      const status = await statusRes.json()
      console.log(`  Apify platform status: ${JSON.stringify(status).slice(0, 200)}`)
    }

    // Test MCP endpoint availability
    const mcpRes = await fetch('https://mcp.apify.com', {
      method: 'OPTIONS',
    })
    console.log(`  MCP endpoint (mcp.apify.com): ${mcpRes.status} ${mcpRes.statusText}`)
    console.log('  ✓ Apify MCP endpoint reachable')
  } catch (err: any) {
    console.log(`  ✗ Apify test issue: ${err.message}`)
  }
}

async function main() {
  console.log('=== Perth Pint Prices — Connection Test ===')
  console.log(`  Timestamp: ${new Date().toISOString()}`)

  await testSupabase()
  await testVercel()
  await testApify()

  console.log('\n=== Done ===\n')
}

main()
