import { Navigate } from "react-router-dom";
import { getRole, getToken, logout } from "../utils/auth";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = getToken();
  const role = getRole();
  const isJwtLike = token && token.split(".").length === 3;

  if (!isJwtLike) {
    logout();
    return <Navigate to="/" />;
  }

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }

  return children;
}
