import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number | null
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
        >
          <Star
            className={cn(
              starSize,
              'transition-colors',
              value && star <= value
                ? 'fill-[#C9A84C] text-[#C9A84C]'
                : 'fill-transparent text-[#2A2A2A]'
            )}
          />
        </button>
      ))}
    </div>
  )
}
