import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Search, Download, Loader2, FileX, ArrowUpDown, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type SortField = 'platform' | 'seats_purchased' | 'cost_per_seat' | 'renewal_date' | 'utilization';
type SortDir = 'asc' | 'desc';

export const Licenses = () => {
    const navigate = useNavigate();
    const [licenses, setLicenses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [platformFilter, setPlatformFilter] = useState('all');
    const [sortField, setSortField] = useState<SortField>('platform');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    useEffect(() => { fetchLicenses(); }, []);

    const fetchLicenses = async () => {
        try {
            const { data, error } = await supabase.from('licenses').select('*').order('created_at', { ascending: false });
            if (!error && data) setLicenses(data);
        } catch (error) { console.error('Error:', error); }
        finally { setIsLoading(false); }
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
                <Button variant="outline" onClick={exportCSV}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            {licenses.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="bg-muted p-4 rounded-full mb-4"><FileX className="h-8 w-8 text-muted-foreground" /></div>
                    <CardTitle className="text-xl mb-2">No licenses tracked yet</CardTitle>
                    <CardDescription className="max-w-md mb-6">Connect integrations to auto-discover your licenses, or add them during onboarding.</CardDescription>
                    <Button onClick={() => navigate('/integrations')}>Connect Integrations</Button>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search licenses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                            </div>
                            <select
                                value={platformFilter}
                                onChange={e => setPlatformFilter(e.target.value)}
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">All Platforms</option>
                                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortHeader field="platform">Platform</SortHeader>
                                    <TableHead>Plan</TableHead>
                                    <SortHeader field="seats_purchased">Seats</SortHeader>
                                    <SortHeader field="utilization">Utilization</SortHeader>
                                    <SortHeader field="cost_per_seat">Cost/Seat</SortHeader>
                                    <TableHead>Monthly</TableHead>
                                    <SortHeader field="renewal_date">Renewal</SortHeader>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? filtered.map(lic => {
                                    const util = getUtilization(lic.seats_used, lic.seats_purchased);
                                    return (
                                        <TableRow key={lic.id}>
                                            <TableCell className="font-medium">{lic.platform}</TableCell>
                                            <TableCell><Badge variant="outline">{lic.plan_name}</Badge></TableCell>
                                            <TableCell>{lic.seats_used} / {lic.seats_purchased}</TableCell>
                                            <TableCell><span className={`font-medium ${getUtilColor(util)}`}>{util}%</span></TableCell>
                                            <TableCell>${Number(lic.cost_per_seat).toFixed(2)}</TableCell>
                                            <TableCell className="font-medium">${(Number(lic.cost_per_seat) * lic.seats_purchased).toLocaleString()}</TableCell>
                                            <TableCell>{lic.renewal_date ? new Date(lic.renewal_date).toLocaleDateString() : '—'}</TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No licenses match your filters.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
