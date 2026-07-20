import { stat } from 'node:fs/promises'

const budgets = [
  ['.next/server/app/index.html', 500_000],
  ['.next/server/app/index.rsc', 425_000],
]

for (const [file, limit] of budgets) {
  const { size } = await stat(file)
  if (size > limit) {
    throw new Error(`[homepage-payload] ${file} is ${size} bytes; budget is ${limit}`)
  }
  console.log(`[homepage-payload] PASS: ${file} is ${size} bytes (budget ${limit})`)
}
