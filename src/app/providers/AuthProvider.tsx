import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { api, type User } from "../../shared/api/client";
import { AuthContext, type AuthContextValue } from "./AuthContext";
import type { Organization } from "../../shared/api/endpoints";

type TokenPayload = {
  id: number;
  email: string;
  admin_orgs?: number[];
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("authToken");
  });

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("authUser");
    const storedToken = localStorage.getItem("authToken");

    if (stored) {
      const u = JSON.parse(stored) as User;
      if (storedToken) {
        try {
          const payload = jwtDecode<TokenPayload>(storedToken);
          u.admin_orgs = payload.admin_orgs;
        } catch (e) {
          console.error("Failed to decode stored token", e);
        }
      }
      return u;
    }
    return null;
  });

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem("authToken", token);
    else localStorage.removeItem("authToken");
    api.setToken(token);
  }, [token]);

  useEffect(() => {
    if (user) {
      // Don't store admin_orgs in localStorage, it should come from token
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { admin_orgs, ...userToStore } = user;
      localStorage.setItem("authUser", JSON.stringify(userToStore));
    } else {
      localStorage.removeItem("authUser");
    }
  }, [user]);

  // Setup global auth error handler
  useEffect(() => {
    const handleAuthError = () => {
      // Clear invalid token and redirect to login
      signOut();
    };

    api.setAuthErrorHandler(handleAuthError);
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      signIn: (t, u) => {
        try {
          const payload = jwtDecode<TokenPayload>(t);
          u.admin_orgs = payload.admin_orgs;
        } catch (e) {
          console.error("Failed to decode token", e);
        }
        setToken(t);
        setUser(u);
      },
      refreshUser: async () => {
        if (!user) return;
        try {
          // We can use listUserOrganizations to update admin_orgs
          // The backend might not have an endpoint that returns the full user with updated token/admin_orgs
          // but we can at least update the admin_orgs list in the user object
          const userOrgs = await api.get<
            (Organization & { role: "admin" | "player" })[]
          >(`/api/users/${user.id}/organizations`);
          const adminOrgsList = userOrgs
            .filter((org) => org.role === "admin")
            .map((org) => org.id);

          setUser({ ...user, admin_orgs: adminOrgsList });
        } catch (e) {
          console.error("Failed to refresh user data", e);
        }
      },
      signOut,
    }),
    [token, user, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
