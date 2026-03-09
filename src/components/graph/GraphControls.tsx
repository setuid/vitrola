import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GraphControlsProps {
  minScore: number
  onMinScoreChange: (v: number) => void
  nodeCount: number
  edgeCount: number
}

const PRESETS = [
  { value: 25, label: 'Explorar', desc: 'Mais conexões' },
  { value: 35, label: 'Equilibrado', desc: 'Balanço ideal' },
  { value: 45, label: 'Essencial', desc: 'Só as fortes' },
] as const

export function GraphControls({
  minScore,
  onMinScoreChange,
  nodeCount,
  edgeCount,
}: GraphControlsProps) {
  const [open, setOpen] = useState(false)
  const activeLabel = PRESETS.find((p) => p.value === minScore)?.label ?? 'Equilibrado'

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass border border-[#2A2A2A] rounded-xl p-3 sm:p-4 w-44 sm:w-48"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-xs font-semibold text-[#9A9080] uppercase tracking-wider"
      >
        <span>Intensidade</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[#C9A84C] normal-case font-mono text-[10px]">{activeLabel}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 pt-3">
              {PRESETS.map((preset) => {
                const active = minScore === preset.value
                return (
                  <button
                    key={preset.value}
                    onClick={() => onMinScoreChange(preset.value)}
                    className={cn(
                      'flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-sm transition-all',
                      active
                        ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30'
                        : 'text-[#9A9080] hover:text-[#F5F0E8] hover:bg-[#1A1A1A] border border-transparent'
                    )}
                  >
                    <span className="font-medium">{preset.label}</span>
                    <span className={cn('text-[10px]', active ? 'text-[#C9A84C]/70' : 'text-[#5A5248]')}>
                      {preset.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-3 mt-3 border-t border-[#2A2A2A] text-xs text-[#5A5248] font-mono">
        <p>{nodeCount} discos · {edgeCount} conexões</p>
      </div>
    </motion.div>
  )
}
