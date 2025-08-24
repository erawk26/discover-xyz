import { cn } from '@/utilities/ui'
import * as React from 'react'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4 border-2',
      md: 'h-8 w-8 border-3',
      lg: 'h-12 w-12 border-4',
      xl: 'h-16 w-16 border-4'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'animate-spin rounded-full border-solid border-current border-t-transparent',
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)

Spinner.displayName = 'Spinner'

export { Spinner }