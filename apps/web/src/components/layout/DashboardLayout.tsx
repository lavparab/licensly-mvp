import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../context/AuthContext';
import { TooltipProvider } from '../ui/tooltip';

export function DashboardLayout() {
    const { session, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return (
        <TooltipProvider>
            <div className="flex min-h-screen w-full">
                {/* Desktop Sidebar */}
                <Sidebar className="hidden md:flex fixed inset-y-0 left-0 z-20" />

                {/* Main Content Area */}
                <div className="flex flex-col w-full md:pl-[240px]">
                    <Header />
                    <main className="flex-1 p-4 sm:px-6 md:gap-8 bg-[var(--bg-primary)]">
                        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 py-6 animate-fade-up">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
}
