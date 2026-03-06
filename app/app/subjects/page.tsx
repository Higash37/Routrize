"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, X, ChevronDown, ChevronRight, Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLOR_PALETTE } from "@/lib/constants";
import {
  DEFAULT_SUBJECT_PRESETS,
  GRADE_CATEGORIES,
  type GradeCategory,
  type SubjectPreset,
} from "@/lib/subject-presets";

const SUBJECTS_KEY = "routrize:custom-subjects";
const COLORS_KEY = "routrize:subject-colors";

type CustomSubjects = Record<string, string[]>;
type SubjectColors = Record<string, string>;

function loadCustomSubjects(): CustomSubjects {
  try {
    const raw = localStorage.getItem(SUBJECTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCustomSubjects(data: CustomSubjects) {
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify(data));
}

function loadSubjectColors(): SubjectColors {
  try {
    const raw = localStorage.getItem(COLORS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSubjectColors(data: SubjectColors) {
  localStorage.setItem(COLORS_KEY, JSON.stringify(data));
}

/** プリセット + カスタムをマージ */
function mergeSubjects(
  presets: SubjectPreset[],
  custom: CustomSubjects,
): SubjectPreset[] {
  return GRADE_CATEGORIES.map((cat) => {
    const preset = presets.find((p) => p.category === cat);
    const base = preset?.subjects ?? [];
    const added = custom[cat] ?? [];
    return {
      category: cat,
      subjects: [...base, ...added.filter((s) => !base.includes(s))],
    };
  });
}

/** 色のコントラストに応じて白 or 黒テキストを返す */
function contrastText(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

export default function SubjectsPage() {
  const [custom, setCustom] = useState<CustomSubjects>({});
  const [colors, setColors] = useState<SubjectColors>({});
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addingTo, setAddingTo] = useState<GradeCategory | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustom(loadCustomSubjects());
    setColors(loadSubjectColors());
    const init: Record<string, boolean> = {};
    for (const cat of GRADE_CATEGORIES) init[cat] = true;
    setExpanded(init);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (addingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingTo]);

  if (!loaded) return null;

  const merged = mergeSubjects(DEFAULT_SUBJECT_PRESETS, custom);

  function handleAdd(category: GradeCategory) {
    const value = newSubject.trim();
    if (!value) return;

    const preset = DEFAULT_SUBJECT_PRESETS.find((p) => p.category === category);
    const baseSubjects = preset?.subjects ?? [];
    const customList = custom[category] ?? [];

    if (baseSubjects.includes(value) || customList.includes(value)) {
      setNewSubject("");
      return;
    }

    const next = { ...custom, [category]: [...customList, value] };
    setCustom(next);
    saveCustomSubjects(next);
    setNewSubject("");
  }

  function handleRemoveCustom(category: GradeCategory, subject: string) {
    const customList = custom[category] ?? [];
    const next = {
      ...custom,
      [category]: customList.filter((s) => s !== subject),
    };
    setCustom(next);
    saveCustomSubjects(next);
  }

  function handleColorChange(subject: string, color: string) {
    const next = { ...colors, [subject]: color };
    setColors(next);
    saveSubjectColors(next);
  }

  function isCustomSubject(category: GradeCategory, subject: string): boolean {
    return (custom[category] ?? []).includes(subject);
  }

  function toggleExpand(category: string) {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">教科タグ管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          学生区分ごとの教科を管理します。タグをクリックで色を変更、カスタム教科の追加・削除もできます。
        </p>
      </div>

      <div className="space-y-3">
        {merged.map((group) => {
          const isOpen = expanded[group.category] ?? false;

          return (
            <div
              key={group.category}
              className="rounded-lg border bg-white"
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                onClick={() => toggleExpand(group.category)}
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-semibold">{group.category}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {group.subjects.length}教科
                </span>
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {group.subjects.map((subject) => (
                      <SubjectTag
                        key={subject}
                        subject={subject}
                        color={colors[subject]}
                        isCustom={isCustomSubject(group.category, subject)}
                        onColorChange={(c) => handleColorChange(subject, c)}
                        onRemove={
                          isCustomSubject(group.category, subject)
                            ? () => handleRemoveCustom(group.category, subject)
                            : undefined
                        }
                      />
                    ))}
                  </div>

                  {addingTo === group.category ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAdd(group.category);
                          }
                          if (e.key === "Escape") {
                            setAddingTo(null);
                            setNewSubject("");
                          }
                        }}
                        placeholder="教科名を入力"
                        className="flex h-8 min-w-0 flex-1 rounded border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                      />
                      <Button
                        size="sm"
                        className="h-8 bg-[#1F3864] hover:bg-[#2B5797]"
                        onClick={() => handleAdd(group.category)}
                      >
                        追加
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => {
                          setAddingTo(null);
                          setNewSubject("");
                        }}
                      >
                        キャンセル
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-3 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-slate-100 transition-colors"
                      onClick={() => {
                        setAddingTo(group.category);
                        setNewSubject("");
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      教科を追加
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubjectTag({
  subject,
  color,
  isCustom,
  onColorChange,
  onRemove,
}: {
  subject: string;
  color: string | undefined;
  isCustom: boolean;
  onColorChange: (color: string) => void;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasColor = !!color;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            hasColor
              ? "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm hover:shadow-sm cursor-pointer"
              : isCustom
                ? "inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:shadow-sm cursor-pointer"
                : "inline-flex items-center gap-1 rounded-full border bg-slate-50 px-3 py-1 text-sm text-slate-700 hover:shadow-sm cursor-pointer"
          }
          style={
            hasColor
              ? { backgroundColor: color, borderColor: color, color: contrastText(color) }
              : undefined
          }
        >
          {subject}
          {isCustom && onRemove && (
            <span
              role="button"
              tabIndex={0}
              className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onRemove();
                }
              }}
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{subject} の色</p>
          {hasColor && (
            <button
              type="button"
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                onColorChange("");
                setOpen(false);
              }}
            >
              <X className="h-3 w-3" />
              色をリセット
            </button>
          )}
          <div className="flex flex-col gap-0.5">
            {COLOR_PALETTE.map((row, ri) => (
              <div key={ri} className="flex gap-0.5">
                {row.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="relative h-5 w-5 rounded-full border border-transparent transition-transform hover:scale-125 hover:border-foreground/30"
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      onColorChange(c);
                      setOpen(false);
                    }}
                  >
                    {color === c && (
                      <Paintbrush className="absolute inset-0 m-auto h-3 w-3 text-white mix-blend-difference" />
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
