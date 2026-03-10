export default function Loading() {
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* ヘッダー スケルトン */}
      <div className="flex h-14 items-center gap-3 border-b bg-white px-4">
        <div className="h-5 w-5 rounded bg-slate-200" />
        <div className="h-5 w-32 rounded bg-slate-200 animate-pulse" />
        <div className="flex-1" />
        <div className="h-8 w-20 rounded bg-slate-200 animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
      </div>

      {/* コンテンツ スケルトン */}
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー（PC） */}
        <div className="hidden md:flex w-56 flex-col gap-3 border-r bg-white p-4">
          <div className="h-8 w-full rounded bg-slate-200 animate-pulse" />
          <div className="h-12 w-full rounded bg-slate-100 animate-pulse" />
          <div className="h-12 w-full rounded bg-slate-100 animate-pulse" />
        </div>

        {/* ガント エリア */}
        <div className="flex-1 p-4">
          <div className="h-full rounded-lg border bg-white" />
        </div>
      </div>
    </div>
  );
}
