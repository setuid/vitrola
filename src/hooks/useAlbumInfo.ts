import { useQuery } from '@tanstack/react-query'
import { getAlbumWikiInfo, WikiSummary } from '@/lib/wikipedia'
import { getRelease } from '@/lib/discogs'

export interface AlbumInfo {
  wikiAlbum: WikiSummary | null
  wikiArtist: WikiSummary | null
  discogsNotes: string | null
}

export function useAlbumInfo(title: string, artist: string, discogsId: string | null) {
  const wikiQuery = useQuery({
    queryKey: ['wiki', title, artist],
    queryFn: () => getAlbumWikiInfo(title, artist),
    staleTime: 24 * 60 * 60 * 1000, // 24h cache
    enabled: !!title && !!artist,
  })

  const discogsQuery = useQuery({
    queryKey: ['discogs', 'release-notes', discogsId],
    queryFn: async () => {
      const release = await getRelease(Number(discogsId))
      return release.notes || null
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!discogsId,
  })

  const isLoading = wikiQuery.isLoading || discogsQuery.isLoading
  const hasContent = !!(
    wikiQuery.data?.album?.extract ||
    wikiQuery.data?.artist?.extract ||
    discogsQuery.data
  )

  return {
    wikiAlbum: wikiQuery.data?.album ?? null,
    wikiArtist: wikiQuery.data?.artist ?? null,
    discogsNotes: discogsQuery.data ?? null,
    isLoading,
    hasContent,
  }
}
