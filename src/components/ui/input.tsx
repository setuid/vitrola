import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-[#2A2A2A] bg-[#111111] px-3 py-1 text-sm text-[#F5F0E8] shadow-sm transition-colors',
        'placeholder:text-[#5A5248]',
        'focus-visible:outline-none focus-visible:border-[#C9A84C]/60 focus-visible:ring-0',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
