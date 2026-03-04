import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bell, Menu, User, Settings, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Sidebar } from './Sidebar';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase';

const PAGE_NAMES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/licenses': 'Licenses',
    '/integrations': 'Integrations',
    '/optimization': 'Optimization',
    '/compliance': 'Compliance',
    '/reports': 'Reports',
    '/settings': 'Settings',
};

export function Header() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [alerts, setAlerts] = useState<any[]>([]);

    const currentPage = PAGE_NAMES[location.pathname] || 'Dashboard';

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const { data } = await supabase
                .from('compliance_alerts')
                .select('*')
                .eq('is_resolved', false)
                .order('created_at', { ascending: false })
                .limit(5);
            if (data) setAlerts(data);
        } catch (err) {
            console.error('Error fetching alerts', err);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">

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
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Home
                </Link>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{currentPage}</span>
            </div>

            <div className="flex items-center gap-2 md:ml-auto">

                {/* Notification Bell */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-full relative">
                            <Bell className="h-4 w-4" />
                            {alerts.length > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                                    {alerts.length}
                                </span>
                            )}
                            <span className="sr-only">Notifications</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {alerts.length > 0 ? (
                            alerts.map(alert => (
                                <DropdownMenuItem
                                    key={alert.id}
                                    className="cursor-pointer flex flex-col items-start gap-1 py-3"
                                    onClick={() => navigate('/compliance')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5">
                                            {alert.severity}
                                        </Badge>
                                        <span className="text-sm font-medium">{alert.message?.substring(0, 50)}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{alert.alert_type} alert</span>
                                </DropdownMenuItem>
                            ))
                        ) : (
                            <div className="p-4 text-sm text-center text-muted-foreground">
                                No new notifications
                            </div>
                        )}
                        {alerts.length > 0 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer justify-center text-primary" onClick={() => navigate('/compliance')}>
                                    View all alerts
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full">
                            <User className="h-5 w-5" />
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            <span className="block text-sm">Account</span>
                            <span className="block text-xs text-muted-foreground">{user?.email}</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                            <User className="mr-2 h-4 w-4" /> Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                            <Settings className="mr-2 h-4 w-4" /> Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
