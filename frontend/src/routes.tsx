import { redirect, type RouteObject } from "react-router-dom";
import ErrorBoundary from "./layout/ErrorBoundary";
import ProtectedRoute from "./layout/ProtectedRoute";

function lazy(moduleLoader: () => Promise<any>) {
  return async () => {
    const component = await moduleLoader();
    return { Component: component.default };
  };
}

const adminRoutes: RouteObject[] = [
  {
    path: "dashboard",
    lazy: lazy(() => import("./pages/dashboard/home")),
  },
]

const gardenerRoutes: RouteObject[] = [
  {
    path: "dashboard",
    lazy: lazy(() => import("./pages/dashboard/home")),
  },
]

const routes: RouteObject[] = [
  {
    path: "/",
    lazy: lazy(() => import("./pages/auth/login")),
  },
  {
    path: "login",
    lazy: lazy(() => import("./pages/auth/login")),
  },
  {
    path: "dashboard",
    lazy: lazy(() => import("./pages/dashboard/home")),
  },
  {
    path: "/admin",
    children: adminRoutes,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/gardener",
    children: gardenerRoutes,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "*",
    element: <ErrorBoundary />,
  },


  // Test api
  {
    path: "/api",
    lazy: lazy(() => import("./pages/userManagement/testApi")),
  },
];

export default routes;