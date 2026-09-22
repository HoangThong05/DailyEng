import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon } from "@/app/_components/icons";
import { Mascot } from "@/app/_components/mascot";
import { PageHeader } from "@/app/_components/page-header";
import { getFriendCircle } from "@/lib/friends";
import { SITE } from "@/lib/site";
import { getCurrentUser } from "@/lib/supabase/server";
import { FriendRow } from "./friend-row";
import { InviteLink } from "./invite-link";

export const metadata: Metadata = { title: "Bạn bè" };

/** Bạn bè: lời mời đến, danh sách bạn, lời mời đã gửi, link mời. */
export default async function BanBePage() {
  const [user, circle] = await Promise.all([getCurrentUser(), getFriendCircle()]);
  const inviteUrl = user ? `${SITE.url}/nguoi-dung/${user.id}` : SITE.url;
  const empty = circle.friends.length === 0 && circle.incoming.length === 0 && circle.outgoing.length === 0;

  return (
    <>
      <PageHeader
        title="Bạn bè"
        subtitle="Học cùng nhau cho vui — xem chuỗi ngày và XP của nhau"
        mascot="an-mung"
      />

      <div className="space-y-6 px-5 pt-2 pb-4">
        {circle.incoming.length > 0 ? (
          <section aria-labelledby="loi-moi" className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h2 id="loi-moi" className="text-muted text-sm font-medium">
                Lời mời kết bạn
              </h2>
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white tabular-nums">
                {circle.incoming.length}
              </span>
            </div>
            <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
              {circle.incoming.map((friend) => (
                <FriendRow key={friend.userId} friend={friend} />
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="ds-ban" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h2 id="ds-ban" className="text-muted text-sm font-medium">
              Bạn bè
            </h2>
            <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
              {circle.friends.length}
            </span>
            {circle.friends.length > 0 ? (
              <Link href="/xep-hang?bang=ban-be" className="text-brand ml-auto text-sm font-medium">
                Xếp hạng nhóm →
              </Link>
            ) : null}
          </div>

          {circle.friends.length === 0 ? (
            <div className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
              <Mascot variant="chao" size={88} />
              <p className="font-semibold">Chưa có bạn nào</p>
              <p className="text-muted max-w-sm text-sm">
                Gửi link bên dưới cho bạn bè, hoặc mở trang cá nhân của ai đó trong bảng xếp
                hạng rồi bấm <strong>Kết bạn</strong>.
              </p>
              <Link
                href="/xep-hang"
                className="border-border flex min-h-10 items-center gap-1 rounded-xl border px-4 text-sm font-semibold press"
              >
                Xem bảng xếp hạng
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
              {circle.friends.map((friend) => (
                <FriendRow key={friend.userId} friend={friend} />
              ))}
            </ul>
          )}
        </section>

        <InviteLink url={inviteUrl} />

        {circle.outgoing.length > 0 ? (
          <section aria-labelledby="da-gui" className="space-y-3">
            <h2 id="da-gui" className="text-muted px-1 text-sm font-medium">
              Lời mời đã gửi
            </h2>
            <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
              {circle.outgoing.map((friend) => (
                <FriendRow key={friend.userId} friend={friend} />
              ))}
            </ul>
          </section>
        ) : null}

        {empty ? null : (
          <p className="text-muted px-1 text-xs">
            Bạn bè thấy tên, ảnh, XP và số ngày học của nhau. Huỷ kết bạn bất cứ lúc nào.
          </p>
        )}
      </div>
    </>
  );
}
