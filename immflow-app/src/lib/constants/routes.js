/** Map internal page keys to App Router paths (SEO-friendly URLs). */
export const PAGE_PATHS = {
  home: "/",
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
  return PATH_PAGES[normalized] || PATH_PAGES[pathname] || "home";
}
