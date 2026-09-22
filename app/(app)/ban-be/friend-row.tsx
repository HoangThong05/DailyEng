"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/app/_components/avatar";
import { FlameIcon } from "@/app/_components/icons";
import { TitleChip } from "@/app/_components/title-chip";
import type { Friend } from "@/lib/friends";
import { FriendButton } from "./friend-actions";

/** Một dòng bạn bè / lời mời, kèm nút thao tác và thông báo kết quả. */
export function FriendRow({ friend }: { friend: Friend }) {
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);

  return (
    <li className="flex flex-wrap items-center gap-3 p-3">
      <Link href={`/nguoi-dung/${friend.userId}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar url={friend.avatarUrl} name={friend.displayName} size={44} frame={friend.frame} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{friend.displayName}</span>
          <TitleChip title={friend.title} className="mt-0.5" />
          <span className="text-muted mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
            <span className="tabular-nums">{friend.xp.toLocaleString("vi-VN")} XP</span>
            <span className="flex items-center gap-1 tabular-nums">
              <FlameIcon className="h-3.5 w-3.5 text-orange-500" />
              {friend.streakDays} ngày học
            </span>
            {friend.studiedToday ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Hôm nay đã học
              </span>
            ) : null}
          </span>
        </span>
      </Link>

      <span className="flex shrink-0 items-center gap-2">
        {friend.kind === "den" ? (
          <>
            <FriendButton
              action="dong-y"
              targetId={friend.userId}
              className="bg-brand text-white"
              onDone={(r) => setNotice(r.ok ? { text: r.message } : { text: r.error, error: true })}
            />
            <FriendButton
              action="tu-choi"
              targetId={friend.userId}
              className="border-border text-muted border"
              onDone={(r) => setNotice(r.ok ? { text: r.message } : { text: r.error, error: true })}
            />
          </>
        ) : friend.kind === "di" ? (
          <FriendButton
            action="huy-moi"
            targetId={friend.userId}
            className="border-border text-muted border"
            onDone={(r) => setNotice(r.ok ? { text: r.message } : { text: r.error, error: true })}
          />
        ) : (
          <FriendButton
            action="huy-ban"
            targetId={friend.userId}
            className="text-muted hover:text-red-500"
            onDone={(r) => setNotice(r.ok ? { text: r.message } : { text: r.error, error: true })}
          />
        )}
      </span>

      {notice ? (
        <p
          role="status"
          className={`w-full text-xs font-medium ${notice.error ? "text-red-500" : "text-brand"}`}
        >
          {notice.text}
        </p>
      ) : null}
    </li>
  );
}
