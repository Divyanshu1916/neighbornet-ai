import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebase, googleProvider } from "./firebase";
import { toast } from "sonner";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebase();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async () => {
    const { auth } = getFirebase();
    if (!auth) {
      toast.error("Firebase unavailable in this environment");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Welcome to NeighborNet AI");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign-in failed";
      toast.error(msg);
    }
  };

  const logout = async () => {
    const { auth } = getFirebase();
    if (!auth) return;
    await signOut(auth);
    toast("Signed out");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
