export function PlanSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Planning your commute">
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card space-y-3 p-4">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-3 w-3/4" />
            </div>
            <div className="skeleton h-8 w-16" />
          </div>
          <div className="skeleton h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
