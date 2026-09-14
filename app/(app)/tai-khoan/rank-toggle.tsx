"use client";

import { useState } from "react";
import { setHideRank } from "./actions";

/** Công tắc "Ẩn tôi khỏi bảng xếp hạng". */
export function RankToggle({ hidden: initial }: { hidden: boolean }) {
  const [hidden, setHidden] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !hidden;
    setHidden(next);
    setBusy(true);
    setError(null);
    const result = await setHideRank(next);
    setBusy(false);
    if (!result.ok) {
      setHidden(!next);
      setError(result.error);
    }
  }

  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium">Ẩn tôi khỏi bảng xếp hạng</p>
          <p className="text-muted mt-0.5 text-sm">
            Tên và XP của bạn không hiện với người khác. XP vẫn tính bình thường.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={hidden}
          aria-label="Ẩn tôi khỏi bảng xếp hạng"
          disabled={busy}
          onClick={toggle}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
            hidden ? "bg-brand" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
              hidden ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
