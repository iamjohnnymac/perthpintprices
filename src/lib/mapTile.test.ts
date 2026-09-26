import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getCartoTileTemplate, getMapTileUrl } from './mapTile'

describe('CARTO basemap URLs', () => {
  it('adds the API key to interactive tile templates', () => {
    assert.equal(
      getCartoTileTemplate('light_all', 'test key'),
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=test%20key'
    )
  })

  it('adds the API key to static map tiles', () => {
    assert.match(
      getMapTileUrl(-31.95, 115.86, 15, 'test key'),
      /\?key=test%20key$/
    )
  })
})
