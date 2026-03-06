"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SUBJECT_PRESETS,
  GRADE_CATEGORIES,
  type GradeCategory,
} from "@/lib/subject-presets";

const SUBJECTS_KEY = "routrize:custom-subjects";

type CustomSubjects = Record<string, string[]>;

function loadCustomSubjects(): CustomSubjects {
  try {
    const raw = localStorage.getItem(SUBJECTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** カテゴリに対応する教科一覧（プリセット＋カスタム）を返す */
export function useSubjectPresets() {
  const [custom, setCustom] = useState<CustomSubjects>({});

  useEffect(() => {
    setCustom(loadCustomSubjects());
  }, []);

  function getSubjects(category: GradeCategory | string): string[] {
    const preset = DEFAULT_SUBJECT_PRESETS.find((p) => p.category === category);
    const base = preset?.subjects ?? [];
    const added = custom[category] ?? [];
    return [...base, ...added.filter((s) => !base.includes(s))];
  }

  return { categories: GRADE_CATEGORIES, getSubjects };
}
