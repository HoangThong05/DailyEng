"use client";

import { createContext, useContext } from "react";
import type { UserBarData } from "@/lib/user-bar";

const UserBarContext = createContext<UserBarData | null>(null);

/** Layout app nạp dữ liệu một lần; PageHeader ở từng trang đọc qua context. */
export function UserBarProvider({
  value,
  children,
}: {
  value: UserBarData;
  children: React.ReactNode;
}) {
  return <UserBarContext.Provider value={value}>{children}</UserBarContext.Provider>;
}

export function useUserBar() {
  return useContext(UserBarContext);
}
