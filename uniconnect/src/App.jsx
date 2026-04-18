import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { Layout } from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.js";
import Explore from "./pages/Explore.js";
import Chat from "./pages/Chat.js";
import Admin from "./pages/Admin.jsx";
import Frequency from "./pages/Frequency.jsx";
import Letters from "./pages/Letters.jsx";
import Games from "./pages/Games.jsx";

function PrivateShell({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-slate-400">
        Yüklənir…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user && !loading ? <Navigate to="/explore" replace /> : <Login />}
      />
      <Route
        path="/explore"
        element={
          <PrivateShell>
            <Explore />
          </PrivateShell>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateShell>
            <Profile />
          </PrivateShell>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <PrivateShell>
            <Profile />
          </PrivateShell>
        }
      />
      <Route
        path="/chat"
        element={
          <PrivateShell>
            <Chat />
          </PrivateShell>
        }
      />
      <Route
        path="/chat/:friendId"
        element={
          <PrivateShell>
            <Chat />
          </PrivateShell>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateShell>
            <Admin />
          </PrivateShell>
        }
      />
      <Route
        path="/frekans"
        element={
          <PrivateShell>
            <Frequency />
          </PrivateShell>
        }
      />
      <Route
        path="/mektublar"
        element={
          <PrivateShell>
            <Letters />
          </PrivateShell>
        }
      />
      <Route
        path="/oyunlar"
        element={
          <PrivateShell>
            <Games />
          </PrivateShell>
        }
      />
      <Route path="*" element={<Navigate to="/explore" replace />} />
    </Routes>
  );
}
