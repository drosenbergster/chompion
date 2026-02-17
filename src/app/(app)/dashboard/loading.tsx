import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-fade-in">
      {/* Food tabs */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-28 rounded-2xl" />
        <Skeleton className="h-10 w-20 rounded-2xl" />
      </div>

      {/* Stats card */}
      <div className="bg-white rounded-2xl border border-orange-100 p-5">
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-40 mb-5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Top rated */}
      <div className="bg-white rounded-2xl border border-orange-100 p-5">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-7 h-7 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-14 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent entries */}
      <div className="bg-white rounded-2xl border border-orange-100 p-5">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-36 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
