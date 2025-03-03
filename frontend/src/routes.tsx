import {  type RouteObject } from "react-router-dom";
import ErrorBoundary from "./layout/ErrorBoundary";
// import ProtectedRoute from "./layout/ProtectedRoute";
import { Suspense, lazy } from "react";
const DashboardPage = lazy(() => import('./pages/dashboard/home'));
import { Outlet  } from 'react-router-dom';

const LoadingSpinner = () => (
	<div className='flex min-h-screen items-center justify-center'>
		<div className='h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-l-transparent border-r-transparent' />
	</div>
);
function lazya(moduleLoader: () => Promise<any>) {
  return async () => {
    const component = await moduleLoader();
    return { Component: component.default };
  };
}

const adminRoutes: RouteObject[] = [
  {
    path: "dashboard",
    lazy: lazya(() => import("./pages/dashboard/home")),
  },
];

const gardenerRoutes: RouteObject[] = [
  {
    path: "dashboard",
    lazy: lazya(() => import("./pages/dashboard/home")),
  },
];

const routes: RouteObject[] = [
  {
    path: "/",
    lazy: lazya(() => import("./pages/auth/login")),
  },
  {
    path: "login",
    lazy: lazya(() => import("./pages/auth/login")),
  },
  {
    path: 'dashboard',
			element: (
				<Suspense fallback={<LoadingSpinner />}>
          <Outlet />
				</Suspense>
			),
			children: [
				{
					index: true,
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							<DashboardPage />
						</Suspense>
					),
				},
				{
					path: 'device',
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							
						</Suspense>
					),
				},
        {
					path: 'history',
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							
						</Suspense>
					),
				},
        {
					path: 'setting',
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							
						</Suspense>
					),
				},
			],
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
    lazy: lazya(() => import("./pages/userManagement/testApi")),
  },
];

export default routes;
