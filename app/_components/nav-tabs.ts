import {
  CardsIcon,
  GamepadIcon,
  HomeIcon,
  MicIcon,
  UserIcon,
} from "./icons";

/**
 * Các tab điều hướng chính, dùng chung cho tab bar (điện thoại) và
 * sidebar (màn hình lớn) để hai bên không bao giờ lệch nhau.
 */
export const NAV_TABS = [
  { href: "/", label: "Trang chủ", Icon: HomeIcon },
  { href: "/hoc", label: "Học", Icon: CardsIcon },
  { href: "/tro-choi", label: "Trò chơi", Icon: GamepadIcon },
  { href: "/ky-nang", label: "Kỹ năng", Icon: MicIcon },
  { href: "/tai-khoan", label: "Cá nhân", Icon: UserIcon },
] as const;

/** Quiz thuộc Trò chơi, phát âm thuộc Kỹ năng; tiến độ, xếp hạng nằm trong Cá nhân. */
const TAB_ALIASES: Record<string, string> = {
  "/quiz": "/tro-choi",
  "/phat-am": "/ky-nang",
  "/tien-do": "/tai-khoan",
  "/xep-hang": "/tai-khoan",
  "/quan-tri": "/tai-khoan",
};

export function isTabActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (pathname.startsWith(href)) return true;
  return Object.entries(TAB_ALIASES).some(
    ([alias, target]) => target === href && pathname.startsWith(alias),
  );
}
