import {
  CardsIcon,
  ChartIcon,
  GamepadIcon,
  GiftIcon,
  HomeIcon,
  MicIcon,
  SparkleIcon,
  TrophyIcon,
  UserIcon,
} from "./icons";

/**
 * Năm tab chính, dùng cho tab bar điện thoại. Sidebar máy tính hiện thêm
 * SIDE_EXTRAS (những trang trên điện thoại gộp dưới Cá nhân).
 */
export const NAV_TABS = [
  { href: "/", label: "Trang chủ", Icon: HomeIcon },
  { href: "/hoc", label: "Học", Icon: CardsIcon },
  { href: "/tro-choi", label: "Trò chơi", Icon: GamepadIcon },
  { href: "/ky-nang", label: "Kỹ năng", Icon: MicIcon },
  { href: "/tai-khoan", label: "Cá nhân", Icon: UserIcon },
] as const;

/** Mục chỉ có ở sidebar: có chỗ thì tách ra cho dễ với, điện thoại vẫn gộp. */
export const SIDE_EXTRAS = [
  { href: "/hoi-ai", label: "Hỏi AI", Icon: SparkleIcon },
  { href: "/tien-do", label: "Thống kê", Icon: ChartIcon },
  { href: "/xep-hang", label: "Bảng xếp hạng", Icon: TrophyIcon },
  { href: "/phan-thuong", label: "Phần thưởng", Icon: GiftIcon },
] as const;

/** Trang con thuộc tab nào (để tab bar điện thoại sáng đúng chỗ). */
const TAB_ALIASES: Record<string, string> = {
  "/on-tap": "/hoc",
  "/kiem-tra-dau-vao": "/hoc",
  "/quiz": "/tro-choi",
  "/phat-am": "/ky-nang",
  "/tien-do": "/tai-khoan",
  "/xep-hang": "/tai-khoan",
  "/nguoi-dung": "/tai-khoan",
  "/phan-thuong": "/tai-khoan",
  "/hoi-ai": "/hoc",
};

export function isTabActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (pathname.startsWith(href)) return true;
  return Object.entries(TAB_ALIASES).some(
    ([alias, target]) => target === href && pathname.startsWith(alias),
  );
}

/**
 * Sidebar: mục phụ tự sáng khi đúng đường dẫn; lúc đó tab Cá nhân không sáng
 * theo (khác tab bar điện thoại, nơi mục phụ gộp dưới Cá nhân).
 */
export function isSideActive(href: string, pathname: string) {
  const extraHit = SIDE_EXTRAS.some((item) => pathname.startsWith(item.href));
  if (SIDE_EXTRAS.some((item) => item.href === href)) return pathname.startsWith(href);
  if (extraHit && href === "/tai-khoan") return false;
  return isTabActive(href, pathname);
}
