import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Disc3 } from 'lucide-react'
import {
  calculateSimilarityScore, RELATION_COLORS,
  type GraphRecord, type RelationType,
} from '@/lib/graph'
import { Card } from '@/components/ui/card'

interface RelatedRecordsProps {
  record: GraphRecord
  allRecords: GraphRecord[]
}

// Short labels for compact reason chips.
const SHORT_LABELS: Record<RelationType, string> = {
  artist: 'Artista',
  genre: 'Gênero',
  style: 'Estilo',
  era: 'Era',
  label: 'Selo',
  favorites: 'Favoritos',
}

export function RelatedRecords({ record, allRecords }: RelatedRecordsProps) {
  const related = useMemo(() => {
    return allRecords
      .filter((r) => r.id !== record.id)
      .map((r) => ({ record: r, ...calculateSimilarityScore(record, r) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [record, allRecords])

  if (related.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-10"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#C9A84C]" />
        <h2 className="font-display text-xl font-semibold text-[#F5F0E8]">
          Discos mais relacionados
        </h2>
      </div>

      <div className="space-y-2">
        {related.map((item, i) => (
          <Link key={item.record.id} to={`/shelf/${item.record.id}`}>
            <Card className="card-hover cursor-pointer">
              <div className="flex items-center gap-3 p-3">
                <span className="text-sm font-mono text-[#C9A84C] w-5 text-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="w-12 h-12 rounded-md overflow-hidden bg-[#1A1A1A] flex-shrink-0">
                  {item.record.cover_image_url ? (
                    <img
                      src={item.record.cover_image_url}
                      alt={item.record.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 className="w-5 h-5 text-[#5A5248]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F5F0E8] truncate">
                    {item.record.title}
                  </p>
                  <p className="text-xs text-[#9A9080] truncate">{item.record.artist}</p>
                  {item.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.reasons.map((reason) => (
                        <span
                          key={reason}
                          className="inline-flex items-center gap-1 text-[10px] text-[#9A9080]"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: RELATION_COLORS[reason] }}
                          />
                          {SHORT_LABELS[reason]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}
