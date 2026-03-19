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
                    'flex items-center gap-3 rounded-[6px] px-3 h-9 text-[13px] font-medium transition-all relative',
                    isActive
                        ? 'bg-[#1a1a1a] text-white border-l-2 border-white'
                        : 'text-[#666666] hover:text-[#ededed] hover:bg-[#111111]'
                )}
            >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {item.name}
            </Link>
        );
    };

    return (
        <div className={cn('hidden h-screen w-[240px] flex-col bg-[var(--sidebar-bg)] md:flex', className)}>
            {/* Logo */}
            <div className="flex h-14 items-center border-b border-[var(--sidebar-border)] px-5">
                <Link to="/" className="flex items-center gap-2.5">
                    <Key className="h-5 w-5 text-white" strokeWidth={1.5} />
                    <span className="font-serif text-xl text-white tracking-tight">Licensly</span>
                </Link>
            </div>

            {/* Main Nav */}
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid gap-0.5 px-3">{navItems.map(renderLink)}</nav>
            </div>

            {/* Bottom Nav */}
            <div className="border-t border-[var(--sidebar-border)] p-3">
                <nav className="grid gap-0.5">{bottomNavItems.map(renderLink)}</nav>
            </div>
        </div>
    );
}
