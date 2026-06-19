/** Admin panel resources and CRUD actions for RBAC. */
export const ADMIN_RESOURCES = {
  analytics: {
    label: "Overview & analytics",
    description: "Dashboard stats and revenue overview",
    actions: ["view"],
  },
  cms: {
    label: "Site content",
    description: "Homepage copy, navigation, and footer CMS",
    actions: ["view", "create", "edit", "delete"],
  },
  settings: {
    label: "Platform settings",
    description: "Test mode, feature flags, and tier limits",
    actions: ["view", "edit"],
  },
  attorneys: {
    label: "Attorneys",
    description: "Attorney profiles, verification, and Pro status",
    actions: ["view", "create", "edit", "delete"],
  },
  listings: {
    label: "Listings",
    description: "Job board listings moderation",
    actions: ["view", "create", "edit", "delete"],
  },
  broadcast: {
    label: "Broadcast emails",
    description: "Send announcements to all users",
    actions: ["view", "create"],
  },
  users: {
    label: "Admin users",
    description: "Employee accounts for the admin panel",
    actions: ["view", "create", "edit", "delete"],
  },
  roles: {
    label: "Roles & permissions",
    description: "Define what each role can access",
    actions: ["view", "create", "edit", "delete"],
  },
};

export const SUPER_ADMIN_SLUG = "super_admin";

export function buildFullPermissions() {
  const perms = {};
  for (const [resource, meta] of Object.entries(ADMIN_RESOURCES)) {
    perms[resource] = {};
    for (const action of meta.actions) {
      perms[resource][action] = true;
    }
  }
  return perms;
}

export function emptyPermissions() {
  const perms = {};
  for (const resource of Object.keys(ADMIN_RESOURCES)) {
    perms[resource] = {};
    for (const action of ADMIN_RESOURCES[resource].actions) {
      perms[resource][action] = false;
    }
  }
  return perms;
}

export function normalizePermissions(input) {
  const base = emptyPermissions();
  if (!input || typeof input !== "object") return base;

  for (const [resource, actions] of Object.entries(input)) {
    if (!ADMIN_RESOURCES[resource] || typeof actions !== "object") continue;
    for (const action of ADMIN_RESOURCES[resource].actions) {
      if (action in actions) {
        base[resource][action] = Boolean(actions[action]);
      }
    }
  }
  return base;
}

export function canPerform(permissions, resource, action, { isSuperAdmin = false } = {}) {
  if (isSuperAdmin) return true;
  if (!permissions?.[resource]) return false;
  return Boolean(permissions[resource][action]);
}

/** Map admin sidebar tab keys to required view permission. */
export const TAB_PERMISSIONS = {
  overview: ["analytics", "view"],
  cms: ["cms", "view"],
  settings: ["settings", "view"],
  attorneys: ["attorneys", "view"],
  listings: ["listings", "view"],
  broadcast: ["broadcast", "view"],
  users: ["users", "view"],
};
