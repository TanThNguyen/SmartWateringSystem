import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  redirectPath: string;
  loginTokenName: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath,
  loginTokenName,
  children,
}) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loginToken, setLoginToken] = useState<string | null>(localStorage.getItem(loginTokenName));

  useEffect(() => {

    const syncTokens = () => {
      setToken(localStorage.getItem("token"));
      setLoginToken(
        localStorage.getItem(loginTokenName)
      );
    };

    syncTokens();

    window.addEventListener("storage", syncTokens);

    return () => {
      window.removeEventListener("storage", syncTokens);
    };
  }, []);
  
  if (loginToken) {
    const { expiration } = JSON.parse(loginToken);
    const now = new Date().getTime();
    if (now > Number(expiration)) {
      localStorage.clear();
      return;
    }
  }

  if (!token || !loginToken) {
    return <Navigate to={redirectPath} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
