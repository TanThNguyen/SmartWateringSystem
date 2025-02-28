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

]

const gardenerRoutes: RouteObject[] = [

]

const routes: RouteObject[] = [
  {
    path: "login",
    lazy: lazy(() => import("./pages/auth/login")),
  },
  {
    path: "dashboard",
    lazy: lazy(() => import("./pages/dashboard/home")),
  },
]

export default routes;