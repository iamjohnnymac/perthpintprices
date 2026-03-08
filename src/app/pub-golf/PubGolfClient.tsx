'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import SubPageNav from '@/components/SubPageNav'
import { Pub } from '@/types/pub'
import { Search, X, Plus, Minus, ChevronDown, ChevronUp, Copy, Check, ArrowRight, RotateCcw, Home, Target, Flag, Trophy, BarChart3, Users, MapPin, HelpCircle } from 'lucide-react'
import LucideIcon from '@/components/LucideIcon'
import Footer from '@/components/Footer'

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
  if (price === null || price <= 10) return 3
  if (price <= 13) return 4
  return 5
}

function getScoreColor(sips: number, par: number): string {
  if (sips < par) return 'text-ink'
  if (sips === par) return 'text-amber'
  return 'text-red-600'
}

function getScoreBg(sips: number, par: number): string {
  if (sips < par) return 'bg-amber-pale border-amber-light'
  if (sips === par) return 'bg-amber-pale border-amber-light'
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
      let emoji = 'beer'
      if (suburb === 'Northbridge') { label = 'Northbridge Nine'; emoji = 'building-2' }
      else if (suburb === 'Fremantle') { label = 'Freo Front Nine'; emoji = 'anchor' }
      else if (suburb === 'Perth') { label = 'CBD Classic'; emoji = 'landmark' }
      options.push({ type: 'suburb', label, emoji, suburb, pubCount: list.length })
    })
    options.push({ type: 'lucky-dip', label: 'Lucky Dip', emoji: 'dices' })
    options.push({ type: 'custom', label: 'Custom Course', emoji: 'target' })
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
    // Emoji row: winner's per-hole results
    const emojiRow = coursePubs.map((pub: Pub, i: number) => {
      const holePar = getPar(pub.price)
      const sips = scores[winner.name]?.[i] ?? holePar
      if (sips < holePar) return '⛳'
      if (sips === holePar) return '🍺'
      return '💀'
    }).join('')

    const playerLines = playerTotals.map((p: { name: string; total: number }) => {
      const prefix = players.length > 1 && p.name === winner.name ? '🏆' : '🍺'
      return `${prefix} ${p.name}: ${p.total} (${formatDiff(p.total, totalPar)} par)`
    })

    const lines = [
      `🏌️ ARVO PUB GOLF 🍺`,
      courseName,
      '',
      emojiRow,
      '',
      ...playerLines,
      '',
      `💰 $${totalSpend.toFixed(0)} · ${coursePubs.length} holes · ${uniqueSuburbs} suburb${uniqueSuburbs !== 1 ? 's' : ''}`,
      'Play free → arvo.pub/pub-golf',
    ]
    return lines.join('\n')
  }, [winner, courseName, playerTotals, players, totalPar, totalSpend, coursePubs, scores, uniqueSuburbs])

  const shareResults = useCallback(async () => {
    // Try native share (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
        return
      } catch { /* user cancelled, fall through to copy */ }
    }
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
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

    const [showHowTo, setShowHowTo] = useState(false)

    const header = (
    <>
      <SubPageNav title="Pub Golf" subtitle="Pick your course, tee off" />
      <div className="max-w-container mx-auto px-6 pt-8 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-mono font-extrabold text-[clamp(1.8rem,5vw,2.4rem)] tracking-[-0.03em] text-ink leading-[1.1]">
              Pub Golf
            </h1>
            <p className="text-gray-mid text-[0.85rem] mt-1">Pick your course, tee off</p>
          </div>
          <button
            onClick={() => setShowHowTo(!showHowTo)}
            className={`flex items-center gap-1.5 px-3 py-1.5 mt-1 font-mono text-[0.65rem] font-bold uppercase tracking-[0.05em] border-3 border-ink rounded-card shadow-hard-sm transition-all ${
              showHowTo ? 'bg-amber text-white' : 'bg-white text-gray-mid hover:text-ink hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-hard-hover'
            }`}
          >
            <HelpCircle size={12} />
            How to Play
          </button>
        </div>
        {showHowTo && (
          <div className="mt-4 bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 bg-amber text-white font-mono text-[0.7rem] font-bold rounded-full flex items-center justify-center border-2 border-ink">1</span>
                <div>
                  <p className="font-mono text-[0.75rem] font-bold text-ink">Pick a course</p>
                  <p className="font-mono text-[0.65rem] text-gray-mid mt-0.5">Choose a preset suburb crawl, go lucky dip, or build your own</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 bg-amber text-white font-mono text-[0.7rem] font-bold rounded-full flex items-center justify-center border-2 border-ink">2</span>
                <div>
                  <p className="font-mono text-[0.75rem] font-bold text-ink">Drink at each pub</p>
                  <p className="font-mono text-[0.65rem] text-gray-mid mt-0.5">Each hole is a pub. Finish your pint in the par number of sips or fewer</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 bg-amber text-white font-mono text-[0.7rem] font-bold rounded-full flex items-center justify-center border-2 border-ink">3</span>
                <div>
                  <p className="font-mono text-[0.75rem] font-bold text-ink">Lowest score wins</p>
                  <p className="font-mono text-[0.65rem] text-gray-mid mt-0.5">⛳ Under par · 🍺 Par · 💀 Over par — fewest sips takes the trophy</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )

  // ---------------------------------------------------------------------------
  // RENDER: SETUP SCREEN
  // ---------------------------------------------------------------------------

  if (phase === 'setup') {
    const canStart = players.length >= 1 && selectedCourse !== null &&
      (selectedCourse.type !== 'custom' || customPubs.length > 0)

    return (
      <div className="min-h-screen bg-[#FDF8F0]">
        {header}
        <main className="max-w-container mx-auto px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">

          {/* Players Section */}
          <section className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
            <h2 className="text-lg font-bold font-mono text-ink mb-3"><Users className="w-4 h-4 inline" /> Players</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addPlayer() }}
                placeholder="Player name"
                maxLength={20}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-gray-light bg-off-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all duration-200"
              />
              <button
                onClick={addPlayer}
                disabled={!playerInput.trim() || players.length >= 8}
                className="px-4 py-2.5 bg-amber text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {players.length === 0 ? (
              <p className="text-xs text-gray-mid">Add at least 1 player to start</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {players.map((name: string) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-pale text-orange-800 border border-amber-light rounded-pill text-sm font-medium"
                  >
                    {name}
                    <button onClick={() => removePlayer(name)} className="text-orange-400 hover:text-orange-700 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-mid mt-2">{players.length}/8 players</p>
          </section>

          {/* Hole Count */}
          <section className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
            <h2 className="text-lg font-bold font-mono text-ink mb-3"><Target className="w-5 h-5 inline mr-1" />Number of Holes</h2>
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
                      ? 'bg-ink text-white border-charcoal shadow-md'
                      : 'bg-off-white text-gray-mid border-gray-light hover:border-gray'
                  }`}
                >
                  {n} Holes
                </button>
              ))}
            </div>
          </section>

          {/* Course Selection */}
          <section className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
            <h2 className="text-lg font-bold font-mono text-ink mb-3"><MapPin className="w-4 h-4 inline" /> Choose Your Course</h2>
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
                        ? 'border-orange-400 bg-amber-pale ring-2 ring-orange-400/30'
                        : 'border-gray-light bg-off-white hover:border-gray'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex-shrink-0"><LucideIcon name={option.emoji} className="w-5 h-5" /></span>
                        <span className="font-semibold text-ink text-sm truncate">{option.label}</span>
                      </div>
                      {option.pubCount && (
                        <span className="text-xs text-gray-mid flex-shrink-0 ml-2">{option.pubCount} pubs</span>
                      )}
                    </div>
                    {option.type === 'lucky-dip' && (
                      <p className="text-xs text-gray-mid mt-1 ml-7">Random {holeCount} pubs from all of Perth</p>
                    )}
                    {option.type === 'custom' && (
                      <p className="text-xs text-gray-mid mt-1 ml-7">Pick your own pubs from the full list</p>
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Custom Course Picker */}
          {selectedCourse?.type === 'custom' && (
            <section className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
              <h2 className="text-lg font-bold font-mono text-ink mb-3">
                <Target className="w-4 h-4 inline" /> Pick Your Pubs ({customPubs.length}/{holeCount})
              </h2>

              {/* Selected pubs */}
              {customPubs.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {customPubs.map((pub: Pub, idx: number) => (
                    <div
                      key={pub.id}
                      className="flex items-center gap-2 px-3 py-2 bg-amber-pale border border-amber-light rounded-xl text-sm"
                    >
                      <span className="font-bold text-orange-700 w-5 text-center flex-shrink-0">{idx + 1}</span>
                      <span className="truncate flex-1 text-ink font-medium">{pub.name}</span>
                      <span className="text-xs text-gray-mid flex-shrink-0">{pub.suburb}</span>
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-mid" />
                  <input
                    type="text"
                    value={customSearch}
                    onChange={(e) => setCustomSearch(e.target.value)}
                    placeholder="Search pubs..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-light bg-off-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all duration-200"
                  />
                </div>
              )}

              {/* Search results */}
              {customSearchResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-light bg-white divide-y divide-stone-100">
                  {customSearchResults.map((pub: Pub) => (
                    <button
                      key={pub.id}
                      onClick={() => addCustomPub(pub)}
                      className="w-full text-left px-3 py-2.5 hover:bg-amber-pale transition-colors text-sm flex items-center justify-between gap-2"
                    >
                      <span className="truncate font-medium text-ink">{pub.name}</span>
                      <span className="text-xs text-gray-mid flex-shrink-0">
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
            className="w-full py-4 bg-ink text-white text-lg font-bold font-mono rounded-2xl hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
          >
            <Flag className="w-4 h-4 inline" /> Tee Off!
          </button>
        </main>
        <Footer />
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
      <div className="min-h-screen bg-[#FDF8F0]">
        {header}
        <main className="max-w-container mx-auto px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">

          {/* Progress bar */}
          <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-mid">HOLE {currentHole + 1} OF {coursePubs.length}</span>
              <span className="text-xs text-gray-mid">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-off-white rounded-pill overflow-hidden">
              <div
                className="h-full bg-amber rounded-pill transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Pub Card */}
          <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-3xl sm:text-4xl font-black font-mono text-ink leading-none">HOLE {currentHole + 1}</p>
                <Link
                  href={`/pub/${pub.slug}`}
                  className="text-lg font-bold text-ink hover:text-amber transition-colors mt-1 block truncate"
                >
                  {pub.name}
                </Link>
                <p className="text-xs text-gray-mid truncate">{pub.suburb} · {pub.address}</p>
              </div>
              <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-800 text-xs font-bold rounded-pill border border-amber-light">
                PAR {par}
              </span>
            </div>

            <div className="flex items-end justify-between border-t border-gray-light pt-3">
              <div>
                {pub.price ? (
                  <p className="text-3xl font-black text-amber font-mono">${pub.price.toFixed(2)}</p>
                ) : (
                  <p className="text-lg font-semibold text-gray-mid">Price TBC</p>
                )}
                <p className="text-xs text-gray-mid">{pub.beerType || 'Pint'}</p>
              </div>
              <p className="text-xs text-gray-mid italic text-right">
                Finish your pint in {par} sips or less!
              </p>
            </div>
          </div>

          {/* Score Entry */}
          <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
            <h3 className="text-sm font-bold text-ink mb-3 font-mono">SCORES</h3>
            <div className="space-y-3">
              {players.map((player: string) => {
                const sips = scores[player]?.[currentHole] ?? par
                return (
                  <div key={player} className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 ${getScoreBg(sips, par)}`}>
                    <span className="font-semibold text-sm text-ink truncate min-w-0">{player}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateScore(player, currentHole, sips - 1)}
                        className="w-9 h-9 rounded-pill bg-white border border-gray-light flex items-center justify-center hover:bg-off-white active:scale-95 transition-all duration-200"
                      >
                        <Minus className="w-4 h-4 text-gray-mid" />
                      </button>
                      <span className={`text-xl font-black w-8 text-center tabular-nums ${getScoreColor(sips, par)}`}>
                        {sips}
                      </span>
                      <button
                        onClick={() => updateScore(player, currentHole, sips + 1)}
                        className="w-9 h-9 rounded-pill bg-white border border-gray-light flex items-center justify-center hover:bg-off-white active:scale-95 transition-all duration-200"
                      >
                        <Plus className="w-4 h-4 text-gray-mid" />
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
            className="w-full py-4 bg-ink text-white text-lg font-bold font-mono rounded-2xl hover:bg-ink/90 transition-all duration-200 shadow-md flex items-center justify-center gap-2"
          >
            {isLastHole ? <><Flag className="w-5 h-5 inline" /> Finish Round</> : (
              <>Next Hole <ArrowRight className="w-5 h-5" /></>
            )}
          </button>

          {/* Collapsible Running Scorecard */}
          <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm overflow-hidden">
            <button
              onClick={() => setShowScorecard((prev: boolean) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-off-white transition-colors"
            >
              <span className="text-sm font-bold text-ink font-mono"><Copy className="w-3.5 h-3.5 inline" /> Running Scorecard</span>
              {showScorecard ? <ChevronUp className="w-4 h-4 text-gray-mid" /> : <ChevronDown className="w-4 h-4 text-gray-mid" />}
            </button>
            {showScorecard && (
              <div className="px-4 pb-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-light">
                      <th className="text-left py-2 pr-2 text-gray-mid font-medium">Hole</th>
                      <th className="text-left py-2 pr-2 text-gray-mid font-medium">Pub</th>
                      <th className="text-center py-2 pr-2 text-gray-mid font-medium">Par</th>
                      {players.map((p: string) => (
                        <th key={p} className="text-center py-2 text-gray-mid font-medium truncate max-w-[60px]">{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coursePubs.slice(0, currentHole + 1).map((cp: Pub, i: number) => {
                      const holePar = getPar(cp.price)
                      return (
                        <tr key={i} className="border-b border-gray-light">
                          <td className="py-1.5 pr-2 font-bold text-ink">{i + 1}</td>
                          <td className="py-1.5 pr-2 truncate max-w-[100px] text-gray-mid">{cp.name}</td>
                          <td className="py-1.5 pr-2 text-center text-amber font-bold">{holePar}</td>
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
                    <tr className="border-t-2 border-gray">
                      <td className="py-2 pr-2 font-black text-ink" colSpan={2}>TOTAL</td>
                      <td className="py-2 pr-2 text-center font-black text-amber">
                        {coursePubs.slice(0, currentHole + 1).reduce((s: number, cp: Pub) => s + getPar(cp.price), 0)}
                      </td>
                      {players.map((p: string) => {
                        const t = (scores[p] || []).slice(0, currentHole + 1).reduce((s: number, v: number) => s + (v || 0), 0)
                        return (
                          <td key={p} className="py-2 text-center font-black text-ink">{t}</td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
        <Footer />
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
      <div className="min-h-screen bg-[#FDF8F0]">
        {header}
        <main className="max-w-container mx-auto px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">

          {/* Winner Announcement */}
          <section className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-5 sm:p-6 text-center">
            <Trophy className="w-10 h-10 text-amber mb-2" />
            <h2 className="text-2xl sm:text-3xl font-black font-mono text-ink mb-1">Round Complete!</h2>
            {winner && players.length > 1 && (
              <p className="text-lg font-bold text-amber">
                {winner.name} wins with {winner.total}! ({formatDiff(winner.total, totalPar)} par)
              </p>
            )}
            {players.length === 1 && winner && (
              <p className="text-lg font-bold text-amber">
                {winner.name} finished with {winner.total}! ({formatDiff(winner.total, totalPar)} par)
              </p>
            )}
          </section>

          {/* Full Scorecard */}
          <section className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5 overflow-x-auto">
            <h3 className="text-sm font-bold text-ink mb-3 font-mono"><Copy className="w-3.5 h-3.5 inline" /> FULL SCORECARD</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-light">
                  <th className="text-left py-2 pr-2 text-gray-mid font-medium">Hole</th>
                  <th className="text-left py-2 pr-2 text-gray-mid font-medium">Pub</th>
                  <th className="text-center py-2 pr-2 text-gray-mid font-medium">Par</th>
                  {players.map((p: string) => (
                    <th key={p} className="text-center py-2 text-gray-mid font-medium truncate max-w-[60px]">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coursePubs.map((pub: Pub, i: number) => {
                  const holePar = getPar(pub.price)
                  return (
                    <tr key={i} className="border-b border-gray-light">
                      <td className="py-1.5 pr-2 font-bold text-ink">{i + 1}</td>
                      <td className="py-1.5 pr-2 truncate max-w-[100px]">
                        <Link href={`/pub/${pub.slug}`} className="text-gray-mid hover:text-amber transition-colors">
                          {pub.name}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-2 text-center text-amber font-bold">{holePar}</td>
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
                <tr className="border-t-2 border-gray">
                  <td className="py-2 pr-2 font-black text-ink" colSpan={2}>TOTAL</td>
                  <td className="py-2 pr-2 text-center font-black text-amber">{totalPar}</td>
                  {playerTotals.map((pt: { name: string; total: number }) => (
                    <td key={pt.name} className={`py-2 text-center font-black ${
                      pt.total < totalPar ? 'text-ink' : pt.total === totalPar ? 'text-amber' : 'text-red-600'
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
          <section className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
            <h3 className="text-sm font-bold text-ink mb-3 font-mono"><BarChart3 className="w-4 h-4 inline" /> ROUND STATS</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-off-white rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-amber font-mono">${totalSpend.toFixed(0)}</p>
                <p className="text-xs text-gray-mid mt-0.5">Total Spend</p>
              </div>
              <div className="bg-off-white rounded-xl p-3 text-center">
                <p className={`text-2xl font-black mono ${avgVsPar < 0 ? 'text-ink' : avgVsPar === 0 ? 'text-amber' : 'text-red-600'}`}>
                  {avgVsPar > 0 ? '+' : ''}{avgVsPar.toFixed(1)}
                </p>
                <p className="text-xs text-gray-mid mt-0.5">Avg vs Par</p>
              </div>
              {bestHole && (
                <div className="bg-amber-pale rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-ink truncate">{bestHole.pub.name}</p>
                  <p className="text-xs text-ink mt-0.5">Best Hole (#{bestHole.index + 1})</p>
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

          {/* Share Scorecard */}
          <button
            onClick={shareResults}
            className="w-full py-4 bg-amber text-white text-lg font-bold font-mono rounded-2xl hover:bg-orange-600 transition-all duration-200 shadow-md flex items-center justify-center gap-2"
          >
            {copied ? (
              <><Check className="w-5 h-5" /> Copied!</>
            ) : (
              <><Copy className="w-5 h-5" /> Share Scorecard</>
            )}
          </button>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={resetGame}
              className="flex-1 py-3 bg-ink text-white font-bold font-mono rounded-2xl hover:bg-ink/90 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
            <Link
              href="/"
              className="flex-1 py-3 bg-white text-ink font-bold font-mono rounded-2xl border border-gray-light hover:bg-off-white transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <Home className="w-4 h-4" /> Back to Arvo
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return null
}
