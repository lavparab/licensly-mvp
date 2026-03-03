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
            <div className="grid min-h-screen w-full md:grid-cols-[256px_1fr]">
                {/* Desktop Sidebar */}
                <Sidebar className="hidden md:flex" />

                {/* Main Content Area */}
                <div className="flex flex-col">
                    <Header />
                    <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 bg-muted/40 overflow-y-auto">
                        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 py-6">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
}
