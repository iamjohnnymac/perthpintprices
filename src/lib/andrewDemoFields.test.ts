import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  parseAndrewDemoBeer,
  parseAndrewDemoConfidence,
  parseAndrewDemoHappyHour,
  parseAndrewDemoPrice,
  parseAndrewDemoUnit,
} from './andrewDemoFields'

describe('Andrew demo structured fields', () => {
  it('accepts only numeric in-range prices and known serving units', () => {
    assert.equal(parseAndrewDemoPrice({ value: '$9 dollars' }, { value: 'pint' }), 9)
    assert.equal(parseAndrewDemoPrice(7.5, 'schooner'), 10.06)
    assert.equal(parseAndrewDemoUnit(null), 'pint')
    assert.equal(parseAndrewDemoPrice('9 call Jane Person', 'pint'), null)
    assert.equal(parseAndrewDemoPrice(9, 'pint zero four one two'), null)
    assert.equal(parseAndrewDemoPrice(21, 'pint'), null)
  })

  it('returns only exact known beer names and confidence tokens', () => {
    assert.equal(parseAndrewDemoBeer({ value: 'swan draught' }), 'Swan Draught')
    assert.equal(parseAndrewDemoBeer('XXXX Gold'), 'XXXX Gold')
    assert.equal(parseAndrewDemoBeer("Swan Draught; hi, I'm Jane Person"), null)
    assert.equal(parseAndrewDemoBeer('44 King Street'), null)
    assert.equal(parseAndrewDemoConfidence('high'), 'high')
    assert.equal(parseAndrewDemoConfidence('high call me Jane Person'), null)
  })

  it('reconstructs happy hours only from a strict weekday and time grammar', () => {
    assert.equal(parseAndrewDemoHappyHour('Mon-Fri 4-6pm'), 'Mon–Fri · 4–6pm')
    assert.equal(parseAndrewDemoHappyHour('daily 5:30 to 7 pm'), 'Daily · 5:30–7pm')
    assert.equal(parseAndrewDemoHappyHour('Saturday 4pm-6pm'), 'Sat · 4pm–6pm')
    assert.equal(parseAndrewDemoHappyHour('Mon-Fri 4-6pm at 44 King Street'), null)
    assert.equal(parseAndrewDemoHappyHour('Mon-Fri 4-6pm call me Jane Person'), null)
    assert.equal(parseAndrewDemoHappyHour('Mon-Fri four to six zero four one two'), null)
  })
})
