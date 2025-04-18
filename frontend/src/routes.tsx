import {  type RouteObject } from "react-router-dom";
import ErrorBoundary from "./layout/ErrorBoundary";
// import ProtectedRoute from "./layout/ProtectedRoute";
import { Navigate} from "react-router-dom";

import { Suspense, lazy } from "react";
const DashboardLayout = lazy(() => import('./layout/dashboard_layout'));
const HomePage = lazy(() => import('./pages/dashboard/home'));
const SettingPage = lazy(() => import('./pages/setting/setting'));
const DevicePage = lazy(() => import('./pages/device/device'));
const HistoryPage = lazy(() => import('./pages/log/log'));
const UserManagementPage = lazy(() => import('./pages/userManagement/userManager'));


const LoginPage = lazy(() => import('./pages/auth/login'));


 const AuthGuard = ({ children }: { children: React.ReactNode }) => {
 	const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true' || sessionStorage.getItem('isAuthenticated') === 'true';

 	if (!isAuthenticated) {
 		return <Navigate to='/' replace />;
 	}
 	return children;
};

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
    element: (
		<Suspense fallback={<LoadingSpinner />}>
			  <LoginPage />
		</Suspense>
	),
  },
  {
    path: "login",
    element: (
		<Suspense fallback={<LoadingSpinner />}>
			  <LoginPage />
		</Suspense>
	),
  },
  {
    path: 'dashboard',
			element: (
				<AuthGuard>
				<Suspense fallback={<LoadingSpinner />}>
					<DashboardLayout />
				</Suspense>
				</AuthGuard>
			),
			children: [
				{
					index: true,
					element: <Navigate to="home" replace />,
				},
        		{
          
					path: 'home',
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							<HomePage />
						</Suspense>
					),
				},
				{
					path: 'device',
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							<DevicePage/>
						</Suspense>
					),
				},
{
					path: 'usermanager',
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							<UserManagementPage/>
						</Suspense>
					),
				},
        		{
					path: 'history',
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							<HistoryPage/>
						</Suspense>
					),
				},
        		{
					path: 'setting',
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							<SettingPage />
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
];

export default routes;
