import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { api, type User, logout } from "../../shared/api/client";
import { AuthContext, type AuthContextValue } from "./AuthContext";
import type { Organization } from "../../shared/api/endpoints";

type TokenPayload = {
  id: string;
  email: string;
  phone?: string;
  avatar_filename?: string | null;
  admin_orgs?: string[];
  exp?: number;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("authUser");
    if (!stored) return null;

    try {
      return JSON.parse(stored) as User;
    } catch {
      localStorage.removeItem("authUser");
      return null;
    }
  });

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Failed to logout from server", e);
    }
    setUser(null);
    localStorage.removeItem("authUser");
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("authUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("authUser");
    }
  }, [user]);

  // Setup global auth error handler
  useEffect(() => {
    const handleAuthError = () => {
      // Clear invalid session and redirect to login
      signOut();
    };

    api.setAuthErrorHandler(handleAuthError);
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: null, // Token is now handled by cookies
      user,
      isAuthenticated: Boolean(user),
      signIn: (t: string | null | undefined, u: User) => {
        // We still receive the token in signIn for backward compatibility
        // and to extract additional info if needed, but we don't store it.
        try {
          if (t) {
            const payload = jwtDecode<TokenPayload>(t);
            u.admin_orgs = payload.admin_orgs;
          }
        } catch (e) {
          console.error("Failed to decode token", e);
        }
        setUser(u);
      },
      refreshUser: async () => {
        try {
          const freshUser = await api.get<User>("/api/users/me");

          let adminOrgsList: string[] = [];
          if (!freshUser.is_blocked) {
            // Fetch orgs to get fresh admin_orgs since token might be stale
            const userOrgs = await api.get<
              (Organization & { role: "admin" | "player" })[]
            >(`/api/users/${freshUser.id}/organizations`);

            adminOrgsList = userOrgs
              .filter((org) => org.role === "admin")
              .map((org) => org.id);
          }

          setUser({
            ...freshUser,
            admin_orgs: adminOrgsList,
            phone: freshUser.phone,
            avatar_filename: freshUser.avatar_filename,
          });
        } catch (e) {
          console.error("Failed to refresh user data", e);
        }
      },

      signOut,
    }),
    [user, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
