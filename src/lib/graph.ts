import type { VinylRecord } from './supabase'

export interface GraphNode {
  id: string
  record: VinylRecord
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

export interface GraphEdge {
  source: string | GraphNode
  target: string | GraphNode
  score: number
  reasons: RelationType[]
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type RelationType = 'artist' | 'genre' | 'style' | 'era' | 'label' | 'favorites'

export const RELATION_COLORS: Record<RelationType, string> = {
  artist: '#C9A84C',
  genre: '#4C8BC9',
  style: '#4CC97A',
  era: '#9A4CC9',
  label: '#9A9080',
  favorites: '#C94C4C',
}

export const RELATION_LABELS: Record<RelationType, string> = {
  artist: 'Mesmo artista',
  genre: 'Mesmo gênero',
  style: 'Mesmo estilo',
  era: 'Mesma era',
  label: 'Mesmo selo',
  favorites: 'Ambos favoritos',
}

const MIN_SCORE = 25

export function calculateSimilarityScore(
  a: VinylRecord,
  b: VinylRecord
): { score: number; reasons: RelationType[] } {
  let score = 0
  const reasons: RelationType[] = []

  // Same artist (+40)
  if (a.artist && b.artist && a.artist.toLowerCase() === b.artist.toLowerCase()) {
    score += 40
    reasons.push('artist')
  }

  // Genre comparison
  const aGenres = a.genres || []
  const bGenres = b.genres || []
  if (aGenres.length && bGenres.length) {
    if (aGenres[0] && bGenres[0] && aGenres[0] === bGenres[0]) {
      score += 20
      if (!reasons.includes('genre')) reasons.push('genre')
    } else {
      const common = aGenres.filter((g) => bGenres.includes(g))
      if (common.length > 0) {
        score += 10
        if (!reasons.includes('genre')) reasons.push('genre')
      }
    }
  }

  // Style comparison (+15)
  const aStyles = a.styles || []
  const bStyles = b.styles || []
  const commonStyles = aStyles.filter((s) => bStyles.includes(s))
  if (commonStyles.length > 0) {
    score += 15
    reasons.push('style')
  }

  // Era (±5 years, +10)
  if (a.year && b.year && Math.abs(a.year - b.year) <= 5) {
    score += 10
    reasons.push('era')
  }

  // Same country (+5)
  if (a.country && b.country && a.country.toLowerCase() === b.country.toLowerCase()) {
    score += 5
  }

  // Same label (+5)
  if (a.label && b.label && a.label.toLowerCase() === b.label.toLowerCase()) {
    score += 5
    reasons.push('label')
  }

  // Both favorites (+10)
  if (a.rating && b.rating && a.rating >= 4 && b.rating >= 4) {
    score += 10
    reasons.push('favorites')
  }

  return { score, reasons }
}

export function buildGraphData(records: VinylRecord[]): GraphData {
  const nodes: GraphNode[] = records.map((r) => ({ id: r.id, record: r }))
  const edges: GraphEdge[] = []

  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const { score, reasons } = calculateSimilarityScore(records[i], records[j])
      if (score >= MIN_SCORE) {
        edges.push({
          source: records[i].id,
          target: records[j].id,
          score,
          reasons,
        })
      }
    }
  }

  return { nodes, edges }
}

export function filterGraphByRelations(data: GraphData, activeRelations: RelationType[]): GraphData {
  if (activeRelations.length === 0) return { nodes: data.nodes, edges: [] }
  const filteredEdges = data.edges.filter((e) =>
    e.reasons.some((r) => activeRelations.includes(r))
  )
  // Only keep nodes that have at least one edge
  const connectedIds = new Set<string>()
  filteredEdges.forEach((e) => {
    const src = typeof e.source === 'string' ? e.source : e.source.id
    const tgt = typeof e.target === 'string' ? e.target : e.target.id
    connectedIds.add(src)
    connectedIds.add(tgt)
  })
  return {
    nodes: data.nodes.filter((n) => connectedIds.has(n.id)),
    edges: filteredEdges,
  }
}
