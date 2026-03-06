"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Save, LogIn, Pencil, Printer, Menu } from "lucide-react";

type RouteHeaderProps = {
  title: string;
  startDate: string;
  months: number;
  onTitleChange: (title: string) => void;
  onStartDateChange: (date: string) => void;
  onMonthsChange: (months: number) => void;
  onMenuOpen: () => void;
};

export function RouteHeader({
  title,
  startDate,
  months,
  onTitleChange,
  onStartDateChange,
  onMonthsChange,
  onMenuOpen,
}: RouteHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [paperSize, setPaperSize] = useState<"A4" | "A3">("A4");

  function handlePrint() {
    const style = document.createElement("style");
    style.textContent = `@page { size: ${paperSize} landscape; margin: 8mm; }`;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  }

  return (
    <header className="border-b bg-white">
      <div className="flex h-12 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-slate-100 transition-colors"
            onClick={onMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-base font-bold text-[#1F3864]">カリキュラム作成</span>
          <span className="text-border">|</span>
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditing(false);
              }}
              className="h-7 w-56 text-sm border-[#4472C4] focus-visible:ring-[#4472C4]"
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="group flex items-center gap-1.5 rounded px-1.5 py-0.5 text-sm font-medium hover:bg-slate-100"
              onClick={() => setIsEditing(true)}
            >
              {title}
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 開始月 */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>開始</span>
            <input
              type="month"
              value={startDate.slice(0, 7)}
              onChange={(e) => onStartDateChange(`${e.target.value}-01`)}
              className="h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
            />
          </div>

          {/* 期間 */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>期間</span>
            <select
              value={months}
              onChange={(e) => onMonthsChange(Number(e.target.value))}
              className="h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
            >
              {[1, 3, 6, 9, 12, 15, 18, 24].map((m) => (
                <option key={m} value={m}>
                  {m}ヶ月
                </option>
              ))}
            </select>
          </div>

          <div className="mx-1 h-5 w-px bg-border" />

          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" disabled>
            <FileText className="h-3.5 w-3.5" />
            PDF
          </Button>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" disabled>
            <Save className="h-3.5 w-3.5" />
            保存
          </Button>
          <select
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value as "A4" | "A3")}
            className="h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
          >
            <option value="A4">A4</option>
            <option value="A3">A3</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handlePrint}
          >
            <Printer className="h-3.5 w-3.5" />
            印刷
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs bg-[#1F3864] hover:bg-[#2B5797]"
            disabled
          >
            <LogIn className="h-3.5 w-3.5" />
            ログイン
          </Button>
        </div>
      </div>
    </header>
  );
}
