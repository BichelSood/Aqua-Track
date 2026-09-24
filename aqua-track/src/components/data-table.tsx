import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  getRowId: (row: T) => string;
};

export function DataTable<T>({
  columns,
  rows,
  emptyMessage = "No records found.",
  getRowId,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="glass-panel overflow-x-auto rounded-[1.125rem]">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn("px-4 py-3 font-medium", column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)} className="border-t">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn("px-4 py-3", column.className)}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
