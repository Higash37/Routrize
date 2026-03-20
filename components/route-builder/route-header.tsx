"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Save, LogIn, Pencil, Printer, Menu } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { UserMenuPopover } from "@/components/shared/user-menu-popover";

type RouteHeaderProps = {
  title: string;
  startDate: string;
  months: number;
  onTitleChange: (title: string) => void;
  onStartDateChange: (date: string) => void;
  onMonthsChange: (months: number) => void;
  onMenuOpen: () => void;
  studentName: string;
  studentGrade: string;
  studentSchool: string;
  onStudentNameChange: (v: string) => void;
  onStudentGradeChange: (v: string) => void;
  onStudentSchoolChange: (v: string) => void;
};

export function RouteHeader({
  title,
  startDate,
  months,
  onTitleChange,
  onStartDateChange,
  onMonthsChange,
  onMenuOpen,
  studentName,
  studentGrade,
  studentSchool,
  onStudentNameChange,
  onStudentGradeChange,
  onStudentSchoolChange,
}: RouteHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [paperSize, setPaperSize] = useState<"A4" | "A3">("A4");
  const { isLoggedIn, isLoading } = useAuth();

  function handlePrint() {
    const style = document.createElement("style");
    style.textContent = `@page { size: ${paperSize} landscape; margin: 8mm; }`;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  }

  return (
    <header className="border-b bg-white">
      {/* 1段目: タイトル + ユーザー */}
      <div className="flex h-12 items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-slate-100 transition-colors shrink-0"
            onClick={onMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-base font-bold text-[#1F3864] shrink-0 hidden sm:inline">カリキュラム作成</span>
          <span className="text-border hidden sm:inline">|</span>
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditing(false);
              }}
              className="h-7 w-40 sm:w-56 text-sm border-[#4472C4] focus-visible:ring-[#4472C4]"
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="group flex items-center gap-1.5 rounded px-1.5 py-0.5 text-sm font-medium hover:bg-slate-100 min-w-0"
              onClick={() => setIsEditing(true)}
            >
              <span className="truncate">{title}</span>
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 shrink-0" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLoading ? (
            <div className="h-7 w-[5.5rem] rounded" />
          ) : isLoggedIn ? (
            <UserMenuPopover />
          ) : (
            <Button
              size="sm"
              className="h-7 gap-1.5 text-xs bg-[#1F3864] hover:bg-[#2B5797]"
              asChild
            >
              <Link href="/login">
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">ログイン</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* 2段目: ツールバー（開始月・期間・PDF等） */}
      <div className="flex h-10 items-center gap-2 overflow-x-auto border-t px-4 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <span>開始</span>
          <input
            type="month"
            value={startDate.slice(0, 7)}
            onChange={(e) => onStartDateChange(`${e.target.value}-01`)}
            className="h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
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

        <div className="mx-1 h-5 w-px bg-border shrink-0 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="shrink-0">名前</span>
              <input
                type="text"
                value={studentName ?? ""}
                onChange={(e) => onStudentNameChange(e.target.value)}
                placeholder="生徒名"
                className="h-7 w-24 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="shrink-0">学年</span>
              <select
                value={studentGrade ?? ""}
                onChange={(e) => onStudentGradeChange(e.target.value)}
                className="h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
              >
                <option value="">--</option>
                <option value="小1">小1</option>
                <option value="小2">小2</option>
                <option value="小3">小3</option>
                <option value="小4">小4</option>
                <option value="小5">小5</option>
                <option value="小6">小6</option>
                <option value="中1">中1</option>
                <option value="中2">中2</option>
                <option value="中3">中3</option>
                <option value="高1">高1</option>
                <option value="高2">高2</option>
                <option value="高3">高3</option>
                <option value="既卒">既卒</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="shrink-0">学校</span>
              <input
                type="text"
                value={studentSchool ?? ""}
                onChange={(e) => onStudentSchoolChange(e.target.value)}
                placeholder="学校名"
                className="h-7 w-24 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
              />
            </div>
          </div>

          <div className="mx-1 h-5 w-px bg-border shrink-0" />

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
        </div>
      </div>
    </header>
  );
}
