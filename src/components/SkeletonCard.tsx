/**
 * Skeleton loading cards for smooth loading experience
 */

interface SkeletonCardProps {
  viewMode?: 'grid' | 'list'
}

export default function SkeletonCard({ viewMode = 'grid' }: SkeletonCardProps) {
  if (viewMode === 'list') {
    return (
      <div className="glass-card p-4 sm:p-5 animate-pulse">
        <div className="flex gap-4 sm:gap-6">
          {/* Image skeleton */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl bg-surface-200 dark:bg-surface-700"></div>

          {/* Content skeleton */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded-lg w-3/4 mb-2"></div>
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded-lg w-full"></div>
              </div>
              <div className="h-5 w-12 bg-surface-200 dark:bg-surface-700 rounded-lg"></div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-4"></div>
              <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-32"></div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded-lg w-20"></div>
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-16"></div>
              </div>
              <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded-xl w-32"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view skeleton
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="relative h-52 bg-surface-200 dark:bg-surface-700">
        <div className="absolute top-3 right-3 h-6 w-20 bg-surface-300 dark:bg-surface-600 rounded-full"></div>
        <div className="absolute bottom-3 left-3 h-7 w-28 bg-surface-300 dark:bg-surface-600 rounded-full"></div>
      </div>

      {/* Content skeleton */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded-lg w-3/4"></div>
          <div className="h-6 w-14 bg-surface-200 dark:bg-surface-700 rounded-lg"></div>
        </div>

        <div className="space-y-2">
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full"></div>
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-4/5"></div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-surface-200 dark:bg-surface-700 rounded"></div>
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-32"></div>
        </div>

        <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
          <div className="flex justify-between items-end">
            <div>
              <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-16 mb-2"></div>
              <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded-lg w-24"></div>
            </div>
            <div>
              <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-12 mb-2"></div>
              <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded-lg w-16"></div>
            </div>
          </div>
        </div>

        <div className="h-12 bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
      </div>
    </div>
  )
}

// Multiple skeletons for grid/list
export function SkeletonGrid({ count = 6, viewMode = 'grid' }: { count?: number; viewMode?: 'grid' | 'list' }) {
  return (
    <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="animate-slide-up"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <SkeletonCard viewMode={viewMode} />
        </div>
      ))}
    </div>
  )
}

// Stats skeleton for dashboard
export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-4 text-center">
          <div className="w-10 h-10 bg-surface-200 dark:bg-surface-700 rounded-xl mx-auto mb-2"></div>
          <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded-lg w-16 mx-auto mb-2"></div>
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-20 mx-auto"></div>
        </div>
      ))}
    </div>
  )
}
