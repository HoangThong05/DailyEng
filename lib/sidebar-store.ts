"use client";

import { useSyncExternalStore } from "react";

/**
 * Sidebar máy tính: mở rộng (có chữ) hay thu gọn (chỉ icon). Trạng thái nằm
 * ở thuộc tính data-sidebar trên <html> để CSS đổi bề rộng ngay, kể cả trước
 * khi React chạy (SIDEBAR_INIT_SCRIPT đặt sẵn từ localStorage).
 */
export const SIDEBAR_STORAGE_KEY = "dailyeng:sidebar";

export const SIDEBAR_INIT_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  SIDEBAR_STORAGE_KEY,
)})==="collapsed"){document.documentElement.setAttribute("data-sidebar","collapsed")}}catch(e){}})()`;

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function readCollapsed() {
  return document.documentElement.getAttribute("data-sidebar") === "collapsed";
}

export function useSidebarCollapsed() {
  return useSyncExternalStore(subscribe, readCollapsed, () => false);
}

export function setSidebarCollapsed(collapsed: boolean) {
  if (collapsed) document.documentElement.setAttribute("data-sidebar", "collapsed");
  else document.documentElement.removeAttribute("data-sidebar");
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "collapsed" : "open");
  } catch {
    // Không lưu được thì chỉ mất ghi nhớ giữa các lần mở.
  }
  for (const listener of listeners) listener();
}
