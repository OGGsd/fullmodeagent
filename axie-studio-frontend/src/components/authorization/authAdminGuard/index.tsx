import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { CustomNavigate } from "@/customization/components/custom-navigate";
import { LoadingPage } from "@/pages/LoadingPage";
import useAuthStore from "@/stores/authStore";

export const ProtectedAdminRoute = ({ children }) => {
  const { userData } = useContext(AuthContext);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  // If not authenticated at all, redirect to admin login
  if (!isAuthenticated) {
    return <CustomNavigate to="/login/admin" replace />;
  }
  
  // If authenticated but not admin, redirect to admin login
  if (userData && !isAdmin) {
    return <CustomNavigate to="/login/admin" replace />;
  }
  
  // If still loading user data, show loading
  if (!userData) {
    return <LoadingPage />;
  }

  // If authenticated and is admin, allow access
  return children;
};
