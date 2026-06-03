export type ArticleCategory = 'Cheap pints' | 'Happy hour' | 'Pub data' | 'Perth drinking basics'

export type ArticleLiveModule = 'under10' | 'happyHoursByDay' | 'glassSizes'

export interface ArticleSection {
  heading: string
  body: string[]
}

export interface Article {
  slug: string
  title: string
  deck: string
  description: string
  category: ArticleCategory
  author: string
  publishedAt: string
  updatedAt: string
  readingMinutes: number
  heroLabel: string
  heroStat: string
  heroSubstat: string
  image: string
  imageAlt: string
  liveModule: ArticleLiveModule
  sections: ArticleSection[]
  relatedLinks: Array<{ href: string; label: string }>
}

export const articles: Article[] = [
  {
    slug: 'pints-under-10-perth',
    title: 'Where Perth still has pints under $10',
    deck: "Perth's average pint sits a little over $9, and a sub-$10 one is no longer a given. Eight pubs in our database still come in under it — one at $6 — and the reasons they stay cheap are more structural than lucky.",
    description: "Eight Perth pubs with a verified pint under $10 — from a $6 club in Fremantle to the $7 strip in Northbridge — with checked dates and the structural reasons the cheap ones hold.",
    category: 'Cheap pints',
    author: 'Perth Pint Prices',
    publishedAt: '2026-06-03T00:00:00.000+08:00',
    updatedAt: '2026-06-03T00:00:00.000+08:00',
    readingMinutes: 6,
    heroLabel: 'Cheap pints',
    heroStat: 'Under $10',
    heroSubstat: 'Verified prices only',
    image: '/og-image.png',
    imageAlt: 'Perth Pint Prices pint-price board',
    liveModule: 'under10',
    sections: [
      {
        heading: 'The short version',
        body: [
          "Eight pubs in the database hold a verified pint under $10 right now — one at $6, the rest at $7. Perth's average sits a little over $9, so a $7 pint runs about two dollars under what most of the city charges for the same 570ml.",
          "The live rows below are the current version of this list, pulled from the database with each pub's last-checked date attached. The prose here is the context around them: which pubs, in which suburbs, and why their prices hold. Most were last confirmed in February 2026, so treat the rows as the source of truth, not the paragraphs.",
          "One honest caveat first: this is the cheapest we have confirmed, not the cheapest that exists. We track 857 pubs and plenty still sit at TBC. If a pub you rate isn't on the list, it usually means we haven't checked its price cleanly enough to publish — not that it has gone dear.",
        ],
      },
      {
        heading: 'The $6 outlier in Fremantle',
        body: [
          "The cheapest verified pint in Perth is $6, for a house lager at the Fremantle Buffalo Club on High Street — checked by a punter on 2 March 2026, and a full $3 under the Fremantle suburb average of $9.11.",
          "It holds that price because it isn't really a pub. The Buffalo Club started as a workers' lodge in 1921, moved into 54 High Street in 1938, and was written into its own act of state parliament — the Fremantle Buffalo Club (Incorporated) Act 1964. It runs as a not-for-profit with open membership, so member pricing is the point of the place, not a promotion it is running this month.",
          "The $6 is the standing price, too, not a happy-hour trick. There's a window from 5pm to 6pm, but the lager costs $6 either side of it. That's rare — most of the cheap end of Perth needs you to turn up at the right hour.",
        ],
      },
      {
        heading: 'The $7 strip in Northbridge',
        body: [
          "Four pubs on or near William Street were pouring $7 pints when we last checked, in February: The Court Hotel on Beaufort Street, The Moon Cafe and Bar (open since 1991), Joe's Juice Joint, and The Bird. The Bird is the one to plan around — its window runs Wednesday to Sunday, not daily like the others.",
          "Northbridge averages $8.95 across 80 tracked pubs, the densest sample in the database, and that density is what holds the floor down. The next rung up is Rosie O'Grady's at $7.50 for a Guinness, then a band of $8 rooms: The Rechabite, Alabama Song, Mechanics Institute. You can walk between the $7 options without a taxi, which is more than most cheap-pint hunts can say.",
          "The same suburb also runs a $16 pint at Bar 399. An $8.95 average is the middle of a wide spread, not a typical price — which is the argument for checking a specific pub rather than a suburb headline.",
        ],
      },
      {
        heading: 'Why the cheap ones stay cheap',
        body: [
          "Part of every pint price is fixed before the pub has any say in it. Draught beer is taxed at $43.39 per litre of alcohol — about $1.11 of federal excise on a standard 570ml pint at 4.5%, before a cent of rent, wages or margin goes on top. That figure normally climbs with inflation twice a year, though draught is frozen from August 2025 to August 2027. The freeze is a pause, not a cut, and the big brewers Lion and Asahi put their tap prices up anyway.",
          "So the cheap pubs aren't beating the tax — they're carrying less of everything stacked above it. The pattern is consistent: members' clubs like the Buffalo Club, suburban hotels with no strip rent to cover (The Deen in North Perth at $7, 7th Ave in Midland, the Stirling Arms in Guildford and the Bentley Hotel both at $7.50), and high-volume Northbridge rooms that make it back on turnover. Midland is the cheapest suburb average in the whole database at $7.",
        ],
      },
      {
        heading: "What the $7 doesn't tell you",
        body: [
          "Some of those $7s are happy-hour prices wearing an all-day face. 7th Ave in Midland is $7 only in a Monday-to-Friday, 5pm-to-6pm window; its all-day pour is $8 Swan Draught. Oceans 6019 in Scarborough is $7 on selected beers, 5pm to 6pm. Read the window, not just the number, or you'll arrive at seven to a different price.",
          "Freshness is the other variable. A price sitting two dollars under the city average is exactly the kind that moves, and most of this list was last confirmed in February. The live rows carry the current figure and the date it was checked; if one looks too good, the pub page will tell you how old it is.",
        ],
      },
      {
        heading: 'Where to start tonight',
        body: [
          "If you just want the best odds, go to Northbridge — eighty pubs, several at $7 to $8, most with a late-afternoon window. For a suburban floor, Midland, Bentley and Morley sit lowest. For the single cheapest pint in Perth, it's the Buffalo Club at $6, with the catch that it's a club with a public welcome rather than a pub you'll wander into.",
          "Before 6pm, the William Street windows are live; after, the standing $7 rooms keep going. And if you've paid less than what we have listed, the report button is how the next person finds it. Beer inflation does not send a courtesy email.",
        ],
      },
    ],
    relatedLinks: [
      { href: '/fremantle/fremantle-buffalo-club', label: "The $6 pint in Fremantle" },
      { href: '/northbridge', label: 'All Northbridge pint prices' },
      { href: '/discover', label: "Find tonight's cheapest pints" },
      { href: '/insights/pint-index', label: 'How the Pint Index works' },
    ],
  },
  {
    slug: 'perth-happy-hours-by-day',
    title: 'Perth happy hours by day of the week',
    deck: "Most Perth happy hours run the same late-afternoon window, capped there by licensing rather than generosity. Here's what the week actually looks like — and the three pubs in our database with a genuine price drop.",
    description: "A day-by-day read on Perth happy hours from checked pub data: the dominant 4-to-6pm window, the thin start of the week, and the three venues with a real discount off their standing price.",
    category: 'Happy hour',
    author: 'Perth Pint Prices',
    publishedAt: '2026-06-03T00:00:00.000+08:00',
    updatedAt: '2026-06-03T00:00:00.000+08:00',
    readingMinutes: 6,
    heroLabel: 'Happy hour',
    heroStat: '7 days',
    heroSubstat: 'Start with what is confirmed',
    image: '/og-image.png',
    imageAlt: 'Perth Pint Prices happy-hour board',
    liveModule: 'happyHoursByDay',
    sections: [
      {
        heading: 'How Perth happy hour actually works',
        body: [
          "Most Perth happy hours land in the same slot: late afternoon, roughly 4pm to 6pm, Monday to Friday. That isn't coincidence or generosity — it's the shape of the rules. Western Australia's responsible-promotion policy treats a happy hour that runs after 7pm, lasts longer than an hour at a stretch, or fires more than twice a day as unacceptable, and discounts past half-price get flagged too.",
          "So a Perth happy hour is a bounded, defined thing, not an open tap. Two formats cover most of it: the weekday office-end deal, gone by six, and the seven-day window you find at beach and destination pubs that trade on a steadier crowd.",
        ],
      },
      {
        heading: "Most 'happy hours' aren't a discount",
        body: [
          "Here's the part the boards don't advertise. Of every pub we track, only three have a separately confirmed happy-hour price — a number that actually drops from a higher standing rate. Everywhere else, the listed price is the price, and the window only tells you when the room fills up.",
          "The Court Hotel is the clean example: it runs a 4pm-to-6pm window and charges $7 a pint, but $7 is what it charges at noon too. The window is real; the discount is the price. That's why the planning board below is short — we don't invent a drop a pub doesn't claim.",
        ],
      },
      {
        heading: 'The three real drops',
        body: [
          "Ezra Pound on William Street in Northbridge is the genuine article: an $8 standing pint that falls to $5 in the window, which its pub page lists as daily, 5pm to 6pm. A three-dollar drop is about as good as the database holds.",
          "The Russell Inn in Morley does $5 against a $7.50 regular — but it's worth seeing how the honesty works here. Our own pages disagree on its days and times (Monday to Friday on one, Monday to Thursday and a half-hour window on another). When the data argues with itself, we'd rather show you that than pick one and pretend. Check the pub page, or ring, before you drive to Morley.",
          "And the lowest number on the board comes with the biggest asterisk: Pinchos in Leederville lists Estrella at $3.50, Tuesday to Friday. That's a pony — a small pour, not a 570ml pint — and we've never confirmed a full-pint price there. Smallest glass, lowest figure; the two go together.",
        ],
      },
      {
        heading: 'Monday and Tuesday: slim',
        body: [
          "The start of the week is the thinnest, and it's worth being plain about that. The Northbridge entertainment rooms that carry most of the inner-city happy-hour density — The Bird, The Rechabite, Alabama Song, Mechanics Institute — mostly don't switch on until Wednesday or Thursday. The Monday-to-Friday venues do include Monday, but there are simply fewer of them, and a Tuesday night leans on the standing-price pubs rather than any deal.",
        ],
      },
      {
        heading: 'Wednesday to Friday: the reliable stretch',
        body: [
          "By Wednesday the weekday deals are running and the Northbridge rooms are open, and Friday is the fullest the week gets. The CBD after-work options come good here: Print Hall, The Reveley and The Stables Bar all run Monday-to-Friday 4pm-to-6pm windows at $9 to $10, and The Emerson Bar holds $8 seven days, 5pm to 6pm.",
          "If you want the lowest number in this stretch, Rosie O'Grady's pours a $7.50 Guinness on a Monday-to-Friday, 4pm-to-6pm window — cheaper than most of the CBD and a short walk from the William Street cluster.",
        ],
      },
      {
        heading: 'Saturday and Sunday: follow the seven-day pubs',
        body: [
          "Saturday depends entirely on the suburb. The seven-day windows cluster where the crowd is steady — the Scarborough beachfront (the Indian Ocean Hotel, El Grotto, Oceans 6019) and Fremantle (the Norfolk, Clancy's, Mrs Browns) — while the inner suburbs thin out. The same seven-day rooms cover Sunday.",
          "The Sunday session, for what it's worth, isn't a marketing invention. Sunday trading was banned or boxed in across Perth until 1970, and from the 1920s only pubs more than twenty miles from the Perth Town Hall could legally pour on a Sunday — which is how fringe hotels out in the Perth Hills, like the Lion Mill, became a genuine Sunday-afternoon destination. The licence loosened; the name stuck.",
        ],
      },
      {
        heading: 'Check the delta, and check the date',
        body: [
          "The value of a happy hour is the gap, not the label. Bobeche in the CBD lists a Monday-to-Saturday, 5pm-to-6pm happy hour where the pint is $13 — exactly its standing price. A window with no drop in it is just a window.",
          "And every figure here has a use-by. Most were last checked in February, and a happy-hour board moves faster than anything else on a pub — they are, as the note at the top of this page puts it, among Perth's most optimistic works of fiction. The board below is a planning layer; the live happy-hour page is what's actually pouring tonight.",
        ],
      },
    ],
    relatedLinks: [
      { href: '/happy-hour', label: 'Happy hours running now' },
      { href: '/northbridge/ezra-pound', label: "Ezra Pound's $5 window" },
      { href: '/insights/tonights-best-bets', label: "Tonight's best bets" },
      { href: '/discover', label: 'Browse all pub prices' },
    ],
  },
  {
    slug: 'proper-pint-schooner-middy-perth',
    title: 'Pint, schooner, middy: what Perth venues actually pour',
    deck: "A pint is 570ml, a schooner 425ml, a middy 285ml. The gap between them is where a $9 beer quietly stops being a bargain — which is why we price every pint at 570ml.",
    description: "Pint (570ml), schooner (425ml) and middy (285ml) explained — what Perth pours, how the names flip across Australia, and why we benchmark every price at a 570ml pint so the numbers actually compare.",
    category: 'Perth drinking basics',
    author: 'Perth Pint Prices',
    publishedAt: '2026-06-03T00:00:00.000+08:00',
    updatedAt: '2026-06-03T00:00:00.000+08:00',
    readingMinutes: 5,
    heroLabel: 'Glass sizes',
    heroStat: '570ml',
    heroSubstat: 'The pint benchmark',
    image: '/og-image.png',
    imageAlt: 'Perth Pint Prices glass-size explainer',
    liveModule: 'glassSizes',
    sections: [
      {
        heading: "Why a $9 beer isn't always a $9 beer",
        body: [
          "Start with the arithmetic, because it's the whole point. A $9 schooner is 425ml of beer, which works out to about $2.12 per 100ml — the same rate as paying $12.07 for a pint. A $9 pint is $9. The three-dollar gap is invisible on the blackboard, because Perth menus rarely say which glass the price is for.",
          "That ambiguity is the reason this page exists. Every price on the site is tagged to a glass size, so a cheap number and a small glass can't quietly travel together.",
        ],
      },
      {
        heading: 'The three sizes Perth pours',
        body: [
          "A middy is 285ml — half a pint, and the small one. A schooner is 425ml, three-quarters of a pint, and the quiet default at a lot of suburban bars and hotel taps. A pint is 570ml, the full glass.",
          "The pint is more an Irish-pub and craft-room serve than a universal one, which matters: when a board just says beer and a price, it's more often a schooner than a pint. The difference is roughly a third of a glass.",
        ],
      },
      {
        heading: 'The same glass, six names',
        body: [
          "Australia went metric in 1970 but left the naming to the states, and the states went their own way. The 285ml glass is a middy in Perth, a pot in Melbourne and Brisbane, and a handle in Darwin — one glass, one country, several words.",
          "South Australia inverts the lot. Over there a schooner is 285ml and a pint is 425ml, so a South Australian who orders a pint in Perth gets 145ml more than the word buys at home — which is why SA needs a separate term, imperial pint, for the real 570ml. The smaller SA pours are usually traced back to the temperance movement. None of this matters until you order in the wrong state, and then it's the only thing that matters.",
        ],
      },
      {
        heading: 'Why we price everything as a pint',
        body: [
          "We benchmark on the 570ml pint because it's the largest common pour, and therefore the hardest to disguise behind a smaller glass. A $13 schooner and a $13 pint read identically on a board and are not the same drink; pricing both as a pint is what makes them comparable.",
          "When a venue will only confirm a schooner or middy price, we record that size and leave it there — we don't convert it up into a pint number it never quoted. A pub we can't confirm at all sits at TBC and stays out of the suburb averages. An honest gap is more useful than a tidy guess.",
        ],
      },
      {
        heading: 'What that looks like in Perth right now',
        body: [
          "Held to a single measure, the real spread is wide. The cheapest verified pint in Perth is $6, at the Fremantle Buffalo Club, checked in March; the dearest is $17, at BAHA in the CBD. Same city, same 570ml, eleven dollars apart.",
          "Fremantle alone runs from that $6 to a $14 pint at the Gage Roads brewery barely a kilometre away — which is exactly why a single suburb average ($9.11, here) tells you less than a price for the specific pub at a known glass. The number on its own isn't the answer; the number plus the size is.",
        ],
      },
      {
        heading: 'What makes a price worth reporting',
        body: [
          "All of which comes back to one ask. A price we can use names the glass, the beer, the price and the date — ideally with a photo of the menu. About ten bucks a pint from memory isn't usable, because the part that does the work, the glass size, is the part memory drops first.",
          "Report the glass size, beer, price and date. A photo of the menu helps. A memory from your mate's birthday in 2022 does not.",
        ],
      },
    ],
    relatedLinks: [
      { href: '/insights/pint-index', label: 'Why we price every pint at 570ml' },
      { href: '/fremantle', label: 'Fremantle pint prices, $6 to $14' },
      { href: '/?submit=1', label: 'Report a price' },
      { href: '/discover', label: 'See verified pint prices' },
    ],
  },
]

export function getArticle(slug: string): Article | null {
  return articles.find(article => article.slug === slug) ?? null
}

export function getArticlesByCategory(category: ArticleCategory): Article[] {
  return articles.filter(article => article.category === category)
}

export function articleUrl(slug: string): string {
  return `/articles/${slug}`
}

export function absoluteArticleUrl(slug: string): string {
  return `https://perthpintprices.com${articleUrl(slug)}`
}
