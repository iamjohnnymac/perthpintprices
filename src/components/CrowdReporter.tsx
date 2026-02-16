'use client'

import { useState } from 'react'
import { CrowdLevel, CROWD_LEVELS, reportCrowdLevel } from '@/lib/supabase'

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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-white/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">How busy is it?</h3>
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
              <div className="text-6xl mb-4">✅</div>
              <p className="text-white font-semibold text-lg">Thanks!</p>
              <p className="text-gray-400 text-sm">Your report helps others find the vibe!</p>
            </div>
          ) : (
            <>
              <p className="text-gray-300 text-sm text-center mb-6">
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
                        p-4 rounded-2xl border-2 transition-all duration-200
                        ${isSelected 
                          ? `${info.color} border-white text-white scale-105 shadow-lg` 
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                        }
                      `}
                    >
                      <div className="text-3xl mb-1">{info.emoji}</div>
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
                  w-full py-3 rounded-xl font-bold text-white transition-all
                  ${selectedLevel && !isSubmitting
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
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

              <p className="text-gray-500 text-xs text-center mt-4">
                Reports are anonymous and expire after 3 hours
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
