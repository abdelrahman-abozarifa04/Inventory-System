import { cn } from "../../lib/utils";

const Skeleton = ({ className }) => (
  <div className={cn("animate-pulse rounded-xl surface-strong", className)} />
);

export const SkeletonRows = ({ rows = 5 }) => (
  <div className="divide-y divide-gray-100">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="grid grid-cols-12 gap-4 px-6 py-5">
        <Skeleton className="col-span-4 h-5" />
        <Skeleton className="col-span-2 h-5" />
        <Skeleton className="col-span-2 h-5" />
        <Skeleton className="col-span-4 h-5" />
      </div>
    ))}
  </div>
);

export default Skeleton;
