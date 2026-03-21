import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = () => {
    const { session, isLoading, onboardingCompleted } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-black">
                {/* Animated logo */}
                <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                        </svg>
                    </div>
                    {/* Spinning ring */}
                    <div className="absolute -inset-1.5 rounded-[20px] border-2 border-transparent border-t-[#2563eb] animate-spin" />
                </div>

                {/* Wordmark */}
                <div className="text-center">
                    <p className="text-[20px] font-semibold text-white tracking-tight">Licensly</p>
                    <p className="text-[13px] text-[#666666] mt-1 animate-pulse">Unlocking your license intelligence...</p>
                </div>

                {/* Bouncing dots */}
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-[#2563eb] animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                        />
                    ))}
                </div>
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
