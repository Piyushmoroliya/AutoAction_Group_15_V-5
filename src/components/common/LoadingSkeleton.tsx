import { cn } from '../../utils/cn';

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-navy-200 dark:bg-navy-700', className)}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-navy-200 bg-white p-6 dark:border-navy-700 dark:bg-navy-800">
      <LoadingSkeleton className="h-4 w-3/4 mb-4" />
      <LoadingSkeleton className="h-3 w-1/2 mb-2" />
      <LoadingSkeleton className="h-3 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border border-navy-200 rounded-lg dark:border-navy-700">
          <LoadingSkeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton className="h-4 w-3/4" />
            <LoadingSkeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
