/** Map internal page keys to App Router paths (SEO-friendly URLs). */
export const PAGE_PATHS = {
  home: "/",
  services: "/services",
  attorneys: "/attorneys",
  jobs: "/jobs",
  network: "/network",
  matcher: "/matcher",
  post: "/post",
  dashboard: "/dashboard",
};

export const PATH_PAGES = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([page, path]) => [path, page])
);

export function pathForPage(page) {
  return PAGE_PATHS[page] || "/";
}

export function pageForPath(pathname) {
  const normalized = pathname?.replace(/\/$/, "") || "/";
  if (PATH_PAGES[normalized]) return PATH_PAGES[normalized];
  if (/^\/attorneys\/[^/]+$/.test(normalized)) return "attorneys";
  if (/^\/services\/[^/]+$/.test(normalized)) return "serviceCategory";
  if (/^\/providers\/[^/]+$/.test(normalized)) return "providerProfile";
  if (normalized === "/services") return "services";
  return "home";
}

export function serviceSlugFromPath(pathname) {
  const m = pathname?.match(/^\/services\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function providerIdFromPath(pathname) {
  const m = pathname?.match(/^\/providers\/([^/]+)\/?$/);
  return m ? m[1] : null;
}
