import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Play, Edit, Trash2, Clock, Disc3, Calendar, MapPin, Tag, Loader2,
  BookOpen, ChevronDown, ExternalLink, Info, DollarSign
} from 'lucide-react'
import { useRecord, useDeleteRecord, usePlayRecord, useUpdateRecord } from '@/hooks/useRecords'
import { useAlbumInfo } from '@/hooks/useAlbumInfo'
import { useRecordPrice } from '@/hooks/useMarketplaceStats'
import { toast } from '@/hooks/useToast'
import { formatDuration, formatTotalDuration } from '@/lib/discogs'
import { formatPrice } from '@/lib/currency'
import { getConditionColor, formatYear } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/record/StarRating'

export function RecordDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: record, isLoading } = useRecord(id)
  const deleteRecord = useDeleteRecord()
  const playRecord = usePlayRecord()
  const updateRecord = useUpdateRecord()
  const albumInfo = useAlbumInfo(
    record?.title ?? '',
    record?.artist ?? '',
    record?.discogs_id ?? null
  )
  const priceInfo = useRecordPrice(record?.discogs_id ?? null)
  const [aboutOpen, setAboutOpen] = useState(true)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="text-center py-16 text-[#5A5248]">
        <p>Disco não encontrado.</p>
        <Link to="/shelf"><Button variant="link" className="mt-2">Voltar à estante</Button></Link>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!confirm(`Remover "${record.title}"?`)) return
    deleteRecord.mutate(record.id, {
      onSuccess: () => {
        toast({ title: 'Disco removido', variant: 'success' })
        navigate('/shelf')
      },
    })
  }

  const handlePlay = () => {
    playRecord.mutate(
      { recordId: record.id },
      {
        onSuccess: () =>
          toast({ title: 'Escuta registrada!', description: record.title, variant: 'success' }),
      }
    )
  }

  const handleRating = (rating: number) => {
    updateRecord.mutate({ id: record.id, rating })
  }

  const tracklist = (record.tracklist || []) as { position: string; title: string; duration: string }[]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cover */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <div className="aspect-square rounded-2xl overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] shadow-2xl">
            {record.cover_image_url ? (
              <img
                src={record.cover_image_url}
                alt={record.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center vinyl-ring">
                <div className="w-32 h-32 rounded-full bg-[#2A2A2A] border-8 border-[#0A0A0A] flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-[#5A5248]" />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-[#F5F0E8] leading-tight">
              {record.title}
            </h1>
            <p className="text-xl text-[#9A9080] mt-1">{record.artist}</p>
          </div>

          <StarRating value={record.rating} onChange={handleRating} />

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2">
            {record.year && (
              <Badge variant="secondary">
                <Calendar className="w-3 h-3 mr-1" />
                {formatYear(record.year)}
              </Badge>
            )}
            {record.country && (
              <Badge variant="secondary">
                <MapPin className="w-3 h-3 mr-1" />
                {record.country}
              </Badge>
            )}
            <Badge
              variant="outline"
              style={{
                borderColor: `${getConditionColor(record.condition)}40`,
                color: getConditionColor(record.condition),
              }}
            >
              {record.condition}
            </Badge>
            <Badge variant="secondary">
              <Disc3 className="w-3 h-3 mr-1" />
              {record.format} · {record.rpm} RPM
            </Badge>
            {record.total_duration_seconds && record.total_duration_seconds > 0 && (
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                {formatTotalDuration(record.total_duration_seconds)}
              </Badge>
            )}
          </div>

          {/* Label + catalog */}
          {(record.label || record.catalog_number) && (
            <p className="text-sm text-[#9A9080]">
              {record.label}
              {record.catalog_number && ` — ${record.catalog_number}`}
            </p>
          )}

          {/* Genres/Styles */}
          {(record.genres?.length || record.styles?.length) && (
            <div className="flex flex-wrap gap-1.5">
              {record.genres?.map((g) => (
                <Badge key={g}>{g}</Badge>
              ))}
              {record.styles?.map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          )}

          {/* Tags */}
          {record.tags && record.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-[#5A5248]" />
              {record.tags.map((t) => (
                <span key={t} className="text-xs text-[#9A9080] bg-[#1A1A1A] border border-[#2A2A2A] rounded-full px-2 py-0.5">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Play count */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#5A5248]">Escutas:</span>
            <span className="font-mono text-[#C9A84C] font-semibold">{record.play_count}</span>
            {record.last_played_at && (
              <span className="text-xs text-[#5A5248]">
                · Última: {new Date(record.last_played_at).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          {/* Marketplace price */}
          {record.discogs_id && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-[#5A5248]" />
              {priceInfo.isLoading ? (
                <div className="h-4 w-24 bg-[#1A1A1A] rounded animate-pulse" />
              ) : priceInfo.data?.lowestPrice !== null && priceInfo.data?.lowestPrice !== undefined ? (
                <>
                  <span className="font-mono text-[#C9A84C] font-semibold">
                    {formatPrice(priceInfo.data.lowestPrice, priceInfo.data.currency)}
                  </span>
                  <span className="text-xs text-[#5A5248]">
                    · {priceInfo.data.numForSale} à venda
                  </span>
                </>
              ) : (
                <span className="text-sm text-[#5A5248]">Sem cotação no Discogs</span>
              )}
            </div>
          )}

          {/* Notes */}
          {record.notes && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3">
              <p className="text-sm text-[#9A9080]">{record.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handlePlay} className="flex-1">
              <Play className="w-4 h-4 mr-2" /> Toquei agora
            </Button>
            <Link to={`/shelf/${record.id}/edit`}>
              <Button variant="outline" size="icon">
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Tracklist */}
      {tracklist.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-10"
        >
          <h2 className="font-display text-xl font-semibold text-[#F5F0E8] mb-4">Tracklist</h2>
          <div className="space-y-1">
            {tracklist.map((track, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#1A1A1A] transition-colors"
              >
                <span className="text-xs font-mono text-[#5A5248] w-8 text-right shrink-0">
                  {track.position}
                </span>
                <span className="flex-1 text-sm text-[#F5F0E8]">{track.title}</span>
                {track.duration && (
                  <span className="text-xs font-mono text-[#9A9080] shrink-0">{track.duration}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* About this record */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-10"
      >
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          className="flex items-center gap-2 w-full group"
        >
          <BookOpen className="w-5 h-5 text-[#C9A84C]" />
          <h2 className="font-display text-xl font-semibold text-[#F5F0E8]">About this record</h2>
          <ChevronDown className={`w-4 h-4 text-[#5A5248] transition-transform ${aboutOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {aboutOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4">
                {albumInfo.isLoading && (
                  <div className="space-y-3">
                    <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-full" />
                    <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-5/6" />
                    <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
                  </div>
                )}

                {!albumInfo.isLoading && !albumInfo.hasContent && (
                  <p className="text-sm text-[#5A5248] italic">
                    No additional information found for this record.
                  </p>
                )}

                {/* Wikipedia - Album */}
                {albumInfo.wikiAlbum && (
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-3.5 h-3.5 text-[#C9A84C]" />
                      <span className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider">
                        About the album
                      </span>
                    </div>
                    <p className="text-sm text-[#9A9080] leading-relaxed">
                      {albumInfo.wikiAlbum.extract}
                    </p>
                    {albumInfo.wikiAlbum.content_urls?.desktop?.page && (
                      <a
                        href={albumInfo.wikiAlbum.content_urls.desktop.page}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#E8B84B] mt-3 transition-colors"
                      >
                        Read more on Wikipedia <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Wikipedia - Artist */}
                {albumInfo.wikiArtist && (
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-3.5 h-3.5 text-[#C9A84C]" />
                      <span className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider">
                        About {record.artist}
                      </span>
                    </div>
                    <p className="text-sm text-[#9A9080] leading-relaxed">
                      {albumInfo.wikiArtist.extract}
                    </p>
                    {albumInfo.wikiArtist.content_urls?.desktop?.page && (
                      <a
                        href={albumInfo.wikiArtist.content_urls.desktop.page}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#E8B84B] mt-3 transition-colors"
                      >
                        Read more on Wikipedia <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Discogs notes */}
                {albumInfo.discogsNotes && (
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Disc3 className="w-3.5 h-3.5 text-[#C9A84C]" />
                      <span className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider">
                        Discogs notes
                      </span>
                    </div>
                    <p className="text-sm text-[#9A9080] leading-relaxed whitespace-pre-line">
                      {albumInfo.discogsNotes}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
