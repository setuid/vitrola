import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]',
        secondary: 'border-[#2A2A2A] bg-[#1A1A1A] text-[#9A9080]',
        outline: 'border-[#2A2A2A] text-[#9A9080]',
        destructive: 'border-red-800/50 bg-red-900/20 text-red-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
