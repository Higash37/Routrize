export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-32 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="h-10 w-full rounded bg-slate-100 animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 w-full rounded bg-slate-100 animate-pulse" />
          <div className="h-10 w-full rounded bg-slate-100 animate-pulse" />
          <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
