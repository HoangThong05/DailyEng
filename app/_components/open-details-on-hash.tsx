"use client";

import { useEffect } from "react";

/** Bấm link #id trỏ tới một <details> thì tự mở nó ra rồi cuộn tới. */
export function OpenDetailsOnHash() {
  useEffect(() => {
    const open = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
