"use client";

import { useActionState, useState } from "react";
import { ReminderToggle } from "@/app/(app)/tai-khoan/reminder-toggle";
import { Mascot } from "@/app/_components/mascot";
import { finishOnboarding, type OnboardState } from "./actions";

const EMPTY: OnboardState = {};

/** Mức mục tiêu gợi ý; chọn "Khác" thì tự gõ. */
const GOAL_PRESETS = [5, 10, 15, 20, 30] as const;

const FIELD_CLASS =
  "border-border bg-card placeholder:text-muted/70 focus:border-brand min-h-12 w-full rounded-xl border px-4 text-base outline-none";

const STEPS = ["Tên & mục tiêu", "Nhắc học", "Bắt đầu"] as const;

type Props = {
  initialName: string;
  initialGoal: number;
  reminderHour: number;
  vapidPublicKey: string | null;
};

export function OnboardingWizard({ initialName, initialGoal, reminderHour, vapidPublicKey }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [goal, setGoal] = useState(initialGoal);
  const [custom, setCustom] = useState(!GOAL_PRESETS.includes(goal as (typeof GOAL_PRESETS)[number]));
  const [state, formAction, pending] = useActionState(finishOnboarding, EMPTY);

  const nameOk = name.trim().length > 0 && name.trim().length <= 40;
  const goalOk = Number.isInteger(goal) && goal >= 1 && goal <= 200;

  return (
    <div className="space-y-6">
      {/* Thanh bước: chấm sáng dần */}
      <ol className="flex items-center justify-center gap-2" aria-label="Các bước">
        {STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? "step" : undefined}
            className={`h-1.5 rounded-full transition-all ${
              index <= step ? "bg-brand w-8" : "bg-brand-soft w-4"
            }`}
          >
            <span className="sr-only">{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <section className="space-y-5">
          <div className="flex flex-col items-center text-center">
            <Mascot variant="chao" size={112} priority />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Chào bạn mới!</h1>
            <p className="text-muted mt-2 text-sm">
              Vài câu nhanh để DailyEng học cùng bạn đúng nhịp.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="display_name" className="block text-sm font-medium">
              Gọi bạn là gì?
            </label>
            <input
              id="display_name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              autoComplete="nickname"
              autoFocus
              placeholder="Tên hiển thị"
              className={FIELD_CLASS}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Mỗi ngày học bao nhiêu từ?</legend>
            <div className="flex flex-wrap gap-2">
              {GOAL_PRESETS.map((preset) => {
                const active = !custom && goal === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setCustom(false);
                      setGoal(preset);
                    }}
                    className={`min-h-11 min-w-14 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-card"
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={custom}
                onClick={() => setCustom(true)}
                className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                  custom ? "border-brand bg-brand text-white" : "border-border bg-card"
                }`}
              >
                Khác
              </button>
            </div>
            {custom ? (
              <input
                type="number"
                min={1}
                max={200}
                value={Number.isNaN(goal) ? "" : goal}
                onChange={(event) => setGoal(Number(event.target.value))}
                inputMode="numeric"
                aria-label="Số từ mỗi ngày"
                className={FIELD_CLASS}
              />
            ) : null}
            <p className="text-muted text-xs">
              10 từ/ngày là vừa: khoảng 5–10 phút, một năm được hơn 3.000 từ.
            </p>
          </fieldset>

          <button
            type="button"
            disabled={!nameOk || !goalOk}
            onClick={() => setStep(1)}
            className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white press disabled:opacity-60"
          >
            Tiếp
          </button>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-5">
          <div className="flex flex-col items-center text-center">
            <Mascot variant="ngu" size={112} />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Nhắc bạn học mỗi ngày?</h1>
            <p className="text-muted mt-2 text-sm">
              Một thông báo nhỏ đúng giờ giúp giữ chuỗi ngày học. Bỏ qua cũng được, bật
              sau ở tab Cá nhân.
            </p>
          </div>

          <ReminderToggle vapidPublicKey={vapidPublicKey} reminderHour={reminderHour} />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="border-border min-h-12 flex-1 rounded-xl border text-base font-semibold press"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-brand min-h-12 flex-1 rounded-xl text-base font-semibold text-white press"
            >
              Tiếp
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="display_name" value={name.trim()} />
          <input type="hidden" name="daily_goal" value={goal} />

          <div className="flex flex-col items-center text-center">
            <Mascot variant="hoc" size={112} />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Sẵn sàng rồi, {name.trim()}!</h1>
            <p className="text-muted mt-2 text-sm">
              Làm bài kiểm tra ngắn để app gợi ý bộ từ vừa sức, hoặc vào học ngay.
            </p>
          </div>

          {state.error ? (
            <p role="alert" className="text-sm font-medium text-red-500">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            name="target"
            value="kiem-tra"
            disabled={pending}
            className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white press disabled:opacity-60"
          >
            {pending ? "Đang lưu…" : "Kiểm tra đầu vào (3 phút)"}
          </button>
          <button
            type="submit"
            name="target"
            value="hoc"
            disabled={pending}
            className="border-border min-h-12 w-full rounded-xl border text-base font-semibold press disabled:opacity-60"
          >
            Vào học ngay
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-muted min-h-11 w-full text-sm font-medium"
          >
            Quay lại
          </button>
        </form>
      ) : null}
    </div>
  );
}
