"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { BIO_MAX, COVER_PRESETS, type CoverKey } from "@/lib/profile";
import { updateProfile, type ProfileState } from "./actions";

const EMPTY: ProfileState = {};

/** Vài mức mục tiêu quen thuộc — chọn nhanh hơn gõ số trên điện thoại. */
const GOAL_OPTIONS = [5, 10, 15, 20, 30, 50];

type Props = {
  displayName: string;
  dailyGoal: number;
  bio: string;
  cover: CoverKey;
  /** Đang dùng ảnh bìa tải lên → chọn màu sẽ thay ảnh. */
  coverIsImage: boolean;
};

export function ProfileForm({ displayName, dailyGoal, bio, cover, coverIsImage }: Props) {
  const [state, formAction, pending] = useActionState(updateProfile, EMPTY);
  const [bioText, setBioText] = useState(bio);
  const [chosenCover, setChosenCover] = useState<CoverKey | "">(coverIsImage ? "" : cover);
  /** Chỉ gửi màu bìa khi người dùng bấm chọn trong lần mở form này; không thì server giữ nguyên. */
  const [coverTouched, setCoverTouched] = useState(false);

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
        <div className="flex items-baseline justify-between">
          <label htmlFor="bio" className="block text-sm font-medium">
            Tiểu sử
          </label>
          <span className="text-muted text-xs tabular-nums">
            {bioText.length}/{BIO_MAX}
          </span>
        </div>
        <textarea
          id="bio"
          name="bio"
          value={bioText}
          onChange={(event) => setBioText(event.target.value.slice(0, BIO_MAX))}
          rows={2}
          placeholder="Mục tiêu TOEIC 750 trước tháng 12…"
          className="border-border bg-bg focus:border-brand w-full resize-none rounded-xl border px-4 py-3 text-base outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <span className="block text-sm font-medium">Màu bìa</span>
        <input type="hidden" name="cover" value={coverTouched ? chosenCover : ""} />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(COVER_PRESETS) as CoverKey[]).map((key) => {
            const preset = COVER_PRESETS[key];
            const active = chosenCover === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setChosenCover(key);
                  setCoverTouched(true);
                }}
                aria-pressed={active}
                title={preset.label}
                className={`h-10 w-14 rounded-xl bg-gradient-to-br ${preset.className} transition-transform ${
                  active ? "ring-brand scale-110 ring-2 ring-offset-2 ring-offset-[var(--card)]" : "opacity-80 hover:opacity-100"
                }`}
              >
                <span className="sr-only">{preset.label}</span>
              </button>
            );
          })}
        </div>
        {coverIsImage && !chosenCover ? (
          <p className="text-muted text-xs">Đang dùng ảnh bìa tải lên. Chọn một màu để thay.</p>
        ) : null}
        <p className="text-muted text-xs">
          Bìa đặc biệt (Trung thu, TOEIC 990…) mua bằng Hạt ở{" "}
          <Link href="/cua-hang" className="text-brand font-medium">
            Cửa hàng
          </Link>
          .
        </p>
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
        <p role="status" className="bg-brand-soft text-fg rounded-xl px-4 py-3 text-sm">
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
