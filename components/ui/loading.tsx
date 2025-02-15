import { Skeleton } from "./skeleton"
import { cn } from "@/lib/utils"

type LoadingVariant = 'default' | 'card' | 'table' | 'inline'

interface LoadingProps {
  height?: string | number
  className?: string
  label?: string
  variant?: LoadingVariant
}

export function Loading({ 
  height = "200px", 
  className = "", 
  label = "Loading...",
  variant = 'default'
}: LoadingProps) {
  const heightValue = typeof height === 'number' ? `${height}px` : height

  const variantStyles = {
    default: 'space-y-2',
    card: 'rounded-lg border p-4 space-y-2',
    table: 'rounded border space-y-2',
    inline: 'inline-flex items-center space-x-2'
  }

  return (
    <div className={cn(
      'animate-pulse',
      variantStyles[variant],
      className
    )}>
      <Skeleton 
        className="w-full" 
        style={{ height: heightValue }} 
      />
      {label && (
        <p className="text-sm text-muted-foreground text-center">
          {label}
        </p>
      )}
    </div>
  )
}