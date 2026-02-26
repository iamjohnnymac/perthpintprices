'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import SubPageNav from '@/components/SubPageNav'
import { Pub } from '@/types/pub'
import { Search, X, Plus, Minus, ChevronDown, ChevronUp, Copy, Check, ArrowRight, RotateCcw, Home } from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function sortByNearestNeighbor(pubs: Pub[]): Pub[] {
  if (pubs.length <= 1) return pubs
  const remaining = [...pubs]
  const sorted: Pub[] = [remaining.shift()!]
  while (remaining.length > 0) {
    const last = sorted[sorted.length - 1]
    let nearestIdx = 0
    let nearestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = getDistance(last.lat, last.lng, remaining[i].lat, remaining[i].lng)
      if (d < nearestDist) {
        nearestDist = d
        nearestIdx = i
      }
    }
    sorted.push(remaining.splice(nearestIdx, 1)[0])
  }
  return sorted
}

function getPar(price: number | null): number {
  if (price === null || price < 7) return 2
  if (price < 9) return 3
  if (price < 11) return 4
  return 5
}

function getScoreColor(sips: number, par: number): string {
  if (sips < par) return 'text-green-600'
  if (sips === par) return 'text-orange-600'
  return 'text-red-600'
}

function getScoreBg(sips: number, par: number): string {
  if (sips < par) return 'bg-green-50 border-green-200'
  if (sips === par) return 'bg-orange-50 border-orange-200'
  return 'bg-red-50 border-red-200'
}

