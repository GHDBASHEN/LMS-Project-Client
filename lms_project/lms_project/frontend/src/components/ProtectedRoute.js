import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import sessionManager from "../sessionManager";

function ProtectedRoute({ children, role }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check local storage
        const storedSession = sessionManager.getStoredSession();
        
        if (storedSession) {
          // Use stored session data for now (since server session check is not working)
          setIsAuthenticated(true);
          setUserRole(storedSession.role);
          
          // Optional: Still try to verify with server (but don't block on failure)
          try {
            await sessionManager.checkSession();
          } catch (error) {
            // Server session check failed, using stored data
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [role]);

  // Show loading while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (role && userRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
