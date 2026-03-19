import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bell, Menu, User, LogOut, ChevronRight, Building, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
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
    const [bellOpen, setBellOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);

    const bellRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);

    const currentPage = PAGE_NAMES[location.pathname] || 'Dashboard';

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
            if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                if (res?.notifications?.length) setNotifications(res.notifications);
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
        setUserOpen(false);
        await signOut();
        window.location.href = '/login';
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const userInitials = user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
    const userDisplayName = user?.user_metadata?.full_name || user?.email || 'User';

    return (
        <header className="sticky top-0 z-10 flex h-[52px] shrink-0 items-center gap-4 border-b border-gray-200 dark:border-[#2e2e2e] bg-white dark:bg-black px-4 lg:px-6">

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
                <Link to="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 dark:text-[#666666] dark:hover:text-[#ededed] transition-colors">
                    Home
                </Link>
                <ChevronRight className="h-3 w-3 text-gray-400 dark:text-[#666666]" />
                <span className="text-sm font-medium text-gray-900 dark:text-[#ededed]">{currentPage}</span>
            </div>

            <div className="flex items-center gap-2 md:ml-auto">

                {/* Notification Bell */}
                <div className="relative" ref={bellRef}>
                    <button
                        onClick={() => { setBellOpen(!bellOpen); setUserOpen(false); }}
                        className="relative flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 dark:border-[#2e2e2e] bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors"
                    >
                        <Bell className="h-[18px] w-[18px] text-gray-600 dark:text-[#a1a1a1]" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {bellOpen && (
                        <div className="absolute right-0 top-11 w-[360px] max-h-[400px] overflow-y-auto bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#2e2e2e] rounded-lg shadow-xl z-[9999]">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#2e2e2e] sticky top-0 bg-white dark:bg-[#111111]">
                                <span className="font-semibold text-sm text-gray-900 dark:text-[#ededed]">Notifications</span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                        <Check className="h-3 w-3" /> Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col">
                                {notifications.length > 0 ? notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => markRead(notif.id)}
                                        className={`flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-[#2e2e2e] cursor-pointer last:border-0 transition-colors ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'}`}
                                    >
                                        <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${notif.type === 'success' ? 'bg-green-500' : notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                        <div className="flex flex-col gap-0.5 w-full">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className={`text-[13px] text-gray-900 dark:text-[#ededed] ${!notif.read ? 'font-semibold' : 'font-medium'}`}>{notif.title}</span>
                                                <span className="text-[11px] text-gray-400 dark:text-[#666666] whitespace-nowrap pt-0.5">{notif.time}</span>
                                            </div>
                                            <span className="text-[12px] text-gray-500 dark:text-[#666666] line-clamp-2">{notif.message}</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-sm text-center text-gray-400 dark:text-[#666666]">
                                        No new notifications
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative ml-1" ref={userRef}>
                    <button
                        onClick={() => { setUserOpen(!userOpen); setBellOpen(false); }}
                        className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2e2e2e] hover:bg-gray-200 dark:hover:bg-[#2e2e2e] transition-colors"
                    >
                        <span className="text-[13px] font-medium text-gray-700 dark:text-[#ededed]">{userInitials}</span>
                    </button>

                    {userOpen && (
                        <div className="absolute right-0 top-10 w-[220px] bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#2e2e2e] rounded-lg shadow-xl z-[9999]">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2e2e2e] bg-gray-50 dark:bg-[#1a1a1a] rounded-t-lg">
                                <p className="font-semibold text-[14px] text-gray-900 dark:text-[#ededed] truncate">{userDisplayName}</p>
                                <p className="text-[12px] text-gray-500 dark:text-[#666666] truncate">{orgName}</p>
                            </div>
                            <div className="p-1">
                                <button
                                    onClick={() => { setUserOpen(false); navigate('/settings'); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 dark:text-[#a1a1a1] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-md transition-colors text-left"
                                >
                                    <User className="h-4 w-4 text-gray-500 dark:text-[#666666] shrink-0" /> Profile Settings
                                </button>
                                <button
                                    onClick={() => { setUserOpen(false); navigate('/settings'); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 dark:text-[#a1a1a1] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-md transition-colors text-left"
                                >
                                    <Building className="h-4 w-4 text-gray-500 dark:text-[#666666] shrink-0" /> Organization
                                </button>
                                <div className="my-1 border-t border-gray-100 dark:border-[#2e2e2e]" />
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors text-left"
                                >
                                    <LogOut className="h-4 w-4 shrink-0" /> Log out
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
}