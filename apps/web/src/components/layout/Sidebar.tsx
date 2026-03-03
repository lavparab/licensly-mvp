import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
    LayoutDashboard,
    Key,
    Unplug,
    Sparkles,
    ShieldAlert,
    FileBox,
    Settings
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Licenses', href: '/licenses', icon: Key },
    { name: 'Integrations', href: '/integrations', icon: Unplug },
    { name: 'Optimization', href: '/optimization', icon: Sparkles },
    { name: 'Compliance', href: '/compliance', icon: ShieldAlert },
    { name: 'Reports', href: '/reports', icon: FileBox },
];

const bottomNavItems = [
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
    const location = useLocation();

    const renderLink = (item: any) => {
        const isActive = location.pathname.startsWith(item.href);
        return (
            <Link
                key={item.href}
                to={item.href}
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
            >
                <item.icon className="h-4 w-4" />
                {item.name}
            </Link>
        );
    };

    return (
        <div className={cn('hidden h-screen w-64 flex-col border-r bg-card md:flex', className)}>
            <div className="flex h-14 items-center border-b px-6">
                <Link to="/" className="flex items-center gap-2 font-bold text-primary text-xl tracking-tight">
                    <Key className="h-5 w-5" />
                    <span>Licensly</span>
                </Link>
            </div>

            <div className="flex-1 overflow-auto py-4">
                <nav className="grid gap-1 px-4">{navItems.map(renderLink)}</nav>
            </div>

            <div className="border-t p-4">
                <nav className="grid gap-1">{bottomNavItems.map(renderLink)}</nav>
            </div>
        </div>
    );
}
