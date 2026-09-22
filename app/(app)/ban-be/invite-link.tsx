"use client";

import { useState } from "react";
import { ShareIcon } from "@/app/_components/icons";

/**
 * Link mời: chính là trang cá nhân của mình. Bạn bè mở link, bấm "Kết bạn".
 * Không có tìm kiếm theo tên nên không ai dò được danh sách người dùng.
 */
export function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "DailyEng", text: "Học tiếng Anh cùng mình nhé!", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Người dùng bấm huỷ hộp chia sẻ — không phải lỗi.
    }
  }

  return (
    <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-2xl border p-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Mời bạn bè</p>
        <p className="text-muted mt-0.5 text-sm break-all">{url}</p>
      </div>
      <button
        type="button"
        onClick={share}
        className="bg-brand flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white press"
      >
        <ShareIcon className="h-4 w-4" />
        {copied ? "Đã chép link" : "Chia sẻ"}
      </button>
    </div>
  );
}
