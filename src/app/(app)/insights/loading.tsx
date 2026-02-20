import { Skeleton } from "@/components/ui/skeleton";

export default function InsightsLoading() {
  return (
    <div className="pb-20 md:pb-8 animate-fade-in">
      <div className="mb-6">
        <Skeleton className="h-7 w-24 mb-1" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="space-y-6">
        {/* Line chart skeleton */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5">
          <Skeleton className="h-5 w-36 mb-1" />
          <Skeleton className="h-3 w-52 mb-4" />
          <Skeleton className="h-56 rounded-xl" />
        </div>

        {/* Two column chart skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-emerald-100 p-5">
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-3 w-40 mb-4" />
            <Skeleton className="h-52 rounded-xl" />
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 p-5">
            <Skeleton className="h-5 w-28 mb-1" />
            <Skeleton className="h-3 w-44 mb-4" />
            <Skeleton className="h-52 rounded-xl" />
          </div>
        </div>

        {/* Radar skeleton */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5">
          <Skeleton className="h-5 w-36 mb-1" />
          <Skeleton className="h-3 w-56 mb-4" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
