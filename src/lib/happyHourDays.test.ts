import assert from 'node:assert/strict'
import test from 'node:test'
import { parseHappyHourDayIndexes, pubHasHappyHourOnDay } from './happyHourDays'

test('parseHappyHourDayIndexes expands weekday ranges', () => {
  assert.deepEqual(parseHappyHourDayIndexes('Mon-Fri'), [1, 2, 3, 4, 5])
  assert.equal(pubHasHappyHourOnDay('Mon-Fri', 3), true)
  assert.equal(pubHasHappyHourOnDay('Mon-Fri', 6), false)
})

test('parseHappyHourDayIndexes expands wrapped ranges', () => {
  assert.deepEqual(parseHappyHourDayIndexes('Wed-Sun'), [3, 4, 5, 6, 0])
  assert.equal(pubHasHappyHourOnDay('Wed-Sun', 0), true)
  assert.equal(pubHasHappyHourOnDay('Wed-Sun', 2), false)
})

test('parseHappyHourDayIndexes handles publisher dash variants', () => {
  assert.deepEqual(parseHappyHourDayIndexes('Mon–Fri'), [1, 2, 3, 4, 5])
})

test('parseHappyHourDayIndexes handles daily and postgres array formats', () => {
  assert.deepEqual(parseHappyHourDayIndexes('daily'), [0, 1, 2, 3, 4, 5, 6])
  assert.deepEqual(parseHappyHourDayIndexes('{Mon,Tue,Wed,Thu,Fri}'), [1, 2, 3, 4, 5])
})

test('parseHappyHourDayIndexes handles weekday and weekend labels', () => {
  assert.deepEqual(parseHappyHourDayIndexes('Weekdays'), [1, 2, 3, 4, 5])
  assert.deepEqual(parseHappyHourDayIndexes('Weekends'), [0, 6])
})
