"use client";

import { useEffect, useState } from "react";
import { Clock, Users } from "lucide-react";

export default function DashboardPage() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const dateStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getDate().toString().padStart(2, "0")}`;
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const dayOfWeek = dayNames[now.getDay()];

  return (
    <div className="flex h-[calc(100vh-7rem)] items-center justify-center gap-4">
      {/* 時計 */}
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border bg-white p-4 shadow-sm self-stretch">
        <Clock className="mb-1 h-4 w-4 text-slate-400" />
        <p className="font-mono text-3xl font-bold tracking-tight text-[#1F3864] sm:text-4xl">
          {hours}:{minutes}
          <span className="text-xl text-slate-400 sm:text-2xl">:{seconds}</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {dateStr}（{dayOfWeek}）
        </p>
      </div>

      {/* 今日いる人 */}
      <div className="flex flex-1 flex-col rounded-xl border bg-white p-4 shadow-sm self-stretch">
        <div className="mb-2 flex items-center gap-1.5">
          <Users className="h-4 w-4 text-slate-400" />
          <h2 className="text-xs font-semibold text-slate-700">今日の出席</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-muted-foreground">準備中</p>
        </div>
      </div>
    </div>
  );
}
