import { cn } from "../../lib/utils";

export const TableShell = ({ className, children }) => (
  <div className={cn("overflow-hidden rounded-2xl border border-gray-100 bg-surface shadow-card", className)}>
    {children}
  </div>
);

export const TableScroll = ({ className, children }) => (
  <div className={cn("max-w-full overflow-auto", className)}>{children}</div>
);

export const DataTable = ({ className, children }) => (
  <table className={cn("w-full min-w-[720px] border-separate border-spacing-0 text-sm", className)}>{children}</table>
);

export const Th = ({ className, children, ...props }) => (
  <th className={cn("sticky top-0 z-10 border-b border-gray-100 bg-gray-50/95 px-6 py-4 text-start text-xs font-bold uppercase tracking-wider text-text-muted backdrop-blur", className)} {...props}>
    {children}
  </th>
);

export const Td = ({ className, children, ...props }) => (
  <td className={cn("border-b border-gray-50 px-6 py-5 align-middle text-text", className)} {...props}>{children}</td>
);