function formatDiff(total: number, parTotal: number): string {
  const diff = total - parTotal
  if (diff === 0) return 'E'
  return diff > 0 ? `+${diff}` : `${diff}`
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GamePhase = 'setup' | 'playing' | 'results'
type CourseType = 'suburb' | 'lucky-dip' | 'custom'

interface CourseOption {
  type: CourseType
  label: string
  emoji: string
  suburb?: string
  pubCount?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PubGolfClient({ pubs }: { pubs: Pub[] }) {
  // Setup state
  const [phase, setPhase] = useState<GamePhase>('setup')
  const [players, setPlayers] = useState<string[]>([])
  const [playerInput, setPlayerInput] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(null)
  const [holeCount, setHoleCount] = useState(9)
  const [customPubs, setCustomPubs] = useState<Pub[]>([])
  const [customSearch, setCustomSearch] = useState('')

  // Playing state
  const [coursePubs, setCoursePubs] = useState<Pub[]>([])
  const [currentHole, setCurrentHole] = useState(0)
  const [scores, setScores] = useState<Record<string, number[]>>({})
  const [showScorecard, setShowScorecard] = useState(false)

  // Results state
  const [copied, setCopied] = useState(false)

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const suburbGroups = useMemo((): [string, Pub[]][] => {
    const groups: Record<string, Pub[]> = {}
    pubs.forEach((p: Pub) => {
      if (!p.suburb) return
      if (!groups[p.suburb]) groups[p.suburb] = []
      groups[p.suburb].push(p)
    })
    return Object.entries(groups)
      .filter(([, list]: [string, Pub[]]) => list.length >= 6)
      .sort((a: [string, Pub[]], b: [string, Pub[]]) => b[1].length - a[1].length)
  }, [pubs])

  const courseOptions = useMemo<CourseOption[]>(() => {
    const options: CourseOption[] = []
    suburbGroups.forEach(([suburb, list]: [string, Pub[]]) => {
      let label = `${suburb} Tour`
      let emoji = '🍻'
      if (suburb === 'Northbridge') { label = 'Northbridge Nine'; emoji = '🌃' }
      else if (suburb === 'Fremantle') { label = 'Freo Front Nine'; emoji = '⚓' }
      else if (suburb === 'Perth') { label = 'CBD Classic'; emoji = '🏙️' }
      options.push({ type: 'suburb', label, emoji, suburb, pubCount: list.length })
    })
    options.push({ type: 'lucky-dip', label: 'Lucky Dip', emoji: '🎲' })
    options.push({ type: 'custom', label: 'Custom Course', emoji: '🎯' })
    return options
  }, [suburbGroups])

  const customSearchResults = useMemo((): Pub[] => {
    if (!customSearch.trim()) return []
    const q = customSearch.toLowerCase()
    return pubs
      .filter((p: Pub) =>
        !customPubs.some((cp: Pub) => cp.id === p.id) &&
        (p.name.toLowerCase().includes(q) || p.suburb.toLowerCase().includes(q))
      )
      .slice(0, 20)
  }, [customSearch, pubs, customPubs])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const addPlayer = useCallback(() => {
    const name = playerInput.trim()
    if (!name || players.includes(name) || players.length >= 8) return
    setPlayers((prev: string[]) => [...prev, name])
    setPlayerInput('')
  }, [playerInput, players])

  const removePlayer = useCallback((name: string) => {
    setPlayers((prev: string[]) => prev.filter((p: string) => p !== name))
  }, [])

  const addCustomPub = useCallback((pub: Pub) => {
    if (customPubs.length >= holeCount) return
    setCustomPubs((prev: Pub[]) => [...prev, pub])
    setCustomSearch('')
  }, [customPubs.length, holeCount])

  const removeCustomPub = useCallback((id: number) => {
    setCustomPubs((prev: Pub[]) => prev.filter((p: Pub) => p.id !== id))
  }, [])

  const startGame = useCallback(() => {
    if (!selectedCourse || players.length === 0) return

    let selected: Pub[] = []

    if (selectedCourse.type === 'custom') {
      selected = [...customPubs]
    } else if (selectedCourse.type === 'lucky-dip') {
      selected = shuffleArray(pubs).slice(0, holeCount)
    } else if (selectedCourse.suburb) {
      const suburbPubs = pubs.filter((p: Pub) => p.suburb === selectedCourse.suburb)
      selected = shuffleArray(suburbPubs).slice(0, holeCount)
    }

    // Sort by nearest-neighbor for a walking route
    selected = sortByNearestNeighbor(selected)

    const initialScores: Record<string, number[]> = {}
    players.forEach((p: string) => { initialScores[p] = [] })

    setCoursePubs(selected)
    setScores(initialScores)
    setCurrentHole(0)
    setShowScorecard(false)
    setPhase('playing')
  }, [selectedCourse, players, customPubs, pubs, holeCount])

  const updateScore = useCallback((player: string, hole: number, value: number) => {
    setScores((prev: Record<string, number[]>) => {
      const arr = [...(prev[player] || [])]
      arr[hole] = Math.max(0, value)
      return { ...prev, [player]: arr }
    })
  }, [])

  const nextHole = useCallback(() => {
    // Ensure all players have a score for current hole
    const updated: Record<string, number[]> = { ...scores }
    players.forEach((p: string) => {
      const arr = [...(updated[p] || [])]
      if (arr[currentHole] === undefined) {
        arr[currentHole] = getPar(coursePubs[currentHole]?.price ?? null)
      }
      updated[p] = arr
    })
    setScores(updated)

    if (currentHole < coursePubs.length - 1) {
      setCurrentHole((prev: number) => prev + 1)
    } else {
      setPhase('results')
    }
  }, [scores, players, currentHole, coursePubs])

  const resetGame = useCallback(() => {
    setPhase('setup')
    setPlayers([])
    setPlayerInput('')
    setSelectedCourse(null)
    setCustomPubs([])
    setCustomSearch('')
    setCoursePubs([])
    setCurrentHole(0)
    setScores({})
    setShowScorecard(false)
    setCopied(false)
  }, [])

  // ---------------------------------------------------------------------------
  // Results helpers
  // ---------------------------------------------------------------------------

  const totalPar = coursePubs.reduce((sum: number, p: Pub) => sum + getPar(p.price), 0)

  const playerTotals = useMemo(() => {
    return players.map((p: string) => ({
      name: p,
      total: (scores[p] || []).reduce((s: number, v: number) => s + (v || 0), 0),
    }))
  }, [players, scores])

  const winner = useMemo(() => {
    if (playerTotals.length === 0) return null
    return playerTotals.reduce(
      (best: { name: string; total: number }, p: { name: string; total: number }) =>
        p.total < best.total ? p : best,
      playerTotals[0]
    )
  }, [playerTotals])

  const totalSpend = useMemo(() => {
    const priceSum = coursePubs.reduce((s: number, p: Pub) => s + (p.price || 0), 0)
    return priceSum * players.length
  }, [coursePubs, players.length])

  const uniqueSuburbs = useMemo(() => {
    return new Set(coursePubs.map((p: Pub) => p.suburb)).size
  }, [coursePubs])

  const courseName = selectedCourse
    ? selectedCourse.type === 'custom'
      ? 'Custom Course'
      : selectedCourse.type === 'lucky-dip'
        ? 'Lucky Dip'
        : selectedCourse.label
    : ''

  const shareText = useMemo(() => {
    if (!winner) return ''
    const lines = [
      `⛳ Arvo Pub Golf — ${courseName}`,
      '',
      `🏆 ${winner.name} wins!`,
      '',
      ...playerTotals.map((p: { name: string; total: number }) => `${p.name}: ${p.total} (${formatDiff(p.total, totalPar)} par)`),
      '',
      `💰 Round cost: $${totalSpend.toFixed(2)}`,
      `🍺 ${coursePubs.length} pubs across ${uniqueSuburbs} suburb${uniqueSuburbs !== 1 ? 's' : ''}`,
      '',
      'Play at arvo.pub/pub-golf',
    ]
    return lines.join('\n')
  }, [winner, courseName, playerTotals, totalPar, totalSpend, coursePubs.length, uniqueSuburbs])

  const copyResults = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = shareText
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareText])

  // Best / worst hole
  const bestHole = useMemo(() => {
    if (coursePubs.length === 0) return null
    let bestIdx = 0
    let bestDiff = Infinity
    coursePubs.forEach((pub: Pub, i: number) => {
      const par = getPar(pub.price)
      const avgSips = players.reduce((s: number, p: string) => s + ((scores[p] || [])[i] || par), 0) / Math.max(players.length, 1)
      const diff = avgSips - par
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i }
    })
    return { index: bestIdx, pub: coursePubs[bestIdx] }
  }, [coursePubs, players, scores])

  const worstHole = useMemo(() => {
    if (coursePubs.length === 0) return null
    let worstIdx = 0
    let worstDiff = -Infinity
    coursePubs.forEach((pub: Pub, i: number) => {
      const par = getPar(pub.price)
      const avgSips = players.reduce((s: number, p: string) => s + ((scores[p] || [])[i] || par), 0) / Math.max(players.length, 1)
      const diff = avgSips - par
      if (diff > worstDiff) { worstDiff = diff; worstIdx = i }
    })
    return { index: worstIdx, pub: coursePubs[worstIdx] }
  }, [coursePubs, players, scores])

  // ---------------------------------------------------------------------------
  // RENDER: Header (always shown)
  // ---------------------------------------------------------------------------

  const header = <SubPageNav title="Pub Golf" subtitle="Pick your course, tee off" />

  // ---------------------------------------------------------------------------
  // RENDER: SETUP SCREEN
  // ---------------------------------------------------------------------------

  if (phase === 'setup') {
    const canStart = players.length >= 1 && selectedCourse !== null &&
      (selectedCourse.type !== 'custom' || customPubs.length > 0)

    return (
      <div className="min-h-screen bg-cream">
        {header}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">

          {/* Players Section */}
          <section className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5">
            <h2 className="text-lg font-bold font-heading text-charcoal mb-3">👥 Players</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addPlayer() }}
                placeholder="Player name"
                maxLength={20}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all duration-200"
              />
              <button
                onClick={addPlayer}
                disabled={!playerInput.trim() || players.length >= 8}
                className="px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {players.length === 0 ? (
              <p className="text-xs text-stone-400">Add at least 1 player to start</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {players.map((name: string) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-800 border border-orange-200 rounded-full text-sm font-medium"
                  >
                    {name}
                    <button onClick={() => removePlayer(name)} className="text-orange-400 hover:text-orange-700 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-stone-400 mt-2">{players.length}/8 players</p>
          </section>

          {/* Hole Count */}
          <section className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5">
            <h2 className="text-lg font-bold font-heading text-charcoal mb-3">🕳️ Number of Holes</h2>
            <div className="flex gap-2">
              {[5, 9, 18].map((n: number) => (
                <button
                  key={n}
                  onClick={() => {
                    setHoleCount(n)
                    // Trim custom pubs if needed
                    if (customPubs.length > n) setCustomPubs((prev: Pub[]) => prev.slice(0, n))
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border ${
                    holeCount === n
                      ? 'bg-charcoal text-white border-charcoal shadow-md'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {n} Holes
                </button>
              ))}
            </div>
          </section>

          {/* Course Selection */}
          <section className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5">
            <h2 className="text-lg font-bold font-heading text-charcoal mb-3">📍 Choose Your Course</h2>
            <div className="space-y-2">
              {courseOptions.map((option: CourseOption) => {
                const isSelected = selectedCourse?.label === option.label && selectedCourse?.type === option.type
                return (
                  <button
                    key={option.label}
                    onClick={() => {
                      setSelectedCourse(option)
                      if (option.type !== 'custom') setCustomPubs([])
                    }}
                    className={`w-full text-left p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-400/30'
                        : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg flex-shrink-0">{option.emoji}</span>
                        <span className="font-semibold text-charcoal text-sm truncate">{option.label}</span>
                      </div>
                      {option.pubCount && (
                        <span className="text-xs text-stone-400 flex-shrink-0 ml-2">{option.pubCount} pubs</span>
                      )}
                    </div>
                    {option.type === 'lucky-dip' && (
                      <p className="text-xs text-stone-500 mt-1 ml-7">Random {holeCount} pubs from all of Perth</p>
                    )}
                    {option.type === 'custom' && (
                      <p className="text-xs text-stone-500 mt-1 ml-7">Pick your own pubs from the full list</p>
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Custom Course Picker */}
          {selectedCourse?.type === 'custom' && (
            <section className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5">
              <h2 className="text-lg font-bold font-heading text-charcoal mb-3">
                🎯 Pick Your Pubs ({customPubs.length}/{holeCount})
              </h2>

              {/* Selected pubs */}
              {customPubs.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {customPubs.map((pub: Pub, idx: number) => (
                    <div
                      key={pub.id}
                      className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-sm"
                    >
                      <span className="font-bold text-orange-700 w-5 text-center flex-shrink-0">{idx + 1}</span>
                      <span className="truncate flex-1 text-charcoal font-medium">{pub.name}</span>
                      <span className="text-xs text-stone-400 flex-shrink-0">{pub.suburb}</span>
                      <button
                        onClick={() => removeCustomPub(pub.id)}
                        className="text-orange-400 hover:text-red-500 flex-shrink-0 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search */}
              {customPubs.length < holeCount && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={customSearch}
                    onChange={(e) => setCustomSearch(e.target.value)}
                    placeholder="Search pubs..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all duration-200"
                  />
                </div>
              )}

              {/* Search results */}
              {customSearchResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
                  {customSearchResults.map((pub: Pub) => (
                    <button
                      key={pub.id}
                      onClick={() => addCustomPub(pub)}
                      className="w-full text-left px-3 py-2.5 hover:bg-orange-50 transition-colors text-sm flex items-center justify-between gap-2"
                    >
                      <span className="truncate font-medium text-charcoal">{pub.name}</span>
                      <span className="text-xs text-stone-400 flex-shrink-0">
                        {pub.suburb} {pub.price ? `· $${pub.price.toFixed(2)}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Tee Off Button */}
          <button
            onClick={startGame}
            disabled={!canStart}
            className="w-full py-4 bg-charcoal text-white text-lg font-bold font-heading rounded-2xl hover:bg-charcoal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
          >
            🏌️ Tee Off!
          </button>
        </main>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // RENDER: PLAYING SCREEN
  // ---------------------------------------------------------------------------

  if (phase === 'playing') {
    const pub = coursePubs[currentHole]
    if (!pub) return null
    const par = getPar(pub.price)
    const isLastHole = currentHole === coursePubs.length - 1
    const progress = ((currentHole + 1) / coursePubs.length) * 100

    return (
      <div className="min-h-screen bg-cream">
        {header}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">

          {/* Progress bar */}
          <div className="bg-white rounded-2xl border border-stone-200/60 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">HOLE {currentHole + 1} OF {coursePubs.length}</span>
              <span className="text-xs text-stone-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Pub Card */}
          <div className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-3xl sm:text-4xl font-black font-heading text-charcoal leading-none">HOLE {currentHole + 1}</p>
                <Link
                  href={`/pub/${pub.slug}`}
                  className="text-lg font-bold text-charcoal hover:text-orange-600 transition-colors mt-1 block truncate"
                >
                  {pub.name}
                </Link>
                <p className="text-xs text-stone-500 truncate">{pub.suburb} · {pub.address}</p>
              </div>
              <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-800 text-xs font-bold rounded-full border border-orange-200">
                PAR {par}
              </span>
            </div>

            <div className="flex items-end justify-between border-t border-stone-100 pt-3">
              <div>
                {pub.price ? (
                  <p className="text-3xl font-black text-orange-600 font-heading">${pub.price.toFixed(2)}</p>
                ) : (
                  <p className="text-lg font-semibold text-stone-400">Price TBC</p>
                )}
                <p className="text-xs text-stone-400">{pub.beerType || 'Pint'}</p>
              </div>
              <p className="text-xs text-stone-500 italic text-right">
                Finish your pint in {par} sips or less!
              </p>
            </div>
          </div>

          {/* Score Entry */}
          <div className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5">
            <h3 className="text-sm font-bold text-charcoal mb-3 font-heading">SCORES</h3>
            <div className="space-y-3">
              {players.map((player: string) => {
                const sips = scores[player]?.[currentHole] ?? par
                return (
                  <div key={player} className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 ${getScoreBg(sips, par)}`}>
                    <span className="font-semibold text-sm text-charcoal truncate min-w-0">{player}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateScore(player, currentHole, sips - 1)}
                        className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-all duration-200"
                      >
                        <Minus className="w-4 h-4 text-stone-600" />
                      </button>
                      <span className={`text-xl font-black w-8 text-center tabular-nums ${getScoreColor(sips, par)}`}>
                        {sips}
                      </span>
                      <button
                        onClick={() => updateScore(player, currentHole, sips + 1)}
                        className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-all duration-200"
                      >
                        <Plus className="w-4 h-4 text-stone-600" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Next Hole / Finish */}
          <button
            onClick={nextHole}
            className="w-full py-4 bg-charcoal text-white text-lg font-bold font-heading rounded-2xl hover:bg-charcoal/90 transition-all duration-200 shadow-md flex items-center justify-center gap-2"
          >
            {isLastHole ? '🏁 Finish Round' : (
              <>Next Hole <ArrowRight className="w-5 h-5" /></>
            )}
          </button>

          {/* Collapsible Running Scorecard */}
          <div className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden">
            <button
              onClick={() => setShowScorecard((prev: boolean) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
            >
              <span className="text-sm font-bold text-charcoal font-heading">📋 Running Scorecard</span>
              {showScorecard ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>
            {showScorecard && (
              <div className="px-4 pb-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-2 pr-2 text-stone-500 font-medium">Hole</th>
                      <th className="text-left py-2 pr-2 text-stone-500 font-medium">Pub</th>
                      <th className="text-center py-2 pr-2 text-stone-500 font-medium">Par</th>
                      {players.map((p: string) => (
                        <th key={p} className="text-center py-2 text-stone-500 font-medium truncate max-w-[60px]">{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coursePubs.slice(0, currentHole + 1).map((cp: Pub, i: number) => {
                      const holePar = getPar(cp.price)
                      return (
                        <tr key={i} className="border-b border-stone-100">
                          <td className="py-1.5 pr-2 font-bold text-charcoal">{i + 1}</td>
                          <td className="py-1.5 pr-2 truncate max-w-[100px] text-stone-600">{cp.name}</td>
                          <td className="py-1.5 pr-2 text-center text-orange-600 font-bold">{holePar}</td>
                          {players.map((p: string) => {
                            const s = scores[p]?.[i]
                            const display = s !== undefined ? s : '-'
                            return (
                              <td key={p} className={`py-1.5 text-center font-bold ${s !== undefined ? getScoreColor(s, holePar) : 'text-stone-300'}`}>
                                {display}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                    {/* Running totals */}
                    <tr className="border-t-2 border-stone-300">
                      <td className="py-2 pr-2 font-black text-charcoal" colSpan={2}>TOTAL</td>
                      <td className="py-2 pr-2 text-center font-black text-orange-600">
                        {coursePubs.slice(0, currentHole + 1).reduce((s: number, cp: Pub) => s + getPar(cp.price), 0)}
                      </td>
                      {players.map((p: string) => {
                        const t = (scores[p] || []).slice(0, currentHole + 1).reduce((s: number, v: number) => s + (v || 0), 0)
                        return (
                          <td key={p} className="py-2 text-center font-black text-charcoal">{t}</td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // RENDER: RESULTS SCREEN
  // ---------------------------------------------------------------------------

  if (phase === 'results') {
    const avgVsPar = playerTotals.length > 0
      ? (playerTotals.reduce((s: number, p: { name: string; total: number }) => s + p.total, 0) / playerTotals.length) - totalPar
      : 0

    return (
      <div className="min-h-screen bg-cream">
        {header}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">

          {/* Winner Announcement */}
          <section className="bg-white rounded-2xl border border-stone-200/60 p-5 sm:p-6 text-center">
            <p className="text-4xl mb-2">🏆</p>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-charcoal mb-1">Round Complete!</h2>
            {winner && players.length > 1 && (
              <p className="text-lg font-bold text-orange-600">
                🎉 {winner.name} wins with {winner.total}! ({formatDiff(winner.total, totalPar)} par)
              </p>
            )}
            {players.length === 1 && winner && (
              <p className="text-lg font-bold text-orange-600">
                🎉 {winner.name} finished with {winner.total}! ({formatDiff(winner.total, totalPar)} par)
              </p>
            )}
          </section>

          {/* Full Scorecard */}
          <section className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5 overflow-x-auto">
            <h3 className="text-sm font-bold text-charcoal mb-3 font-heading">📋 FULL SCORECARD</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2 pr-2 text-stone-500 font-medium">Hole</th>
                  <th className="text-left py-2 pr-2 text-stone-500 font-medium">Pub</th>
                  <th className="text-center py-2 pr-2 text-stone-500 font-medium">Par</th>
                  {players.map((p: string) => (
                    <th key={p} className="text-center py-2 text-stone-500 font-medium truncate max-w-[60px]">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coursePubs.map((pub: Pub, i: number) => {
                  const holePar = getPar(pub.price)
                  return (
                    <tr key={i} className="border-b border-stone-100">
                      <td className="py-1.5 pr-2 font-bold text-charcoal">{i + 1}</td>
                      <td className="py-1.5 pr-2 truncate max-w-[100px]">
                        <Link href={`/pub/${pub.slug}`} className="text-stone-600 hover:text-orange-600 transition-colors">
                          {pub.name}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-2 text-center text-orange-600 font-bold">{holePar}</td>
                      {players.map((p: string) => {
                        const s = scores[p]?.[i] ?? holePar
                        const diff = s - holePar
                        return (
                          <td key={p} className={`py-1.5 text-center font-bold ${getScoreColor(s, holePar)}`}>
                            {s}
                            <span className="text-[10px] ml-0.5 opacity-60">
                              {diff === 0 ? '' : diff > 0 ? `+${diff}` : diff}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {/* Total row */}
                <tr className="border-t-2 border-stone-300">
                  <td className="py-2 pr-2 font-black text-charcoal" colSpan={2}>TOTAL</td>
                  <td className="py-2 pr-2 text-center font-black text-orange-600">{totalPar}</td>
                  {playerTotals.map((pt: { name: string; total: number }) => (
                    <td key={pt.name} className={`py-2 text-center font-black ${
                      pt.total < totalPar ? 'text-green-600' : pt.total === totalPar ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {pt.total}
                      <span className="text-[10px] ml-0.5 opacity-60">({formatDiff(pt.total, totalPar)})</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>

          {/* Stats */}
          <section className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5">
            <h3 className="text-sm font-bold text-charcoal mb-3 font-heading">📊 ROUND STATS</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-orange-600 font-heading">${totalSpend.toFixed(0)}</p>
                <p className="text-xs text-stone-500 mt-0.5">Total Spend</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-3 text-center">
                <p className={`text-2xl font-black font-heading ${avgVsPar < 0 ? 'text-green-600' : avgVsPar === 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {avgVsPar > 0 ? '+' : ''}{avgVsPar.toFixed(1)}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">Avg vs Par</p>
              </div>
              {bestHole && (
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-green-700 truncate">{bestHole.pub.name}</p>
                  <p className="text-xs text-green-600 mt-0.5">Best Hole (#{bestHole.index + 1})</p>
                </div>
              )}
              {worstHole && (
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-red-700 truncate">{worstHole.pub.name}</p>
                  <p className="text-xs text-red-600 mt-0.5">Worst Hole (#{worstHole.index + 1})</p>
                </div>
              )}
            </div>
          </section>

          {/* Share Results */}
          <button
            onClick={copyResults}
            className="w-full py-4 bg-orange-500 text-white text-lg font-bold font-heading rounded-2xl hover:bg-orange-600 transition-all duration-200 shadow-md flex items-center justify-center gap-2"
          >
            {copied ? (
              <><Check className="w-5 h-5" /> Copied!</>
            ) : (
              <><Copy className="w-5 h-5" /> 📸 Share Results</>
            )}
          </button>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={resetGame}
              className="flex-1 py-3 bg-charcoal text-white font-bold font-heading rounded-2xl hover:bg-charcoal/90 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
            <Link
              href="/"
              className="flex-1 py-3 bg-white text-charcoal font-bold font-heading rounded-2xl border border-stone-200 hover:bg-stone-50 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <Home className="w-4 h-4" /> Back to Arvo
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return null
}
