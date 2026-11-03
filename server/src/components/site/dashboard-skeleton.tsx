import { Cpu, House } from "lucide-react";
import { cn } from "@/lib/utils";

function Skeleton({ className }: { className: string }) {
  return (
    <div
      className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)}
    />
  );
}

export function ControllersSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading controllers...</span>
      <div aria-hidden="true">
        {Array.from({ length: 2 }, (_, index) => (
          <div className="controller-row" key={index}>
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-4 w-36 max-w-full" />
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="controller-actions">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading your houses and controllers...</span>
      <div className="account-columns" aria-hidden="true">
        <div className="account-card house-panel">
          <div className="account-section-heading">
            <h2>
              <House /> Houses
            </h2>
            <Skeleton className="h-6 w-6" />
          </div>
          <div className="house-list">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="house-option" key={index}>
                <Skeleton className="h-4 w-24 max-w-full flex-1" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
          <div className="account-create">
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="account-card controller-panel">
          <div className="account-section-heading">
            <div>
              <h2>
                <Cpu /> Controllers
              </h2>
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-9" />
          </div>
          <div className="controller-create">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-28" />
          </div>
          <ControllersSkeleton />
        </div>
      </div>
    </div>
  );
}
