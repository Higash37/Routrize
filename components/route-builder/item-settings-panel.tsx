"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, ImagePlus, Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { shortDate } from "@/lib/date-utils";
import type { RouteItemState, RouteItemUpdatable, SubTask, BookChapter, BookSection } from "@/types/route-builder";
import { getSubTaskSize } from "@/types/route-builder";
import { ColorPickerPopover } from "./color-picker-popover";
import { useSubjectPresets } from "@/hooks/use-subject-presets";

type ItemSettingsPanelProps = {
  item: RouteItemState;
  routeStartDate: string;
  routeEndDate: string;
  onUpdate: (changes: RouteItemUpdatable) => void;
  onClose: () => void;
};

/** 画像をリサイズしてdata URLにする（localStorage容量節約） */
function resizeImage(file: File, maxW: number, maxH: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas not supported"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Tab = "info" | "goal" | "task";

const TABS: { key: Tab; label: string }[] = [
  { key: "info", label: "教材情報" },
  { key: "goal", label: "期間・目標" },
  { key: "task", label: "タスク管理" },
];

export function ItemSettingsPanel({
  item,
  routeStartDate,
  routeEndDate,
  onUpdate,
  onClose,
}: ItemSettingsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState("");
  const [fieldInput, setFieldInput] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const { categories, getSubjects } = useSubjectPresets();

  // 対象学年に応じた教科候補
  const subjectOptions = item.targetGrade ? getSubjects(item.targetGrade) : [];

  const days = Math.round(
    (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 200, 280);
    onUpdate({ coverImageUrl: dataUrl });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex w-full md:w-72 shrink-0 flex-col border-l bg-white">
      {/* ヘッダー */}
      <div className="shrink-0 border-b bg-[#1F3864]">
        <div className="flex h-8 items-center justify-between border-b border-[#2B5797] px-3">
          <span className="text-sm font-semibold text-white truncate">{item.title}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 text-white/70 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {/* タブ */}
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={cn(
                "flex-1 py-2 text-xs font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-white text-[#1F3864]"
                  : "text-white/60 hover:text-white hover:bg-white/10",
              )}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {activeTab === "info" && (
          <>
            {/* 対象学年 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                対象学年
              </label>
              <select
                value={item.targetGrade}
                onChange={(e) => onUpdate({ targetGrade: e.target.value })}
                className="flex h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
              >
                <option value="">未設定</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* 教科 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                教科
              </label>
              {subjectOptions.length > 0 ? (
                <>
                  <select
                    value={subjectOptions.includes(item.subject) ? item.subject : ""}
                    onChange={(e) => {
                      if (e.target.value) onUpdate({ subject: e.target.value });
                    }}
                    className="flex h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                  >
                    <option value="">選択してください</option>
                    {subjectOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={item.subject}
                    onChange={(e) => onUpdate({ subject: e.target.value })}
                    placeholder="または手入力"
                    className="flex h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                  />
                </>
              ) : (
                <input
                  type="text"
                  value={item.subject}
                  onChange={(e) => onUpdate({ subject: e.target.value })}
                  placeholder="例: 英語"
                  className="flex h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                />
              )}
            </div>

            {/* 分野 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                分野
              </label>
              <div className="flex flex-wrap gap-1">
                {item.fields.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700"
                  >
                    {f}
                    <button
                      type="button"
                      className="ml-0.5 text-blue-300 hover:text-blue-700"
                      onClick={() =>
                        onUpdate({ fields: item.fields.filter((v) => v !== f) })
                      }
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={fieldInput}
                  onChange={(e) => setFieldInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && fieldInput.trim()) {
                      e.preventDefault();
                      const v = fieldInput.trim();
                      if (!item.fields.includes(v)) {
                        onUpdate({ fields: [...item.fields, v] });
                      }
                      setFieldInput("");
                    }
                  }}
                  placeholder="例: 単語"
                  className="flex h-6 min-w-0 flex-1 rounded border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                />
                <button
                  type="button"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-input text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  onClick={() => {
                    if (fieldInput.trim()) {
                      const v = fieldInput.trim();
                      if (!item.fields.includes(v)) {
                        onUpdate({ fields: [...item.fields, v] });
                      }
                      setFieldInput("");
                    }
                  }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* 色 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                色
              </label>
              <ColorPickerPopover
                value={item.color}
                onChange={(color) => onUpdate({ color })}
              />
            </div>

            {/* タグ */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                タグ
              </label>
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
                  >
                    {tag}
                    <button
                      type="button"
                      className="ml-0.5 text-slate-400 hover:text-slate-700"
                      onClick={() =>
                        onUpdate({ tags: item.tags.filter((t) => t !== tag) })
                      }
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      e.preventDefault();
                      const newTag = tagInput.trim();
                      if (!item.tags.includes(newTag)) {
                        onUpdate({ tags: [...item.tags, newTag] });
                      }
                      setTagInput("");
                    }
                  }}
                  placeholder="例: 英検2級"
                  className="flex h-6 min-w-0 flex-1 rounded border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                />
                <button
                  type="button"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-input text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  onClick={() => {
                    if (tagInput.trim()) {
                      const newTag = tagInput.trim();
                      if (!item.tags.includes(newTag)) {
                        onUpdate({ tags: [...item.tags, newTag] });
                      }
                      setTagInput("");
                    }
                  }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* 表紙画像 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                表紙画像
              </label>
              {item.coverImageUrl ? (
                <div className="relative group">
                  <img
                    src={item.coverImageUrl}
                    alt={item.title}
                    className="h-24 w-auto rounded border object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 rounded bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => onUpdate({ coverImageUrl: null })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="flex h-24 w-16 items-center justify-center rounded border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-[#4472C4] hover:text-[#4472C4]"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            {/* 総ページ数 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                総ページ数
              </label>
              <input
                type="number"
                min={0}
                value={item.totalPages || ""}
                onChange={(e) => onUpdate({ totalPages: Math.max(0, Number(e.target.value)) })}
                placeholder="例: 320"
                className="flex h-7 w-24 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
              />
            </div>

            {/* 章構成 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-muted-foreground">
                  章構成
                </label>
                <button
                  type="button"
                  className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-[#4472C4] hover:bg-blue-50 transition-colors"
                  onClick={() => {
                    const newChapter: BookChapter = {
                      id: crypto.randomUUID(),
                      title: "",
                      startPage: 0,
                      endPage: 0,
                      sections: [],
                    };
                    onUpdate({ chapters: [...item.chapters, newChapter] });
                  }}
                >
                  <Plus className="h-3 w-3" />
                  章追加
                </button>
              </div>

              {item.chapters.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">
                  「+章追加」で目次構成を作成
                </p>
              ) : (
                <div className="space-y-1">
                  {item.chapters.map((ch, chIdx) => {
                    const isExpanded = expandedChapters.has(ch.id);
                    return (
                      <div key={ch.id} className="rounded border border-border/60 bg-slate-50">
                        {/* 章ヘッダー */}
                        <div className="flex items-center gap-1 p-1.5">
                          <button
                            type="button"
                            className="shrink-0 text-slate-400 hover:text-slate-700"
                            onClick={() => {
                              const next = new Set(expandedChapters);
                              if (isExpanded) next.delete(ch.id);
                              else next.add(ch.id);
                              setExpandedChapters(next);
                            }}
                          >
                            {isExpanded
                              ? <ChevronDown className="h-3 w-3" />
                              : <ChevronRight className="h-3 w-3" />}
                          </button>
                          <input
                            type="text"
                            value={ch.title}
                            onChange={(e) =>
                              onUpdate({
                                chapters: item.chapters.map((c) =>
                                  c.id === ch.id ? { ...c, title: e.target.value } : c,
                                ),
                              })
                            }
                            placeholder={`第${chIdx + 1}章`}
                            className="h-5 min-w-0 flex-1 rounded border border-input bg-background px-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                          />
                          <div className="flex shrink-0 items-center gap-0.5">
                            <input
                              type="number"
                              min={0}
                              value={ch.startPage || ""}
                              onChange={(e) =>
                                onUpdate({
                                  chapters: item.chapters.map((c) =>
                                    c.id === ch.id ? { ...c, startPage: Math.max(0, Number(e.target.value)) } : c,
                                  ),
                                })
                              }
                              placeholder="0"
                              className="h-5 w-10 rounded border border-input bg-background px-1 text-[10px] text-right focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                            />
                            <span className="text-[9px] text-muted-foreground">~</span>
                            <input
                              type="number"
                              min={0}
                              value={ch.endPage || ""}
                              onChange={(e) =>
                                onUpdate({
                                  chapters: item.chapters.map((c) =>
                                    c.id === ch.id ? { ...c, endPage: Math.max(0, Number(e.target.value)) } : c,
                                  ),
                                })
                              }
                              placeholder="0"
                              className="h-5 w-10 rounded border border-input bg-background px-1 text-[10px] text-right focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                            />
                            <span className="text-[9px] text-muted-foreground">p.</span>
                          </div>
                          <button
                            type="button"
                            className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                            onClick={() =>
                              onUpdate({ chapters: item.chapters.filter((c) => c.id !== ch.id) })
                            }
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>

                        {/* セクション */}
                        {isExpanded && (
                          <div className="border-t border-border/40 px-1.5 pb-1.5 pt-1">
                            {ch.sections.map((sec, secIdx) => (
                              <div key={sec.id} className="mt-1 flex items-center gap-1 pl-4">
                                <input
                                  type="text"
                                  value={sec.title}
                                  onChange={(e) =>
                                    onUpdate({
                                      chapters: item.chapters.map((c) =>
                                        c.id === ch.id
                                          ? {
                                              ...c,
                                              sections: c.sections.map((s) =>
                                                s.id === sec.id ? { ...s, title: e.target.value } : s,
                                              ),
                                            }
                                          : c,
                                      ),
                                    })
                                  }
                                  placeholder={`${chIdx + 1}-${secIdx + 1}`}
                                  className="h-5 min-w-0 flex-1 rounded border border-input bg-background px-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                                />
                                <div className="flex shrink-0 items-center gap-0.5">
                                  <input
                                    type="number"
                                    min={0}
                                    value={sec.startPage || ""}
                                    onChange={(e) =>
                                      onUpdate({
                                        chapters: item.chapters.map((c) =>
                                          c.id === ch.id
                                            ? {
                                                ...c,
                                                sections: c.sections.map((s) =>
                                                  s.id === sec.id ? { ...s, startPage: Math.max(0, Number(e.target.value)) } : s,
                                                ),
                                              }
                                            : c,
                                        ),
                                      })
                                    }
                                    placeholder="0"
                                    className="h-5 w-10 rounded border border-input bg-background px-1 text-[10px] text-right focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                                  />
                                  <span className="text-[9px] text-muted-foreground">~</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={sec.endPage || ""}
                                    onChange={(e) =>
                                      onUpdate({
                                        chapters: item.chapters.map((c) =>
                                          c.id === ch.id
                                            ? {
                                                ...c,
                                                sections: c.sections.map((s) =>
                                                  s.id === sec.id ? { ...s, endPage: Math.max(0, Number(e.target.value)) } : s,
                                                ),
                                              }
                                            : c,
                                        ),
                                      })
                                    }
                                    placeholder="0"
                                    className="h-5 w-10 rounded border border-input bg-background px-1 text-[10px] text-right focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                                  />
                                  <span className="text-[9px] text-muted-foreground">p.</span>
                                </div>
                                <button
                                  type="button"
                                  className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                                  onClick={() =>
                                    onUpdate({
                                      chapters: item.chapters.map((c) =>
                                        c.id === ch.id
                                          ? { ...c, sections: c.sections.filter((s) => s.id !== sec.id) }
                                          : c,
                                      ),
                                    })
                                  }
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="mt-1 flex items-center gap-0.5 pl-4 text-[9px] text-[#4472C4] hover:underline"
                              onClick={() => {
                                const newSec: BookSection = {
                                  id: crypto.randomUUID(),
                                  title: "",
                                  startPage: 0,
                                  endPage: 0,
                                };
                                onUpdate({
                                  chapters: item.chapters.map((c) =>
                                    c.id === ch.id
                                      ? { ...c, sections: [...c.sections, newSec] }
                                      : c,
                                  ),
                                });
                              }}
                            >
                              <Plus className="h-2.5 w-2.5" />
                              節追加
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-8" />
          </>
        )}

        {activeTab === "goal" && (
          <>
            {/* 開始日 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                開始日
              </label>
              <input
                type="date"
                value={item.startDate}
                min={routeStartDate}
                max={item.endDate}
                onChange={(e) => {
                  if (e.target.value && e.target.value <= item.endDate) {
                    onUpdate({ startDate: e.target.value });
                  }
                }}
                className="flex h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
              />
            </div>

            {/* 終了日 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                終了日
              </label>
              <input
                type="date"
                value={item.endDate}
                min={item.startDate}
                max={routeEndDate}
                onChange={(e) => {
                  if (e.target.value && e.target.value >= item.startDate) {
                    onUpdate({ endDate: e.target.value });
                  }
                }}
                className="flex h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
              />
            </div>

            <div className="rounded bg-slate-50 px-2.5 py-2 text-[11px] text-[#1F3864]">
              <span className="font-medium">{shortDate(item.startDate)}</span>
              <span className="text-muted-foreground"> 〜 </span>
              <span className="font-medium">{shortDate(item.endDate)}</span>
              <span className="text-muted-foreground ml-1">({days}日間)</span>
            </div>

            {/* 難易度 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                実施難易度
              </label>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="text-base leading-none transition-colors"
                    onClick={() => onUpdate({ difficulty: n })}
                  >
                    <span className={n <= item.difficulty ? "text-amber-500" : "text-slate-200"}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 重要度 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                重要度
              </label>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="text-base leading-none transition-colors"
                    onClick={() => onUpdate({ importance: n })}
                  >
                    <span className={n <= item.importance ? "text-rose-400" : "text-slate-200"}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 目標周回数 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                目標周回数
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={item.targetRounds}
                onChange={(e) => onUpdate({ targetRounds: Math.max(1, Number(e.target.value)) })}
                className="flex h-7 w-16 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
              />
            </div>

            {/* 目的・メモ */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                目的・メモ
              </label>
              <textarea
                value={item.memo}
                onChange={(e) => onUpdate({ memo: e.target.value })}
                placeholder="例: 基礎語彙の定着。毎日100語ペースで進める"
                rows={3}
                className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4] resize-none"
              />
            </div>
          </>
        )}

        {activeTab === "task" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-[#1F3864]">
                タスク分割
              </p>
              <button
                type="button"
                className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-[#4472C4] hover:bg-blue-50 transition-colors"
                onClick={() => {
                  const newSub: SubTask = {
                    id: crypto.randomUUID(),
                    label: "",
                    startDate: item.startDate,
                    endDate: item.endDate,
                  };
                  onUpdate({ subtasks: [...item.subtasks, newSub] });
                }}
              >
                <Plus className="h-3 w-3" />
                追加
              </button>
            </div>

            <div className="rounded bg-slate-50 px-2 py-1.5 text-[10px] text-muted-foreground space-y-0.5">
              <p><span className="font-medium text-rose-600">大</span>：常に表示（〜3ヶ月）</p>
              <p><span className="font-medium text-amber-600">中</span>：6ヶ月以下で表示（〜1ヶ月）</p>
              <p><span className="font-medium text-sky-600">小</span>：3ヶ月以下で表示（〜2週間）</p>
            </div>

            {item.subtasks.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">
                「+追加」で範囲ごとのタスクを作成
              </p>
            ) : (
              <div className="space-y-2">
                {item.subtasks.map((sub, idx) => (
                  <div key={sub.id} className="rounded border border-border/60 bg-slate-50 p-2">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-slate-500">#{idx + 1}</span>
                        {/* 自動判定バッジ */}
                        {(() => {
                          const sz = getSubTaskSize(sub.startDate, sub.endDate);
                          return (
                            <span
                              className={cn(
                                "h-4 rounded border px-1 text-[8px] font-bold leading-none inline-flex items-center",
                                sz === "sm" ? "bg-sky-100 text-sky-700 border-sky-400"
                                : sz === "md" ? "bg-amber-100 text-amber-700 border-amber-400"
                                : "bg-rose-100 text-rose-700 border-rose-400",
                              )}
                            >
                              {sz === "sm" ? "小" : sz === "md" ? "中" : "大"}
                            </span>
                          );
                        })()}
                      </div>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        onClick={() =>
                          onUpdate({ subtasks: item.subtasks.filter((s) => s.id !== sub.id) })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {/* 章・節から選択 or 自由入力 */}
                    {item.chapters.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          if (!e.target.value) return;
                          onUpdate({
                            subtasks: item.subtasks.map((s) =>
                              s.id === sub.id ? { ...s, label: e.target.value } : s,
                            ),
                          });
                        }}
                        className="mb-1 flex h-6 w-full rounded border border-input bg-background px-1 text-[10px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                      >
                        <option value="">章・節から選択...</option>
                        {item.chapters.map((ch, ci) => (
                          <optgroup key={ch.id} label={ch.title || `第${ci + 1}章`}>
                            <option value={`${ch.title || `第${ci + 1}章`}${ch.startPage ? ` (${ch.startPage}~${ch.endPage}p.)` : ""}`}>
                              {ch.title || `第${ci + 1}章`}{ch.startPage ? ` ${ch.startPage}~${ch.endPage}p.` : ""}
                            </option>
                            {ch.sections.map((sec, si) => (
                              <option
                                key={sec.id}
                                value={`${sec.title || `${ci + 1}-${si + 1}`}${sec.startPage ? ` (${sec.startPage}~${sec.endPage}p.)` : ""}`}
                              >
                                {sec.title || `${ci + 1}-${si + 1}`}{sec.startPage ? ` ${sec.startPage}~${sec.endPage}p.` : ""}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      value={sub.label}
                      onChange={(e) =>
                        onUpdate({
                          subtasks: item.subtasks.map((s) =>
                            s.id === sub.id ? { ...s, label: e.target.value } : s,
                          ),
                        })
                      }
                      placeholder="例: 1-600, 第1章〜第3章"
                      className="mb-1.5 flex h-6 w-full rounded border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                    />
                    <div className="flex items-center gap-1 text-[10px]">
                      <input
                        type="date"
                        value={sub.startDate}
                        min={item.startDate}
                        max={sub.endDate}
                        onChange={(e) => {
                          if (e.target.value && e.target.value <= sub.endDate) {
                            onUpdate({
                              subtasks: item.subtasks.map((s) =>
                                s.id === sub.id ? { ...s, startDate: e.target.value } : s,
                              ),
                            });
                          }
                        }}
                        className="h-6 w-0 min-w-0 flex-1 rounded border border-input bg-background px-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                      />
                      <span className="text-muted-foreground">〜</span>
                      <input
                        type="date"
                        value={sub.endDate}
                        min={sub.startDate}
                        max={item.endDate}
                        onChange={(e) => {
                          if (e.target.value && e.target.value >= sub.startDate) {
                            onUpdate({
                              subtasks: item.subtasks.map((s) =>
                                s.id === sub.id ? { ...s, endDate: e.target.value } : s,
                              ),
                            });
                          }
                        }}
                        className="h-6 w-0 min-w-0 flex-1 rounded border border-input bg-background px-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
