"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const CURRENT = "ppc_admin_current_path";
const PREVIOUS = "ppc_admin_previous_path";

/** Remembers the last admin route in this tab so Back works after client-side navigation. */
export function AdminNavControls() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname.startsWith("/admin")) return;
    try {
      const current = sessionStorage.getItem(CURRENT);
      if (current && current !== pathname && current.startsWith("/admin")) {
        sessionStorage.setItem(PREVIOUS, current);
      }
      sessionStorage.setItem(CURRENT, pathname);
    } catch {
      // Keep navigation usable in browsers where session storage is unavailable.
    }
  }, [pathname]);

  function goBack() {
    try {
      const previous = sessionStorage.getItem(PREVIOUS);
      if (previous && previous.startsWith("/admin") && previous !== pathname) {
        router.push(previous);
        return;
      }
    } catch {
      // Fall through to the dashboard when storage is unavailable.
    }
    router.push(pathname === "/admin" ? "/admin/orders" : "/admin");
  }

  return (
    <button type="button" onClick={goBack} className="btn btn-ghost !min-h-10 !py-1.5 mb-4" aria-label="Go back to the last admin page">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}
