"use client";

import { useState } from "react";
import type { FriendKind } from "@/lib/friends";
import { FriendButton } from "@/app/(app)/ban-be/friend-actions";

/** Cụm nút kết bạn trên trang cá nhân người khác, đổi theo quan hệ hiện tại. */
export function FriendAction({ targetId, status }: { targetId: string; status: FriendKind }) {
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "khong" ? (
        <FriendButton
          action="them"
          targetId={targetId}
          className="bg-brand min-h-11 px-5 text-white"
          onDone={(r) => setNotice(r.ok ? { text: r.message } : { text: r.error, error: true })}
        />
      ) : status === "den" ? (
        <>
          <span className="text-muted text-sm">Đã mời bạn kết bạn</span>
          <FriendButton
            action="dong-y"
            targetId={targetId}
            className="bg-brand min-h-11 px-5 text-white"
            onDone={(r) => setNotice(r.ok ? { text: r.message } : { text: r.error, error: true })}
          />
          <FriendButton
            action="tu-choi"
            targetId={targetId}
            className="border-border text-muted min-h-11 border"
            onDone={(r) => setNotice(r.ok ? { text: r.message } : { text: r.error, error: true })}
          />
        </>
      ) : status === "di" ? (
        <>
          <span className="text-muted text-sm">Đang chờ đồng ý</span>
          <FriendButton
            action="huy-moi"
            targetId={targetId}
            className="border-border text-muted min-h-11 border"
            onDone={(r) => setNotice(r.ok ? { text: r.message } : { text: r.error, error: true })}
          />
        </>
      ) : (
        <>
          <span className="bg-brand-soft text-brand rounded-full px-3 py-1 text-sm font-semibold">
            ✓ Bạn bè
          </span>
          <FriendButton
            action="huy-ban"
            targetId={targetId}
            className="text-muted min-h-11 hover:text-red-500"
            onDone={(r) => setNotice(r.ok ? { text: r.message } : { text: r.error, error: true })}
          />
        </>
      )}
      {notice ? (
        <p role="status" className={`w-full text-sm font-medium ${notice.error ? "text-red-500" : "text-brand"}`}>
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
