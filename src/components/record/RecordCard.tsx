import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Star, Heart, MoreVertical, Trash2, Edit } from 'lucide-react'
import type { VinylRecord } from '@/lib/supabase'
import { formatYear, getConditionColor } from '@/lib/utils'
import { usePlayRecord, useDeleteRecord, useUpdateRecord } from '@/hooks/useRecords'
import { toast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { StarRating } from './StarRating'
import { cn } from '@/lib/utils'

interface RecordCardProps {
  record: VinylRecord
}

export function RecordCard({ record }: RecordCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [hovering, setHovering] = useState(false)
  const playRecord = usePlayRecord()
  const deleteRecord = useDeleteRecord()
  const updateRecord = useUpdateRecord()

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault()
    playRecord.mutate(
      { recordId: record.id },
      {
        onSuccess: () => toast({ title: `Registrado!`, description: `${record.artist} — ${record.title}`, variant: 'success' }),
        onError: () => toast({ title: 'Erro ao registrar escuta', variant: 'destructive' }),
      }
    )
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm(`Remover "${record.title}"?`)) return
    deleteRecord.mutate(record.id, {
      onSuccess: () => toast({ title: 'Disco removido', variant: 'success' }),
      onError: () => toast({ title: 'Erro ao remover', variant: 'destructive' }),
    })
  }

  const handleRating = (rating: number) => {
    updateRecord.mutate({ id: record.id, rating })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="relative group"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setShowMenu(false) }}
    >
      <Link to={`/shelf/${record.id}`}>
        <div className="relative aspect-square rounded-lg overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] transition-all duration-300 group-hover:border-[#C9A84C]/40 group-hover:shadow-lg group-hover:shadow-[#C9A84C]/5">
          {record.cover_image_url ? (
            <img
              src={record.cover_image_url}
              alt={record.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center vinyl-ring">
              <div className="w-16 h-16 rounded-full bg-[#2A2A2A] border-4 border-[#0A0A0A] flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[#5A5248]" />
              </div>
            </div>
          )}

          {/* Hover overlay */}
          {hovering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-[#0A0A0A]/40 to-transparent flex flex-col justify-end p-3"
            >
              <p className="text-xs text-[#9A9080] truncate font-mono">{record.artist}</p>
              <p className="text-sm font-medium text-[#F5F0E8] truncate">{record.title}</p>
              <div className="flex items-center justify-between mt-2">
                <StarRating value={record.rating} onChange={handleRating} size="sm" />
                <span
                  className="text-xs font-mono px-1.5 py-0.5 rounded"
                  style={{ color: getConditionColor(record.condition), backgroundColor: `${getConditionColor(record.condition)}15` }}
                >
                  {record.condition}
                </span>
              </div>
            </motion.div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {record.play_count > 0 && (
              <span className="text-[10px] font-mono bg-[#0A0A0A]/70 text-[#9A9080] px-1.5 py-0.5 rounded">
                ×{record.play_count}
              </span>
            )}
          </div>

          {/* Action buttons (top-right) */}
          <div className={cn('absolute top-2 right-2 flex gap-1 transition-opacity', hovering ? 'opacity-100' : 'opacity-0')}>
            <Button size="icon" variant="secondary" className="h-7 w-7 bg-[#0A0A0A]/70 border-0" onClick={handlePlay}>
              <Play className="w-3 h-3" />
            </Button>
            <div className="relative">
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 bg-[#0A0A0A]/70 border-0"
                onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu) }}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded-md shadow-xl z-10 py-1 min-w-[120px]">
                  <Link
                    to={`/shelf/${record.id}/edit`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#F5F0E8] hover:bg-[#2A2A2A]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="w-3 h-3" /> Editar
                  </Link>
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#2A2A2A] w-full"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-3 h-3" /> Remover
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Below card info */}
        <div className="mt-2 px-0.5">
          <p className="text-sm font-medium text-[#F5F0E8] truncate">{record.title}</p>
          <p className="text-xs text-[#9A9080] truncate">
            {record.artist}
            {record.year ? ` · ${formatYear(record.year)}` : ''}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
