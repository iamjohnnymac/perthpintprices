'use client'

import { useState } from 'react'
import { CrowdLevel, CROWD_LEVELS, reportCrowdLevel } from '@/lib/supabase'
import { CircleCheck } from 'lucide-react'
import LucideIcon from '@/components/LucideIcon'

interface CrowdReporterProps {
  pubId: string
  pubName: string
  onClose: () => void
  onReport: () => void
}

export default function CrowdReporter({ pubId, pubName, onClose, onReport }: CrowdReporterProps) {
  const [selectedLevel, setSelectedLevel] = useState<CrowdLevel | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!selectedLevel) return
    
    setIsSubmitting(true)
    const success = await reportCrowdLevel(pubId, selectedLevel)
    setIsSubmitting(false)
    
    if (success) {
      setIsSuccess(true)
      setTimeout(() => {
        onReport()
        onClose()
      }, 1500)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-ink rounded-card max-w-sm w-full overflow-hidden shadow-hard border-3 border-ink">
        {/* Header */}
        <div className="bg-amber border-b-3 border-ink px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-mono text-white font-bold text-lg">How busy is it?</h3>
              <p className="text-white/80 text-sm truncate">{pubName}</p>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <span className="text-white text-lg">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <CircleCheck className="w-16 h-16 text-amber mb-4" />
              <p className="text-white font-semibold text-lg">Thanks.</p>
              <p className="text-white/60 text-sm">Your report helps others know how busy it is.</p>
            </div>
          ) : (
            <>
              <p className="text-white/70 text-sm text-center mb-6">
                Tap to report the current crowd level
              </p>

              {/* Crowd Level Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {(Object.entries(CROWD_LEVELS) as [string, typeof CROWD_LEVELS[1]][]).map(([level, info]) => {
                  const levelNum = parseInt(level) as CrowdLevel
                  const isSelected = selectedLevel === levelNum
                  
                  return (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(levelNum)}
                      className={`
                        p-4 rounded-card border-2 transition-all duration-200
                        ${isSelected
                          ? `${info.color} border-white text-white scale-105 shadow-hard-sm`
                          : 'bg-white/5 border-white/15 text-white/70 hover:border-white/30 hover:bg-white/10'
                        }
                      `}
                    >
                      <div className="mb-1"><LucideIcon name={info.emoji} className="w-8 h-8" /></div>
                      <div className="font-semibold text-sm">{info.label}</div>
                    </button>
                  )
                })}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!selectedLevel || isSubmitting}
                className={`
                  w-full py-3 rounded-pill border-3 border-ink font-bold text-white transition-all
                  ${selectedLevel && !isSubmitting
                    ? 'bg-amber hover:bg-amber-light shadow-hard-sm'
                    : 'bg-white/10 cursor-not-allowed opacity-50'
                  }
                `}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Reporting...
                  </span>
                ) : (
                  'Report Crowd Level'
                )}
              </button>

              <p className="text-white/50 text-xs text-center mt-4">
                Reports are anonymous and expire after 3 hours
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
