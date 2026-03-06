"use client";

import { useState } from "react";
import { Paintbrush, RotateCcw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { COLOR_PALETTE, DEFAULT_ITEM_COLOR } from "@/lib/constants";

type ColorPickerPopoverProps = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorPickerPopover({ value, onChange }: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(color: string) {
    onChange(color);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-7 w-full items-center gap-2 rounded border border-input bg-background px-2 text-xs hover:bg-accent transition-colors"
        >
          <div
            className="h-4 w-4 shrink-0 rounded-sm border border-border/50"
            style={{ backgroundColor: value }}
          />
          <span className="text-muted-foreground">色を選択</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-2">
          {/* リセットボタン */}
          <button
            type="button"
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => handleSelect(DEFAULT_ITEM_COLOR)}
          >
            <RotateCcw className="h-3 w-3" />
            リセット
          </button>

          {/* カラーグリッド */}
          <div className="flex flex-col gap-0.5">
            {COLOR_PALETTE.map((row, ri) => (
              <div key={ri} className="flex gap-0.5">
                {row.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="relative h-5 w-5 rounded-full border border-transparent transition-transform hover:scale-125 hover:border-foreground/30"
                    style={{ backgroundColor: color }}
                    onClick={() => handleSelect(color)}
                  >
                    {value === color && (
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
