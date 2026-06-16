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

export function RequireAuth({ roles }: { roles: string[] }) {
  const auth = getAuth();
  if (!auth?.token) return <Navigate to="/login" replace />;

  const role = auth.roleName.toLowerCase();
  const allowed = roles.map((x) => x.toLowerCase());
  if (!allowed.includes(role)) return <Navigate to="/login" replace />;

  return <Outlet />;
}

