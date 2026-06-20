import { Navigate, Outlet } from "react-router";
import { getAuth, getRoleHomePath } from "../lib/auth";

export function RequireAuth({ roles }: { roles: string[] }) {
  const auth = getAuth();

  if (!auth?.token) return <Navigate to="/login" replace />;

  const role = auth.roleName.toLowerCase();
  const allowed = roles.map((x) => x.toLowerCase());
  if (!allowed.includes(role)) {
    return <Navigate to={getRoleHomePath(auth.roleName)} replace />;
  }

  return <Outlet />;
}
