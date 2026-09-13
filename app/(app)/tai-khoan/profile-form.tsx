"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "./actions";

const EMPTY: ProfileState = {};

/** Vài mức mục tiêu quen thuộc — chọn nhanh hơn gõ số trên điện thoại. */
const GOAL_OPTIONS = [5, 10, 15, 20, 30, 50];

type Props = {
  displayName: string;
  dailyGoal: number;
};

export function ProfileForm({ displayName, dailyGoal }: Props) {
  const [state, formAction, pending] = useActionState(updateProfile, EMPTY);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="display_name" className="block text-sm font-medium">
          Tên hiển thị
        </label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={displayName}
          required
          maxLength={40}
          className="border-border bg-bg focus:border-brand min-h-12 w-full rounded-xl border px-4 text-base outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="daily_goal" className="block text-sm font-medium">
          Mục tiêu mỗi ngày
        </label>
        <select
          id="daily_goal"
          name="daily_goal"
          defaultValue={dailyGoal}
          className="border-border bg-bg focus:border-brand min-h-12 w-full rounded-xl border px-4 text-base outline-none"
        >
          {/* Giá trị đang lưu có thể không nằm trong danh sách gợi ý */}
          {(GOAL_OPTIONS.includes(dailyGoal)
            ? GOAL_OPTIONS
            : [...GOAL_OPTIONS, dailyGoal].sort((a, b) => a - b)
          ).map((goal) => (
            <option key={goal} value={goal}>
              {goal} từ
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-red-500">
          {state.error}
        </p>
      ) : null}

      {state.notice ? (
        <p
          role="status"
          className="bg-brand-soft text-fg rounded-xl px-4 py-3 text-sm"
        >
          {state.notice}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white press disabled:opacity-60"
      >
        {pending ? "Đang lưu…" : "Lưu thay đổi"}
      </button>
    </form>
  );
}