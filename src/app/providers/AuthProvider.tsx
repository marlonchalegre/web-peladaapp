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

    let u: User | null = null;
    if (stored) {
      u = JSON.parse(stored) as User;
    }

    if (storedToken) {
      try {
        const payload = jwtDecode<TokenPayload>(storedToken);
        if (u) {
          // Merge admin_orgs from token if they are missing or different
          if (
            payload.admin_orgs &&
            (!u.admin_orgs || u.admin_orgs.length === 0)
          ) {
            u.admin_orgs = payload.admin_orgs;
          }
        } else if (payload) {
          // We have a token but no user object in storage,
          // we'll need to refresh it but let's provide a skeleton
          u = {
            id: payload.id,
            email: payload.email,
            name: "",
            username: "",
            admin_orgs: payload.admin_orgs,
          };
        }
      } catch (e) {
        console.error("Failed to decode stored token", e);
      }
    }
    return u;
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
      localStorage.setItem("authUser", JSON.stringify(user));
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
        try {
          const freshUser = await api.get<User>("/api/users/me");
          // Fetch orgs to get fresh admin_orgs since token might be stale
          const userOrgs = await api.get<
            (Organization & { role: "admin" | "player" })[]
          >(`/api/users/${freshUser.id}/organizations`);
          const adminOrgsList = userOrgs
            .filter((org) => org.role === "admin")
            .map((org) => org.id);

          setUser({ ...freshUser, admin_orgs: adminOrgsList });
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
