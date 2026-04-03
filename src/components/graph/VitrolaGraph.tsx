import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { useNavigate } from 'react-router-dom'
import type { GraphData, GraphNode, GraphEdge, RelationType } from '@/lib/graph'
import { RELATION_COLORS } from '@/lib/graph'

interface VitrolaGraphProps {
  data: GraphData
  highlightFavorites?: boolean
  highlightUnplayed?: boolean
  width?: number
  height?: number
  onNodeClick?: (node: GraphNode) => void
}

const NODE_RADIUS = 28

export function VitrolaGraph({
  data,
  highlightFavorites = false,
  highlightUnplayed = false,
  width = 800,
  height = 600,
  onNodeClick,
}: VitrolaGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const navigate = useNavigate()
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null)

  const draw = useCallback(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    if (data.nodes.length === 0) return

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString())
      })

    svg.call(zoom)

    const g = svg.append('g')

    // Simulation
    const simulation = d3
      .forceSimulation<GraphNode>(data.nodes as GraphNode[])
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphEdge>(data.edges as GraphEdge[])
          .id((d) => d.id)
          .distance((d) => Math.max(80, 180 - d.score))
          .strength(0.3)
      )
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(NODE_RADIUS + 8))

    // Edges
    const link = g
      .selectAll('line')
      .data(data.edges as GraphEdge[])
      .enter()
      .append('line')
      .attr('class', 'graph-link')
      .attr('stroke', (d) => {
        const primaryReason = d.reasons[0] as RelationType | undefined
        return primaryReason ? RELATION_COLORS[primaryReason] : '#2A2A2A'
      })
      .attr('stroke-width', (d) => Math.max(1, d.score / 30))
      .attr('stroke-opacity', 0.4)
      .style('cursor', 'pointer')
      .on('mouseover', function (_, d) {
        d3.select(this).attr('stroke-opacity', 1)
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke-opacity', 0.4)
      })

    // Node groups
    const node = g
      .selectAll('g.node')
      .data(data.nodes as GraphNode[])
      .enter()
      .append('g')
      .attr('class', 'graph-node')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )
      .on('click', (_, d) => onNodeClick ? onNodeClick(d) : navigate(`/shelf/${d.id}`))
      .on('mouseover', function (event, d) {
        setTooltip({ x: event.clientX, y: event.clientY, node: d })
        d3.select(this).select('circle').attr('stroke', '#C9A84C').attr('stroke-width', 2)
      })
      .on('mouseout', function () {
        setTooltip(null)
        d3.select(this).select('circle').attr('stroke', '#2A2A2A').attr('stroke-width', 1)
      })

    // Background circle
    node
      .append('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', (d) => {
        if (highlightFavorites && d.record.rating && d.record.rating >= 4) return '#C9A84C20'
        if (highlightUnplayed && !d.record.play_count) return '#4C8BC920'
        return '#1A1A1A'
      })
      .attr('stroke', '#2A2A2A')
      .attr('stroke-width', 1)

    // Clip path for cover images
    const defs = svg.append('defs')
    data.nodes.forEach((n: GraphNode) => {
      defs
        .append('clipPath')
        .attr('id', `clip-${n.id}`)
        .append('circle')
        .attr('r', NODE_RADIUS - 1)
    })

    // Cover images
    node
      .append('image')
      .attr('href', (d) => d.record.cover_image_url || '')
      .attr('width', (NODE_RADIUS - 1) * 2)
      .attr('height', (NODE_RADIUS - 1) * 2)
      .attr('x', -(NODE_RADIUS - 1))
      .attr('y', -(NODE_RADIUS - 1))
      .attr('clip-path', (d) => `url(#clip-${d.id})`)
      .attr('preserveAspectRatio', 'xMidYMid slice')

    // Fallback text for nodes without cover
    node
      .filter((d) => !d.record.cover_image_url)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#9A9080')
      .attr('font-size', '10px')
      .text((d) => d.record.artist.slice(0, 4))

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0)

      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    return () => simulation.stop()
  }, [data, width, height, highlightFavorites, highlightUnplayed, navigate, onNodeClick])

  useEffect(() => {
    const cleanup = draw()
    return () => { cleanup?.() }
  }, [draw])

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full"
        style={{ background: '#0A0A0A' }}
      />
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none glass border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-medium text-[#F5F0E8]">{tooltip.node.record.title}</p>
          <p className="text-xs text-[#9A9080]">{tooltip.node.record.artist}</p>
        </div>
      )}
    </div>
  )
}
