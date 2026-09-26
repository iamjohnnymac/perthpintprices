import OpenAI from 'openai'

export const MENU_SCAN_TIMEOUT_MS = 12_000
export const MENU_SCAN_MAX_RETRIES = 1

export function createMenuScanClient(apiKey: string, fetchImpl?: typeof fetch) {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    timeout: MENU_SCAN_TIMEOUT_MS,
    maxRetries: MENU_SCAN_MAX_RETRIES,
    ...(fetchImpl ? { fetch: fetchImpl } : {}),
  })
}

export function createMenuScanCompletion(client: OpenAI, dataUrl: string) {
  return client.chat.completions.create({
    model: 'qwen/qwen3.5-flash-02-23',
    max_completion_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract beer and cider names with their pint prices from this menu photo. Return ONLY a valid JSON array with no other text. Each item should have: "beer_type" (string, the drink name), "price" (number, the pint price in dollars), "price_type" ("regular" or "happy_hour"). Only extract pint-sized drinks. If a section is labelled happy hour or similar, use "happy_hour" as price_type. If you cannot extract any prices, return an empty array []. Do not guess or make up prices.`,
          },
          {
            type: 'image_url',
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
  })
}
