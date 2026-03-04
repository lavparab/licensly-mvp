import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = () => {
    const { session, isLoading, onboardingCompleted } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!session) {
        // Redirect to login but save the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check onboarding status
    const isOnboardingRoute = location.pathname === '/onboarding';

    // If onboarding is not completed, and we are not already on the onboarding page, redirect to onboarding
    if (onboardingCompleted === false && !isOnboardingRoute) {
        return <Navigate to="/onboarding" replace />;
    }

    // If onboarding is completed, and we try to access the onboarding page, redirect to dashboard
    if (onboardingCompleted === true && isOnboardingRoute) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
