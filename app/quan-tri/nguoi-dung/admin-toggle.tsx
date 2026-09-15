"use client";

import { useState, useTransition } from "react";
import { setAdmin } from "./actions";

export function AdminToggle({
  userId,
  isAdmin: initial,
  isSelf,
}: {
  userId: string;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const [isAdmin, setIsAdmin] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !isAdmin;
    if (next && !confirm("Cấp quyền admin cho người này? Họ sẽ xem được email và số liệu của mọi người dùng.")) return;
    setIsAdmin(next);
    setError(null);
    startTransition(async () => {
      const result = await setAdmin(userId, next);
      if (!result.ok) {
        setIsAdmin(!next);
        setError(result.error);
      }
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending || (isSelf && isAdmin)}
        title={isSelf && isAdmin ? "Không thể tự bỏ quyền của mình" : undefined}
        className={`min-h-8 rounded-lg px-2.5 text-xs font-semibold press disabled:opacity-50 ${
          isAdmin ? "bg-brand text-white" : "border-border text-muted border"
        }`}
      >
        {isAdmin ? "Admin" : "Cấp admin"}
      </button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </span>
  );
}
