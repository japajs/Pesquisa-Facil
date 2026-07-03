import { Skeleton } from "@/components/ui/skeleton"

export default function CondominioDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 pt-8">
      <Skeleton className="h-4 w-28" />

      <Skeleton className="h-8 w-56" />

      <Skeleton className="h-28 rounded-xl" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  )
}
