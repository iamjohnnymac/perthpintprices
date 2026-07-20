import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import PintOfTheDay from '@/components/PintOfTheDay'
import { selectPintOfTheDay, type PintOfTheDayPub } from './pintOfTheDay'

const pubs: PintOfTheDayPub[] = [
  {
    id: 1,
    name: 'Alpha Hotel',
    slug: 'alpha-hotel',
    suburb: 'Northbridge',
    address: '1 James Street',
    price: 7,
    beer_type: 'Lager',
    happy_hour: 'Daily specials',
    happy_hour_price: 6,
    happy_hour_days: 'daily',
    happy_hour_start: '16:00:00',
    happy_hour_end: '18:00:00',
    image_url: null,
  },
  {
    id: 2,
    name: 'Bravo Hotel',
    slug: 'bravo-hotel',
    suburb: 'Fremantle',
    address: '2 High Street',
    price: 8,
    beer_type: null,
    happy_hour: null,
    happy_hour_price: null,
    happy_hour_days: null,
    happy_hour_start: null,
    happy_hour_end: null,
    image_url: null,
  },
]

describe('Pint of the Day selection contract', () => {
  it('is deterministic for a Perth date and supplies the runner-up', () => {
    const now = new Date('2026-07-21T09:00:00.000Z')
    const first = selectPintOfTheDay(pubs, now)
    const second = selectPintOfTheDay([...pubs], now)

    assert.deepEqual(first, second)
    assert.equal(first?.date, '2026-07-21')
    assert.ok(first?.runnerUp)
  })

  it('rolls the decision date at Perth midnight, not UTC midnight', () => {
    const beforeMidnight = selectPintOfTheDay(pubs, new Date('2026-07-21T15:59:00.000Z'))
    const afterMidnight = selectPintOfTheDay(pubs, new Date('2026-07-21T16:00:00.000Z'))

    assert.equal(beforeMidnight?.date, '2026-07-21')
    assert.equal(afterMidnight?.date, '2026-07-22')
  })

  it('uses the same serializable decision for server initial HTML', () => {
    const decision = selectPintOfTheDay(pubs, new Date('2026-07-21T09:00:00.000Z'))
    assert.ok(decision)

    const html = renderToStaticMarkup(createElement(PintOfTheDay, { initialData: decision }))
    assert.match(html, new RegExp(decision.pub.name))
    assert.match(html, new RegExp(`/${decision.pub.suburb.toLowerCase()}/${decision.pub.slug}`))
    assert.match(html, new RegExp(`\\$${decision.pub.effectivePrice.toFixed(2)}`))
    assert.ok(html.includes(decision.reason.replace("'", '&#x27;')))
    assert.match(html, /Tuesday 21 July/)
    assert.match(html, /Runner up/)
  })

  it('server-renders useful unavailable guidance without a loading spinner', () => {
    const html = renderToStaticMarkup(createElement(PintOfTheDay, { initialData: null }))
    assert.match(html, /Today&#x27;s Pint of the Day is unavailable/)
    assert.doesNotMatch(html, /loading/i)
  })
})
