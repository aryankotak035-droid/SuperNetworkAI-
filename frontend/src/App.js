import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import ProfileSetup from "./pages/ProfileSetup";
import SearchResults from "./pages/SearchResults";
import Connections from "./pages/Connections";
import { Toaster } from "./components/ui/sonner";

function AppRouter() {
  const location = useLocation();
  
  // CRITICAL: Check for session_id synchronously to prevent race conditions
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile/setup" element={<ProfileSetup />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/connections" element={<Connections />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;