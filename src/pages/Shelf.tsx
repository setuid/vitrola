import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Grid3X3, List, Music2, Tag, Search, SlidersHorizontal, Camera, Loader2,
  Share2, Copy, Check, Trash2
} from 'lucide-react'
import { useRecords } from '@/hooks/useRecords'
import { useCollectionValue } from '@/hooks/useMarketplaceStats'
import { formatPrice } from '@/lib/currency'
import { useShareToken, useCreateShareToken, useDeleteShareToken } from '@/hooks/useSharedCollection'
import { useAppStore } from '@/store/useAppStore'
import { formatDuration } from '@/lib/discogs'
import { RecordCard } from '@/components/record/RecordCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'
import type { VinylRecord } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list' | 'artist' | 'genre'
type SortBy = 'title' | 'artist' | 'year' | 'play_count' | 'rating' | 'created_at'

const VIEW_ICONS = {
  grid: Grid3X3,
  list: List,
  artist: Music2,
  genre: Tag,
}

export function Shelf() {
  const { data: records = [], isLoading } = useRecords()
  const {
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    selectedGenres, setSelectedGenres,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    showFavoritesOnly, setShowFavoritesOnly,
  } = useAppStore()

  const [showFilters, setShowFilters] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const { data: shareToken, isLoading: shareLoading } = useShareToken()
  const createShare = useCreateShareToken()
  const deleteShare = useDeleteShareToken()

  const shareUrl = shareToken
    ? `${window.location.origin}${window.location.pathname}#/shared/${shareToken}`
    : null

  const handleCopyLink = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast({ title: 'Link copiado!', variant: 'success' })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateShare = () => {
    createShare.mutate(undefined, {
      onError: () => toast({ title: 'Erro ao criar link', variant: 'destructive' }),
    })
  }

  const handleDeleteShare = () => {
    if (!confirm('Desativar compartilhamento? O link atual deixará de funcionar.')) return
    deleteShare.mutate(undefined, {
      onSuccess: () => toast({ title: 'Compartilhamento desativado', variant: 'success' }),
      onError: () => toast({ title: 'Erro ao desativar', variant: 'destructive' }),
    })
  }

  const allGenres = useMemo(() => {
    const g = new Set(records.flatMap((r) => r.genres || []))
    return [...g].sort()
  }, [records])

  const filtered = useMemo(() => {
    let res = records
    if (showFavoritesOnly) res = res.filter((r) => r.rating && r.rating >= 4)
    if (selectedGenres.length > 0) {
      res = res.filter((r) => (r.genres || []).some((g) => selectedGenres.includes(g)))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      res = res.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.artist.toLowerCase().includes(q) ||
          (r.label || '').toLowerCase().includes(q) ||
          (r.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    }
    return [...res].sort((a, b) => {
      const aVal = a[sortBy as keyof VinylRecord]
      const bVal = b[sortBy as keyof VinylRecord]
      const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''))
      return sortOrder === 'asc' ? cmp : -cmp
    })
  }, [records, searchQuery, selectedGenres, showFavoritesOnly, sortBy, sortOrder])

  const totalDuration = records.reduce((acc, r) => acc + (r.total_duration_seconds || 0), 0)
  const { totalValue, currency } = useCollectionValue(records)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
      </div>
    )
  }

  const groupByArtist = () => {
    const map: Record<string, VinylRecord[]> = {}
    filtered.forEach((r) => {
      const key = r.artist[0]?.toUpperCase() || '#'
      if (!map[key]) map[key] = []
      map[key].push(r)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }

  const groupByGenre = () => {
    const map: Record<string, VinylRecord[]> = {}
    filtered.forEach((r) => {
      const g = r.genres?.[0] || 'Sem gênero'
      if (!map[g]) map[g] = []
      map[g].push(r)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#F5F0E8]">Minha Estante</h1>
          <p className="text-[#9A9080] text-sm mt-0.5">
            {records.length} discos · {formatDuration(totalDuration)}
            {totalValue !== null && ` · ${formatPrice(totalValue, currency)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowShare(true)} title="Compartilhar">
            <Share2 className="w-4 h-4" />
          </Button>
          <Link to="/scanner">
            <Button>
              <Camera className="w-4 h-4 mr-2" /> Adicionar
            </Button>
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[150px] sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5248]" />
          <Input
            className="pl-9"
            placeholder="Buscar por título, artista, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              { value: 'created_at', label: 'Adicionado' },
              { value: 'title', label: 'Título' },
              { value: 'artist', label: 'Artista' },
              { value: 'year', label: 'Ano' },
              { value: 'play_count', label: 'Mais tocados' },
              { value: 'rating', label: 'Avaliação' },
            ].map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'border-[#C9A84C]/60 text-[#C9A84C]' : ''}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>

        {/* View mode */}
        <div className="flex border border-[#2A2A2A] rounded-md overflow-hidden">
          {(Object.keys(VIEW_ICONS) as ViewMode[]).map((mode) => {
            const Icon = VIEW_ICONS[mode]
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === mode
                    ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                    : 'text-[#5A5248] hover:text-[#9A9080] hover:bg-[#1A1A1A]'
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border border-[#2A2A2A] rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9A9080]">Filtros</span>
            <button
              className={cn(
                'text-xs px-2 py-1 rounded border transition-colors',
                showFavoritesOnly
                  ? 'border-[#C9A84C]/60 text-[#C9A84C] bg-[#C9A84C]/10'
                  : 'border-[#2A2A2A] text-[#5A5248]'
              )}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              ★ Favoritos
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {allGenres.map((g) => (
              <button
                key={g}
                onClick={() =>
                  setSelectedGenres(
                    selectedGenres.includes(g)
                      ? selectedGenres.filter((x) => x !== g)
                      : [...selectedGenres, g]
                  )
                }
              >
                <Badge variant={selectedGenres.includes(g) ? 'default' : 'secondary'}>
                  {g}
                </Badge>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Results count */}
      {filtered.length !== records.length && (
        <p className="text-sm text-[#9A9080]">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#5A5248]">
          <p>Nenhum disco encontrado.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((r) => (
            <RecordCard key={r.id} record={r} />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-1">
          {filtered.map((r) => (
            <Link key={r.id} to={`/shelf/${r.id}`}>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-[#2A2A2A]">
                <div className="w-10 h-10 rounded-md overflow-hidden bg-[#2A2A2A] flex-shrink-0">
                  {r.cover_image_url && (
                    <img src={r.cover_image_url} alt={r.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F5F0E8] truncate">{r.title}</p>
                  <p className="text-xs text-[#9A9080] truncate">{r.artist}</p>
                </div>
                <span className="text-xs font-mono text-[#5A5248] shrink-0">{r.year || '—'}</span>
                <span className="text-xs font-mono text-[#5A5248] shrink-0">{r.condition}</span>
                <span className="text-xs font-mono text-[#C9A84C] shrink-0">×{r.play_count}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : viewMode === 'artist' ? (
        <div className="space-y-6">
          {groupByArtist().map(([letter, items]) => (
            <div key={letter}>
              <h3 className="font-display text-2xl text-[#C9A84C] mb-3">{letter}</h3>
              <div className="space-y-1">
                {items.map((r) => (
                  <Link key={r.id} to={`/shelf/${r.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A1A1A] transition-colors">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-[#2A2A2A] flex-shrink-0">
                        {r.cover_image_url && <img src={r.cover_image_url} alt={r.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#9A9080] truncate">{r.artist}</p>
                        <p className="text-sm font-medium text-[#F5F0E8] truncate">{r.title}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {groupByGenre().map(([genre, items]) => (
            <div key={genre}>
              <h3 className="text-lg font-semibold text-[#F5F0E8] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                {genre}
                <span className="text-sm text-[#5A5248] font-normal">({items.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {items.map((r) => <RecordCard key={r.id} record={r} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar coleção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {shareLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
              </div>
            ) : shareToken ? (
              <>
                <p className="text-sm text-[#9A9080]">
                  Qualquer pessoa com este link pode ver sua coleção (somente leitura).
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={shareUrl || ''}
                    className="text-xs font-mono"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button size="icon" variant="outline" onClick={handleCopyLink}>
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                  onClick={handleDeleteShare}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Desativar link
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-[#9A9080]">
                  Gere um link público para compartilhar sua discoteca com amigos. Eles poderão ver seus álbuns e estatísticas, mas não poderão editar nada.
                </p>
                <Button onClick={handleCreateShare} disabled={createShare.isPending}>
                  {createShare.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Share2 className="w-4 h-4 mr-2" /> Gerar link de compartilhamento
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
