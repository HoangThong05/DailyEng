"use client";

import { useState, useTransition } from "react";
import {
  acceptFriendRequest,
  removeFriend,
  sendFriendRequest,
  type FriendResult,
} from "@/app/_actions/friends";

type Action = "them" | "dong-y" | "tu-choi" | "huy-moi" | "huy-ban";

const LABEL: Record<Action, string> = {
  them: "Kết bạn",
  "dong-y": "Đồng ý",
  "tu-choi": "Từ chối",
  "huy-moi": "Huỷ lời mời",
  "huy-ban": "Huỷ kết bạn",
};

/**
 * Một nút thao tác bạn bè. Kiểu "huỷ kết bạn" hỏi lại một nhịp để không bấm
 * nhầm mất bạn.
 */
export function FriendButton({
  action,
  targetId,
  className = "",
  onDone,
}: {
  action: Action;
  targetId: string;
  className?: string;
  onDone?: (result: FriendResult) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function run() {
    startTransition(async () => {
      const result =
        action === "them"
          ? await sendFriendRequest(targetId)
          : action === "dong-y"
            ? await acceptFriendRequest(targetId)
            : await removeFriend(targetId);
      setConfirming(false);
      onDone?.(result);
    });
  }

  const needsConfirm = action === "huy-ban";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (needsConfirm && !confirming) {
          setConfirming(true);
          return;
        }
        run();
      }}
      onBlur={() => setConfirming(false)}
      className={`min-h-9 rounded-xl px-3 text-sm font-semibold press disabled:opacity-50 ${className}`}
    >
      {pending ? "…" : confirming ? "Chắc chứ?" : LABEL[action]}
    </button>
  );
}
