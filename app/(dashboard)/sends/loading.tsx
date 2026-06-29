import { Skeleton } from "@/components/ui/skeleton"

export default function SendsLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-1.5 h-4 w-44" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-3">
          <div className="grid grid-cols-4 gap-4">
            {["Cliente", "Pesquisa", "Status", "Enviado em"].map((col) => (
              <Skeleton key={col} className="h-4 w-16" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-border/60 px-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-40" />
              </div>
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
