import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortBy: string | undefined;
  currentSortOrder: 'ASC' | 'DESC';
  onSort: (key: string) => void;
  className?: string;
}

export default function SortableHeader({
  label,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSortBy === sortKey;

  return (
    <th
      className={`cursor-pointer select-none px-6 py-3 font-medium text-gray-500 transition-colors hover:text-gray-900 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        {isActive ? (
          currentSortOrder === 'ASC' ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary-600" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-300" />
        )}
      </span>
    </th>
  );
}
