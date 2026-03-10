export default function Loading() {
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <div className="flex h-14 items-center gap-3 border-b bg-white px-4">
        <div className="h-5 w-5 rounded bg-slate-200" />
        <div className="h-5 w-24 rounded bg-slate-200 animate-pulse" />
        <div className="flex-1" />
        <div className="h-8 w-24 rounded bg-slate-200 animate-pulse" />
      </div>
      <div className="mx-auto w-full max-w-3xl p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border bg-white p-4">
            <div className="h-16 w-12 rounded bg-slate-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
