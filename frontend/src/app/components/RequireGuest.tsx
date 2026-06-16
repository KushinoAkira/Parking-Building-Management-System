import { Navigate, Outlet } from "react-router";

type AuthPayload = {
  token: string;
  userId: number;
  roleName: string;
};

function getAuth(): AuthPayload | null {
  const raw = localStorage.getItem("pbms_auth") ?? sessionStorage.getItem("pbms_auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthPayload;
  } catch {
    return null;
  }
}

function getRedirectPath(roleName: string): string {
  const role = roleName.toLowerCase();
  if (role === "staff") return "/staff-dashboard";
  if (role === "driver") return "/user-web";
  return "/manager";
}

export function RequireGuest() {
  const auth = getAuth();
  if (auth?.token) {
    return <Navigate to={getRedirectPath(auth.roleName)} replace />;
  }
  return <Outlet />;
}

