import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bell, Menu, User, Settings, LogOut, ChevronRight, Building, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Sidebar } from './Sidebar';
import { api } from '../../lib/api';

const PAGE_NAMES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/licenses': 'Licenses',
    '/integrations': 'Integrations',
    '/optimization': 'Optimization',
    '/compliance': 'Compliance',
    '/reports': 'Reports',
    '/settings': 'Settings',
};

const demoNotifications = [
    { id: 1, title: 'GitHub sync completed', message: '23 members synced successfully', time: '2 min ago', read: false, type: 'success' },
    { id: 2, title: 'License expiring soon', message: 'Adobe Creative Cloud renews in 7 days', time: '1 hour ago', read: false, type: 'warning' },
    { id: 3, title: 'New member detected', message: '2 new GitHub members need license assignment', time: '3 hours ago', read: true, type: 'info' },
];

export function Header() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [notifications, setNotifications] = useState<any[]>(demoNotifications);
    const [orgName, setOrgName] = useState('Acme Corp');

    const currentPage = PAGE_NAMES[location.pathname] || 'Dashboard';

    useEffect(() => {
        const loadOrg = async () => {
            try {
                const res = await api.get('/api/settings/organization');
                if (res?.name) setOrgName(res.name);
            } catch (e) {
                // Ignore API error and persist default state
            }
        };

        const loadNotifs = async () => {
            try {
                const res = await api.get('/api/notifications');
                if (res?.length) setNotifications(res);
            } catch (e) {
                // Ignore API error and persist demo state
            }
        };

        loadOrg();
        loadNotifs();
    }, []);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/login';
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const userInitials = user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
    const userDisplayName = user?.user_metadata?.full_name || user?.email || 'User';

    return (
        <header className="sticky top-0 z-10 flex h-[52px] shrink-0 items-center gap-4 border-b border-[var(--border)] bg-[var(--bg-primary)] px-4 lg:px-6">

            {/* Mobile Sidebar Toggle */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                    <Sidebar className="flex w-full" />
                </SheetContent>
            </Sheet>

            {/* Breadcrumb */}
            <div className="w-full flex-1 flex items-center gap-2">
                <Link to="/dashboard" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    Home
                </Link>
                <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">{currentPage}</span>
            </div>

            <div className="flex items-center gap-2 md:ml-auto">

                {/* Notification Bell */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="relative rounded-[6px] h-9 w-9">
                            <Bell className="h-[18px] w-[18px] text-[var(--text-secondary)]" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm">
                                    {unreadCount}
                                </span>
                            )}
                            <span className="sr-only">Notifications</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[360px] max-h-[400px] overflow-y-auto p-0 rounded-[8px] border-[var(--border)] shadow-md">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-primary)] z-10">
                            <span className="font-semibold text-[14px] text-[var(--text-primary)]">Notifications</span>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-[12px] text-[var(--accent)] hover:underline flex items-center gap-1 font-medium">
                                    <Check className="h-3 w-3" /> Mark all as read
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <DropdownMenuItem
                                        key={notif.id}
                                        className={`cursor-pointer flex items-start gap-3 px-4 py-3.5 rounded-none border-b border-[var(--border)] last:border-0 ${!notif.read ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-[var(--bg-secondary)]'}`}
                                        onClick={() => markRead(notif.id)}
                                    >
                                        <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${notif.type === 'success' ? 'bg-green-500' : notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                        <div className="flex flex-col gap-0.5 w-full">
                                            <div className="flex justify-between items-start w-full gap-2">
                                                <span className={`text-[13px] text-[var(--text-primary)] ${!notif.read ? 'font-semibold' : 'font-medium'}`}>{notif.title}</span>
                                                <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap pt-0.5">{notif.time}</span>
                                            </div>
                                            <span className="text-[12px] text-[var(--text-muted)] line-clamp-2 leading-relaxed pr-2">{notif.message}</span>
                                        </div>
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <div className="p-8 text-sm text-center text-[var(--text-muted)]">
                                    No new notifications
                                </div>
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full h-8 w-8 ml-1 bg-[var(--bg-tertiary)] border border-[var(--border)] shadow-sm hover:shadow transition-shadow">
                            <span className="text-[13px] font-medium text-[var(--text-primary)]">
                                {userInitials}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[220px] rounded-[8px] p-0 border-[var(--border)] shadow-md">
                        <div className="px-4 py-3 flex flex-col gap-0.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] rounded-t-[7px]">
                            <span className="font-semibold text-[14px] text-[var(--text-primary)] truncate">{userDisplayName}</span>
                            <span className="text-[12px] text-[var(--text-muted)] truncate">{orgName}</span>
                        </div>
                        <div className="p-1">
                            <DropdownMenuItem className="cursor-pointer text-[13px] px-3 py-2 rounded-[4px] hover:bg-[var(--bg-secondary)]" onClick={() => navigate('/settings/profile')}>
                                <User className="mr-2.5 h-4 w-4 text-[var(--text-secondary)]" /> Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-[13px] px-3 py-2 rounded-[4px] hover:bg-[var(--bg-secondary)]" onClick={() => navigate('/settings/organization')}>
                                <Building className="mr-2.5 h-4 w-4 text-[var(--text-secondary)]" /> Organization
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 border-[var(--border)]" />
                            <DropdownMenuItem 
                                onClick={handleSignOut} 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-[13px] px-3 py-2 rounded-[4px]"
                            >
                                <LogOut className="mr-2.5 h-4 w-4" /> Log out
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
