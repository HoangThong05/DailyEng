import {
  CardsIcon,
  GamepadIcon,
  HomeIcon,
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
  { href: "/tai-khoan", label: "Cá nhân", Icon: UserIcon },
] as const;

/** Quiz và luyện phát âm đứng dưới tab Trò chơi; tiến độ nằm trong Cá nhân. */
const TAB_ALIASES: Record<string, string> = {
  "/quiz": "/tro-choi",
  "/phat-am": "/tro-choi",
  "/tien-do": "/tai-khoan",
};

export function isTabActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (pathname.startsWith(href)) return true;
  return Object.entries(TAB_ALIASES).some(
    ([alias, target]) => target === href && pathname.startsWith(alias),
  );
}
