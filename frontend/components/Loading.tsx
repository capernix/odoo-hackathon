'use client';

import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

export default function Loading({ text = 'Loading...', fullScreen = false }: LoadingProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{text}</p>
      </div>
    </div>
  );
}

// Skeleton loader for tables
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div 
              key={j} 
              className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
