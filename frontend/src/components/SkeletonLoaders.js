// Skeleton loader components
export const ProfileCardSkeleton = () => (
  <div className="glass-card rounded-2xl p-6 animate-pulse">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-16 h-16 rounded-xl bg-muted" />
      <div className="flex-1">
        <div className="h-5 bg-muted rounded w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    </div>
    <div className="h-10 bg-muted rounded mb-4" />
    <div className="flex gap-2 mb-4">
      <div className="h-6 bg-muted rounded w-16" />
      <div className="h-6 bg-muted rounded w-20" />
      <div className="h-6 bg-muted rounded w-16" />
    </div>
    <div className="h-16 bg-muted rounded mb-4" />
    <div className="h-10 bg-muted rounded" />
  </div>
);

export const SearchBarSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-muted rounded w-48 mb-2" />
    <div className="h-5 bg-muted rounded w-64 mb-6" />
    <div className="h-14 bg-muted rounded-2xl mb-6" />
    <div className="flex gap-3">
      <div className="h-10 bg-muted rounded-full w-24" />
      <div className="h-10 bg-muted rounded-full w-32" />
      <div className="h-10 bg-muted rounded-full w-28" />
    </div>
  </div>
);
