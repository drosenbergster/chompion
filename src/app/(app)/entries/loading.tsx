import { Skeleton } from "@/components/ui/skeleton";

export default function EntriesLoading() {
  return (
    <div className="pb-20 md:pb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-7 w-24 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-emerald-100 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Skeleton className="h-5 w-44 mb-2" />
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-8 w-16 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
