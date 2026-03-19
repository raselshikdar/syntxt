import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonPost() {
  return (
    <div className="border border-border p-5 bg-card rounded-md space-y-3">
      <div className="flex justify-between items-baseline">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-border/50">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-6" />
      </div>
    </div>
  );
}

export function SkeletonPostList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPost key={i} />
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="border border-border rounded-md bg-card overflow-hidden">
      <Skeleton className="h-24 w-full" />
      <div className="px-5 pb-5">
        <div className="flex items-end justify-between -mt-10">
          <Skeleton className="h-20 w-20 rounded-full border-4 border-card" />
          <Skeleton className="h-8 w-24 rounded-md mt-12" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex gap-5 mt-4 pt-3 border-t border-border/50">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonNotification() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-4 w-4 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-3 w-8" />
    </div>
  );
}

export function SkeletonNotificationList({ count = 8 }: { count?: number }) {
  return (
    <div className="border border-border rounded-md bg-card divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonNotification key={i} />
      ))}
    </div>
  );
}
