import { Skeleton } from "./skeleton"
import { cn } from "@/lib/utils"

type LoadingVariant = 'default' | 'card' | 'table' | 'inline' | 'skeleton'

interface LoadingProps {
  height?: string | number
  className?: string
  label?: string
  variant?: LoadingVariant
  count?: number
}

export function Loading({ 
  height = "200px", 
  className = "", 
  label = "Loading...",
  variant = 'default',
  count = 1
}: LoadingProps) {
  const heightValue = typeof height === 'number' ? `${height}px` : height

  const variantStyles = {
    default: 'space-y-2',
    card: 'rounded-lg border p-4 space-y-2',
    table: 'rounded border space-y-2',
    inline: 'inline-flex items-center space-x-2',
    skeleton: 'space-y-4'
  }

  const renderSkeletons = () => {
    return Array.from({ length: count }, (_, i) => (
      <Skeleton 
        key={i}
        className="w-full" 
        style={{ height: heightValue }} 
      />
    ))
  }

  return (
    <div className={cn(
      'animate-pulse',
      variantStyles[variant],
      className
    )}>
      {renderSkeletons()}
      {label && (
        <p className={cn(
          "text-sm text-muted-foreground",
          variant === 'inline' ? 'ml-2' : 'text-center'
        )}>
          {label}
        </p>
      )}
    </div>
  )
}