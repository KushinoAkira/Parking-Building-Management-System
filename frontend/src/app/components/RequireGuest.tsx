import { Navigate, Outlet } from "react-router";
import { getAuth, getRoleHomePath } from "../lib/auth";

export function RequireGuest() {
  const auth = getAuth();
  if (auth?.token) {
    return <Navigate to={getRoleHomePath(auth.roleName)} replace />;
  }
  return <Outlet />;
}
