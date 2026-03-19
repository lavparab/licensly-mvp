import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Search, Download, Loader2, FileX, ArrowUpDown, Key, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AddLicenseModal } from '../components/AddLicenseModal';

type SortField = 'platform' | 'seats_purchased' | 'cost_per_seat' | 'renewal_date' | 'utilization';
type SortDir = 'asc' | 'desc';

export const Licenses = () => {
    const navigate = useNavigate();
    const { session } = useAuth();
    const [licenses, setLicenses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [platformFilter, setPlatformFilter] = useState('all');
    const [sortField, setSortField] = useState<SortField>('platform');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editTarget, setEditTarget] = useState<any | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (session) fetchLicenses();
    }, [session]);

    const fetchLicenses = async () => {
        try {
            const maxLimit = 100; // Fetch enough for client-side filtering
            const data = await api.get(`/api/licenses?limit=${maxLimit}`);
            if (data && data.licenses) setLicenses(data.licenses);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to load licenses');
        }
        finally { setIsLoading(false); }
    };

    const handleEdit = (license: any) => {
        setEditTarget(license);
        setShowAddModal(true);
    };

    const handleDelete = (id: string) => setDeleteTarget(id);

    const confirmDelete = async (id: string) => {
        try {
            await api.delete(`/api/licenses/${id}`);
            toast.success('License deleted');
            fetchLicenses();
        } catch (err) {
            toast.error('Failed to delete license');
        }
        setDeleteTarget(null);
    };

    const platforms = useMemo(() => [...new Set(licenses.map(l => l.platform))], [licenses]);

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const filtered = useMemo(() => {
        let data = [...licenses];
        if (search) data = data.filter(l => l.platform.toLowerCase().includes(search.toLowerCase()) || l.plan_name?.toLowerCase().includes(search.toLowerCase()));
        if (platformFilter !== 'all') data = data.filter(l => l.platform === platformFilter);

        data.sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case 'platform': cmp = a.platform.localeCompare(b.platform); break;
                case 'seats_purchased': cmp = a.seats_purchased - b.seats_purchased; break;
                case 'cost_per_seat': cmp = Number(a.cost_per_seat) - Number(b.cost_per_seat); break;
                case 'renewal_date': cmp = new Date(a.renewal_date || 0).getTime() - new Date(b.renewal_date || 0).getTime(); break;
                case 'utilization': cmp = (a.seats_used / (a.seats_purchased || 1)) - (b.seats_used / (b.seats_purchased || 1)); break;
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return data;
    }, [licenses, search, platformFilter, sortField, sortDir]);

    const exportCSV = () => {
        if (filtered.length === 0) { toast.error('No data to export'); return; }
        const headers = ['Platform', 'Plan', 'Seats Purchased', 'Seats Used', 'Cost/Seat', 'Billing', 'Renewal Date'];
        const rows = filtered.map(l => [l.platform, l.plan_name, l.seats_purchased, l.seats_used, l.cost_per_seat, l.billing_cycle, l.renewal_date]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `licenses-${new Date().toISOString().split('T')[0]}.csv`; a.click();
        URL.revokeObjectURL(url);
        toast.success('Licenses exported!');
    };

    const getUtilization = (used: number, total: number) => total === 0 ? 0 : Math.round((used / total) * 100);
    const getUtilColor = (pct: number) => pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-yellow-600' : 'text-green-600';

    const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => handleSort(field)}>
            <div className="flex items-center gap-1">
                {children}
                <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground/40'}`} />
            </div>
        </TableHead>
    );

    if (isLoading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">License Tracker</h1>
                    <p className="text-muted-foreground">Manage all your SaaS licenses in one place.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowAddModal(true)} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
                        <Plus className="mr-2 h-4 w-4" strokeWidth={2} /> Add License
                    </Button>
                    <Button variant="outline" onClick={exportCSV}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            {licenses.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
                    <div className="bg-muted p-4 rounded-full mb-4"><FileX className="h-8 w-8 text-muted-foreground" /></div>
                    <CardTitle className="text-xl mb-2">No licenses tracked yet</CardTitle>
                    <CardDescription className="max-w-md mb-6">Connect integrations to auto-discover your licenses, or add them during onboarding.</CardDescription>
                    <Button onClick={() => navigate('/integrations')}>Connect Integrations</Button>
                </Card>
            ) : (
                <Card className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#2e2e2e]">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search licenses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white dark:bg-[#111111] border-gray-200 dark:border-[#2e2e2e] text-gray-900 dark:text-[#ededed] placeholder:text-gray-400 dark:placeholder:text-[#666666]" />
                            </div>
                            <select
                                value={platformFilter}
                                onChange={e => setPlatformFilter(e.target.value)}
                                className="h-10 rounded-md border border-gray-200 dark:border-[#2e2e2e] bg-white dark:bg-[#111111] text-gray-900 dark:text-[#ededed] px-3 text-sm focus:outline-none"
                            >
                                <option value="all">All Platforms</option>
                                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader className="bg-gray-50 dark:bg-[#111111]">
                                <TableRow>
                                    <SortHeader field="platform">Platform</SortHeader>
                                    <TableHead>Plan</TableHead>
                                    <SortHeader field="seats_purchased">Seats</SortHeader>
                                    <SortHeader field="utilization">Utilization</SortHeader>
                                    <SortHeader field="cost_per_seat">Cost/Seat</SortHeader>
                                    <TableHead>Monthly</TableHead>
                                    <SortHeader field="renewal_date">Renewal</SortHeader>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? filtered.map(lic => {
                                    const util = getUtilization(lic.seats_used, lic.seats_purchased);
                                    return (
                                        <TableRow key={lic.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                                            <TableCell className="font-medium text-gray-900 dark:text-[#ededed]">{lic.platform}</TableCell>
                                            <TableCell><Badge variant="outline" className="dark:border-[#2e2e2e] dark:text-[#a1a1a1]">{lic.plan_name}</Badge></TableCell>
                                            <TableCell className="text-gray-900 dark:text-[#ededed]">{lic.seats_used} / {lic.seats_purchased}</TableCell>
                                            <TableCell><span className={`font-medium ${getUtilColor(util)}`}>{util}%</span></TableCell>
                                            <TableCell className="text-gray-900 dark:text-[#ededed]">${Number(lic.cost_per_seat).toFixed(2)}</TableCell>
                                            <TableCell className="font-medium text-gray-900 dark:text-[#ededed]">${(Number(lic.cost_per_seat) * lic.seats_purchased).toLocaleString()}</TableCell>
                                            <TableCell className="text-gray-900 dark:text-[#ededed]">{lic.renewal_date ? new Date(lic.renewal_date).toLocaleDateString() : '—'}</TableCell>
                                            <TableCell>
                                                <div className="relative" ref={openMenuId === lic.id ? menuRef : undefined}>
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === lic.id ? null : lic.id)}
                                                        className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100 transition-colors"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                    </button>
                                                    {openMenuId === lic.id && (
                                                        <div className="absolute right-0 top-9 w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]">
                                                            <div className="p-1">
                                                                <button
                                                                    onClick={() => { setOpenMenuId(null); handleEdit(lic); }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                                                                >
                                                                    <Pencil className="h-4 w-4 text-gray-500" /> Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => { setOpenMenuId(null); handleDelete(lic.id); }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded-md transition-colors text-left"
                                                                >
                                                                    <Trash2 className="h-4 w-4" /> Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-gray-500 dark:text-[#a1a1a1] py-8">No licenses match your filters.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <AddLicenseModal
                open={showAddModal}
                initialData={editTarget}
                onClose={() => {
                    setShowAddModal(false);
                    setEditTarget(null);
                }}
                onSuccess={() => {
                    setShowAddModal(false);
                    setEditTarget(null);
                    fetchLicenses(); // refresh the list
                }}
            />

            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete License?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete this license and all its assignments. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => confirmDelete(deleteTarget!)}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
