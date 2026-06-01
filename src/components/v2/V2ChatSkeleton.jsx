// Skeleton elegante mientras peyuBrain responde (río del chat).
export default function V2ChatSkeleton() {
  return (
    <div className="flex gap-2 items-start v2-fade-up">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ background: 'var(--v2-grad-action)' }}>🐢</div>
      <div className="flex flex-col gap-2 w-full max-w-[420px]">
        <div className="v2-skeleton h-4 w-3/4" />
        <div className="v2-skeleton h-4 w-1/2" />
        <div className="grid grid-cols-3 gap-2 mt-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="v2-skeleton aspect-square" />
          ))}
        </div>
      </div>
    </div>
  );
}