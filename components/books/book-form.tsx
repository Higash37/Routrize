"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, Trash2, ImagePlus, ChevronDown, ChevronRight } from "lucide-react";
import type { RegisteredBook, BookChapter, BookSection } from "@/types/book";
import { useSubjectPresets } from "@/hooks/use-subject-presets";

type BookFormProps = {
  book: RegisteredBook | null;
  onSave: (book: RegisteredBook) => void;
  onCancel: () => void;
};

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

function emptyBook(): RegisteredBook {
  return {
    id: crypto.randomUUID(),
    title: "",
    subject: "",
    fields: [],
    targetGrade: "",
    tags: [],
    totalPages: 0,
    chapters: [],
    coverImageUrl: null,
    description: "",
    resources: [],
    createdAt: new Date().toISOString(),
  };
}

type Tab = "info" | "chapters";

export function BookForm({ book, onSave, onCancel }: BookFormProps) {
  const [form, setForm] = useState<RegisteredBook>(book ?? emptyBook());
  const [fieldInput, setFieldInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("info");
  const fileRef = useRef<HTMLInputElement>(null);

  function update(changes: Partial<RegisteredBook>) {
    setForm((prev) => ({ ...prev, ...changes }));
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 200, 280);
    update({ coverImageUrl: dataUrl });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      {/* オーバーレイ + モーダル */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-8"
        onClick={onCancel}
      >
        <div
          className="flex h-full max-h-[640px] w-full max-w-3xl overflow-hidden rounded-lg border bg-white shadow-xl flex-col sm:flex-row"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 左列: 表紙画像（スマホでは非表示） */}
          <div className="hidden sm:flex w-56 shrink-0 flex-col items-center justify-center border-r bg-slate-50 p-6">
            {form.coverImageUrl ? (
              <div className="group relative">
                <img
                  src={form.coverImageUrl}
                  alt=""
                  className="w-full rounded border object-cover"
                  style={{ aspectRatio: "210/297" }}
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => update({ coverImageUrl: null })}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="flex w-full items-center justify-center rounded border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-[#4472C4] hover:text-[#4472C4]"
                style={{ aspectRatio: "210/297" }}
                onClick={() => fileRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs">表紙画像を追加</span>
                  <span className="text-[10px] text-muted-foreground/60">A4比率推奨</span>
                </div>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* 右列: タブ */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* ヘッダー */}
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-sm font-bold text-[#1F3864]">
                {book ? "教材を編集" : "新しい教材を登録"}
              </h2>
              <button
                type="button"
                className="rounded p-1 text-muted-foreground hover:bg-slate-100 transition-colors"
                onClick={onCancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* タブバー */}
            <div className="flex border-b px-5">
              {([
                { key: "info" as Tab, label: "教材情報" },
                { key: "chapters" as Tab, label: "章構成" },
              ]).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`px-4 py-2 text-xs font-medium transition-colors ${
                    tab === t.key
                      ? "border-b-2 border-[#1F3864] text-[#1F3864]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* タブコンテンツ */}
            <div className="flex-1 overflow-y-auto p-5">
              {tab === "info" ? (
                <InfoTab
                  form={form}
                  fieldInput={fieldInput}
                  tagInput={tagInput}
                  onUpdate={update}
                  onFieldInputChange={setFieldInput}
                  onTagInputChange={setTagInput}
                  onTargetGradeChange={(grade) => {
                    // 学年変更時に教科をリセット
                    update({ targetGrade: grade, subject: "" });
                  }}
                />
              ) : (
                <ChaptersTab
                  form={form}
                  expandedChapters={expandedChapters}
                  onUpdate={update}
                  onExpandedChange={setExpandedChapters}
                />
              )}
            </div>

            {/* フッター */}
            <div className="flex justify-end gap-2 border-t px-5 py-3">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onCancel}>
                キャンセル
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-[#1F3864] hover:bg-[#2B5797]"
                disabled={!form.title.trim()}
                onClick={() => onSave(form)}
              >
                {book ? "更新" : "登録"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── 教材情報タブ ─── */

function InfoTab({
  form,
  fieldInput,
  tagInput,
  onUpdate,
  onFieldInputChange,
  onTagInputChange,
  onTargetGradeChange,
}: {
  form: RegisteredBook;
  fieldInput: string;
  tagInput: string;
  onUpdate: (changes: Partial<RegisteredBook>) => void;
  onFieldInputChange: (v: string) => void;
  onTagInputChange: (v: string) => void;
  onTargetGradeChange: (grade: string) => void;
}) {
  const { categories, getSubjects } = useSubjectPresets();
  const subjects = form.targetGrade ? getSubjects(form.targetGrade) : [];

  return (
    <div className="space-y-4">
      {/* タイトル */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">タイトル</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="例: ターゲット1900"
          className="flex h-8 w-full rounded border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 対象学年 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">対象学年</label>
          <select
            value={form.targetGrade}
            onChange={(e) => onTargetGradeChange(e.target.value)}
            className="flex h-8 w-full rounded border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
          >
            <option value="">未設定</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* 教科 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">教科</label>
          {subjects.length > 0 ? (
            <select
              value={form.subject}
              onChange={(e) => onUpdate({ subject: e.target.value })}
              className="flex h-8 w-full rounded border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
            >
              <option value="">選択してください</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={form.subject}
              onChange={(e) => onUpdate({ subject: e.target.value })}
              placeholder="学年を選択すると候補が表示されます"
              className="flex h-8 w-full rounded border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
            />
          )}
        </div>
      </div>

      {/* 総ページ数 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">総ページ数</label>
        <input
          type="number"
          min={0}
          value={form.totalPages || ""}
          onChange={(e) => onUpdate({ totalPages: Math.max(0, Number(e.target.value)) })}
          placeholder="例: 320"
          className="flex h-8 w-28 rounded border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
        />
      </div>

      {/* 分野 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">分野</label>
        <div className="flex flex-wrap gap-1">
          {form.fields.map((f) => (
            <span key={f} className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
              {f}
              <button type="button" className="ml-0.5 text-blue-300 hover:text-blue-700" onClick={() => onUpdate({ fields: form.fields.filter((v) => v !== f) })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            value={fieldInput}
            onChange={(e) => onFieldInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && fieldInput.trim()) {
                e.preventDefault();
                const v = fieldInput.trim();
                if (!form.fields.includes(v)) onUpdate({ fields: [...form.fields, v] });
                onFieldInputChange("");
              }
            }}
            placeholder="例: 単語"
            className="flex h-7 min-w-0 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
          />
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-input text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            onClick={() => {
              if (fieldInput.trim()) {
                const v = fieldInput.trim();
                if (!form.fields.includes(v)) onUpdate({ fields: [...form.fields, v] });
                onFieldInputChange("");
              }
            }}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* タグ */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">タグ</label>
        <div className="flex flex-wrap gap-1">
          {form.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {tag}
              <button type="button" className="ml-0.5 text-slate-400 hover:text-slate-700" onClick={() => onUpdate({ tags: form.tags.filter((t) => t !== tag) })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                e.preventDefault();
                const v = tagInput.trim();
                if (!form.tags.includes(v)) onUpdate({ tags: [...form.tags, v] });
                onTagInputChange("");
              }
            }}
            placeholder="例: 英検2級"
            className="flex h-7 min-w-0 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
          />
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-input text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            onClick={() => {
              if (tagInput.trim()) {
                const v = tagInput.trim();
                if (!form.tags.includes(v)) onUpdate({ tags: [...form.tags, v] });
                onTagInputChange("");
              }
            }}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 章構成タブ ─── */

function ChaptersTab({
  form,
  expandedChapters,
  onUpdate,
  onExpandedChange,
}: {
  form: RegisteredBook;
  expandedChapters: Set<string>;
  onUpdate: (changes: Partial<RegisteredBook>) => void;
  onExpandedChange: (s: Set<string>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {form.chapters.length > 0 ? `${form.chapters.length}章` : "章が未登録です"}
        </span>
        <button
          type="button"
          className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs text-[#4472C4] hover:bg-blue-50 transition-colors"
          onClick={() => {
            const ch: BookChapter = { id: crypto.randomUUID(), title: "", startPage: 0, endPage: 0, sections: [] };
            onUpdate({ chapters: [...form.chapters, ch] });
          }}
        >
          <Plus className="h-3 w-3" />
          章追加
        </button>
      </div>

      {form.chapters.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">「+章追加」で目次構成を作成</p>
      ) : (
        <div className="space-y-1.5">
          {form.chapters.map((ch, chIdx) => {
            const isExpanded = expandedChapters.has(ch.id);
            return (
              <div key={ch.id} className="rounded border border-border/60 bg-slate-50">
                <div className="flex items-center gap-1.5 p-2">
                  <button
                    type="button"
                    className="shrink-0 text-slate-400 hover:text-slate-700"
                    onClick={() => {
                      const s = new Set(expandedChapters);
                      if (isExpanded) s.delete(ch.id); else s.add(ch.id);
                      onExpandedChange(s);
                    }}
                  >
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                  <input
                    type="text"
                    value={ch.title}
                    onChange={(e) => onUpdate({ chapters: form.chapters.map((c) => c.id === ch.id ? { ...c, title: e.target.value } : c) })}
                    placeholder={`第${chIdx + 1}章`}
                    className="h-6 min-w-0 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                  />
                  <div className="flex shrink-0 items-center gap-0.5">
                    <input
                      type="number" min={0}
                      value={ch.startPage || ""}
                      onChange={(e) => onUpdate({ chapters: form.chapters.map((c) => c.id === ch.id ? { ...c, startPage: Math.max(0, Number(e.target.value)) } : c) })}
                      placeholder="0"
                      className="h-6 w-12 rounded border border-input bg-background px-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                    />
                    <span className="text-[10px] text-muted-foreground">~</span>
                    <input
                      type="number" min={0}
                      value={ch.endPage || ""}
                      onChange={(e) => onUpdate({ chapters: form.chapters.map((c) => c.id === ch.id ? { ...c, endPage: Math.max(0, Number(e.target.value)) } : c) })}
                      placeholder="0"
                      className="h-6 w-12 rounded border border-input bg-background px-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                    />
                    <span className="text-[10px] text-muted-foreground">p.</span>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                    onClick={() => onUpdate({ chapters: form.chapters.filter((c) => c.id !== ch.id) })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-border/40 px-2 pb-2 pt-1.5">
                    {ch.sections.map((sec, secIdx) => (
                      <div key={sec.id} className="mt-1 flex items-center gap-1.5 pl-5">
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => onUpdate({ chapters: form.chapters.map((c) => c.id === ch.id ? { ...c, sections: c.sections.map((s) => s.id === sec.id ? { ...s, title: e.target.value } : s) } : c) })}
                          placeholder={`${chIdx + 1}-${secIdx + 1}`}
                          className="h-6 min-w-0 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                        />
                        <div className="flex shrink-0 items-center gap-0.5">
                          <input
                            type="number" min={0}
                            value={sec.startPage || ""}
                            onChange={(e) => onUpdate({ chapters: form.chapters.map((c) => c.id === ch.id ? { ...c, sections: c.sections.map((s) => s.id === sec.id ? { ...s, startPage: Math.max(0, Number(e.target.value)) } : s) } : c) })}
                            placeholder="0"
                            className="h-6 w-12 rounded border border-input bg-background px-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                          />
                          <span className="text-[10px] text-muted-foreground">~</span>
                          <input
                            type="number" min={0}
                            value={sec.endPage || ""}
                            onChange={(e) => onUpdate({ chapters: form.chapters.map((c) => c.id === ch.id ? { ...c, sections: c.sections.map((s) => s.id === sec.id ? { ...s, endPage: Math.max(0, Number(e.target.value)) } : s) } : c) })}
                            placeholder="0"
                            className="h-6 w-12 rounded border border-input bg-background px-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                          />
                          <span className="text-[10px] text-muted-foreground">p.</span>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                          onClick={() => onUpdate({ chapters: form.chapters.map((c) => c.id === ch.id ? { ...c, sections: c.sections.filter((s) => s.id !== sec.id) } : c) })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="mt-1.5 flex items-center gap-0.5 pl-5 text-[10px] text-[#4472C4] hover:underline"
                      onClick={() => {
                        const sec: BookSection = { id: crypto.randomUUID(), title: "", startPage: 0, endPage: 0 };
                        onUpdate({ chapters: form.chapters.map((c) => c.id === ch.id ? { ...c, sections: [...c.sections, sec] } : c) });
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
  );
}
