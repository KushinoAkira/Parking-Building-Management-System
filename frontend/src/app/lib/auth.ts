// Central auth helper – single source of truth for auth state

export type AuthPayload = {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  roleName: string;
  expiresAt: string;
};

/** Read auth from storage (localStorage first, then sessionStorage) */
export function getAuth(): AuthPayload | null {
  const raw =
    localStorage.getItem("pbms_auth") ?? sessionStorage.getItem("pbms_auth");
  if (!raw) return null;
  try {
    const auth = JSON.parse(raw) as AuthPayload;
    // Check token expiry
    if (auth.expiresAt && new Date(auth.expiresAt) < new Date()) {
      clearAuth();
      return null;
    }
    return auth;
  } catch {
    return null;
  }
}

/** Persist auth to storage */
export function saveAuth(auth: AuthPayload, remember: boolean): void {
  const raw = JSON.stringify(auth);
  if (remember) {
    localStorage.setItem("pbms_auth", raw);
    sessionStorage.removeItem("pbms_auth");
  } else {
    sessionStorage.setItem("pbms_auth", raw);
    localStorage.removeItem("pbms_auth");
  }
}

/** Remove auth from all storages (logout) */
export function clearAuth(): void {
  localStorage.removeItem("pbms_auth");
  sessionStorage.removeItem("pbms_auth");
}

/** Get redirect path based on role after login */
export function getRoleHomePath(roleName: string): string {
  const role = roleName.toLowerCase();
  if (role === "admin") return "/admin";
  if (role === "manager") return "/manager";
  if (role === "staff") return "/staff-dashboard";
  // Driver: mobile gets mobile UI, desktop gets web UI
  if (role === "driver") {
    return window.innerWidth < 768 ? "/user-mobile" : "/user-web";
  }
  return "/login";
}
