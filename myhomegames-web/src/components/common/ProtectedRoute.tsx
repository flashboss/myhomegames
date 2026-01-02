import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  // Check if we're in development mode (VITE_API_TOKEN is set)
  const DEV_TOKEN = import.meta.env.VITE_API_TOKEN || "";
  const isDevMode = DEV_TOKEN !== "";

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        backgroundColor: "#1a1a1a"
      }}>
        <div style={{ color: "white" }}>Loading...</div>
      </div>
    );
  }

  // In dev mode, allow access even without user (VITE_API_TOKEN will be used)
  // In production mode, redirect to login if not authenticated
  if (!isDevMode && !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

