import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthContext";

/**
 * Shared hook to perform user logout:
 * invokes an optional UI menu close callback, signs out, and redirects to home ("/").
 */
export function useLogout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(
    async (onCloseMenu?: () => void) => {
      onCloseMenu?.();
      await signOut();
      navigate("/");
    },
    [signOut, navigate],
  );

  return handleLogout;
}
