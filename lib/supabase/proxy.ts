import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "./env";

export const LOGIN_PATH = "/dang-nhap";
/** Trang nhập mã xác nhận 6 số, vào được khi chưa đăng nhập. */
export const VERIFY_PATH = "/nhap-ma";
/** Tham số lưu trang người dùng định vào, để đăng nhập xong quay lại đúng chỗ. */
export const REDIRECT_PARAM = "tiep-tuc";

/** Người lạ mở địa chỉ gốc thì tới đây thay vì form đăng nhập. */
export const LANDING_PATH = "/gioi-thieu";

/**
 * Những đường dẫn xem được khi chưa đăng nhập.
 * /api/cron do Vercel gọi, không có cookie — tự xác thực bằng CRON_SECRET.
 */
const PUBLIC_PATHS = [
  LOGIN_PATH,
  VERIFY_PATH,
  "/auth",
  "/offline",
  "/api/cron",
  "/gioi-thieu",
  // Google phải đọc được hai file này mà không cần đăng nhập.
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Làm mới access token và chặn route cần đăng nhập.
 *
 * Lưu ý: mọi response trả về đều phải mang theo cookie mà Supabase vừa ghi,
 * nếu không token mới sẽ mất và người dùng bị đăng xuất ngẫu nhiên.
 */
export async function updateSession(request: NextRequest) {
  const { url, key } = getSupabaseEnv();

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Chặn CDN cache response có Set-Cookie, kẻo session của người này
        // bị trả về cho người khác.
        for (const [headerName, headerValue] of Object.entries(headers)) {
          response.headers.set(headerName, headerValue);
        }
      },
    },
  });

  // Phải gọi ngay đầu request: nếu token được refresh sau khi response đã gửi
  // thì cookie mới không ghi kịp.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;

  if (!isLoggedIn && !isPublicPath(pathname)) {
    const target = request.nextUrl.clone();
    target.search = "";
    if (pathname === "/") {
      // Người lạ mở địa chỉ gốc (hoặc bấm link được chia sẻ) thì thấy trang
      // giới thiệu, không phải form đăng nhập.
      target.pathname = LANDING_PATH;
    } else {
      target.pathname = LOGIN_PATH;
      target.searchParams.set(REDIRECT_PARAM, pathname);
    }
    return redirectKeepingCookies(target, response);
  }

  if (isLoggedIn && pathname === LOGIN_PATH) {
    const target = request.nextUrl.clone();
    target.pathname = "/";
    target.search = "";
    return redirectKeepingCookies(target, response);
  }

  return response;
}

function redirectKeepingCookies(target: URL, source: NextResponse) {
  const redirect = NextResponse.redirect(target);
  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}
