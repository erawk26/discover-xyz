'use client'

import * as React from 'react'
import { Button, ButtonProps } from './button'
import { Spinner } from './spinner'
import { cn } from '@/utilities/ui'

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, children, disabled, loading = false, loadingText, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn('relative', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-[inherit]">
            <Spinner size="sm" />
          </div>
        )}
        <span className={cn(loading && 'invisible')}>
          {loading && loadingText ? loadingText : children}
        </span>
      </Button>
    )
  }
)

LoadingButton.displayName = 'LoadingButton'

export { LoadingButton }