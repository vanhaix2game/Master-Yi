// Container query (dùng @container)
export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 @container">
      {children}
    </div>
  );
}

// Aspect ratio
export function AspectRatio({ ratio = 16 / 9, children }: { ratio?: number; children: React.ReactNode }) {
  return (
    <div className="relative" style={{ aspectRatio: ratio }}>
      {children}
    </div>
  );
}
