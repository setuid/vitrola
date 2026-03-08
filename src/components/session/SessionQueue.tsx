import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { GripVertical, X, Disc3 } from 'lucide-react'
import type { SessionRecord, VinylRecord } from '@/lib/supabase'
import { formatDuration } from '@/lib/discogs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type QueueItem = SessionRecord & { record: VinylRecord }

interface SessionQueueProps {
  items: QueueItem[]
  onReorder: (items: QueueItem[]) => void
  onRemove: (id: string) => void
  onSideChange: (id: string, side: string) => void
  totalDuration: number
}

export function SessionQueue({ items, onReorder, onRemove, onSideChange, totalDuration }: SessionQueueProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const reordered = Array.from(items)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    onReorder(reordered)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-[#5A5248]">
        <Disc3 className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">Arraste discos para cá</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="queue">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                        snapshot.isDragging
                          ? 'border-[#C9A84C]/50 bg-[#1A1A1A] shadow-lg'
                          : 'border-[#2A2A2A] bg-[#111111]'
                      }`}
                    >
                      <div {...provided.dragHandleProps} className="text-[#5A5248] cursor-grab">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <span className="text-xs font-mono text-[#5A5248] w-5 text-right">
                        {index + 1}
                      </span>

                      {/* Cover */}
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-[#2A2A2A] flex-shrink-0">
                        {item.record.cover_image_url ? (
                          <img
                            src={item.record.cover_image_url}
                            alt={item.record.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Disc3 className="w-4 h-4 text-[#5A5248]" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F5F0E8] truncate">
                          {item.record.title}
                        </p>
                        <p className="text-xs text-[#9A9080] truncate">{item.record.artist}</p>
                      </div>

                      {/* Side selector */}
                      <Select
                        value={item.side || 'AB'}
                        onValueChange={(v) => onSideChange(item.id, v)}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs border-[#2A2A2A]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['A', 'B', 'AB'].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#5A5248] hover:text-red-400"
                        onClick={() => onRemove(item.id)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Total duration */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2A2A2A]">
        <span className="text-xs text-[#9A9080]">Duração total:</span>
        <span className="text-sm font-mono text-[#C9A84C]">{formatDuration(totalDuration)}</span>
      </div>
    </div>
  )
}
