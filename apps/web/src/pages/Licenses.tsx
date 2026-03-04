import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Search, Filter, Download, Plus, Loader2, FileX } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Licenses = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [licenses, setLicenses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLicenses();
    }, []);

    const fetchLicenses = async () => {
        try {
            const { data, error } = await supabase
                .from('licenses')
                .select('*')
                .order('platform', { ascending: true });

            if (!error && data) {
                setLicenses(data);
            }
        } catch (error) {
            console.error('Error fetching licenses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLicenses = licenses.filter(license =>
        license.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (license.plan_name && license.plan_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return <Badge className="bg-green-500">Active</Badge>;
            case 'expiring': return <Badge variant="destructive">Expiring Soon</Badge>;
            case 'expired': return <Badge variant="secondary">Expired</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const calculateUtilization = (assigned: number, total: number) => {
        if (!total) return 0;
        return Math.round((assigned / total) * 100);
    };

    const getUtilizationColor = (percent: number) => {
        if (percent > 95) return 'text-red-500';
        if (percent > 80) return 'text-yellow-500';
        return 'text-green-500';
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Licenses</h1>
                    <p className="text-muted-foreground">Manage and track your software subscriptions and seat allocations.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 w-4 h-4" /> Export CSV
                    </Button>
                    <Button>
                        <Plus className="mr-2 w-4 h-4" /> Add License
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search platforms..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Filter className="mr-2 h-4 w-4" /> Filter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : licenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="bg-muted p-4 rounded-full mb-4">
                                <FileX className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">No licenses found</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mb-4">
                                You haven't added any licenses yet or synced them from your integrations.
                            </p>
                            <Button>
                                <Plus className="mr-2 w-4 h-4" /> Add your first license
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Platform</TableHead>
                                        <TableHead>Plan Type</TableHead>
                                        <TableHead>Seats</TableHead>
                                        <TableHead>Utilization</TableHead>
                                        <TableHead>Cost/Seat</TableHead>
                                        <TableHead>Total Cost</TableHead>
                                        <TableHead>Renewal Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLicenses.map((license) => {
                                        const utilizationPercent = calculateUtilization(license.allocated_seats, license.total_seats);
                                        const totalCost = license.total_seats * Number(license.cost_per_seat);
                                        return (
                                            <TableRow key={license.id}>
                                                <TableCell className="font-medium">{license.platform}</TableCell>
                                                <TableCell>{license.plan_name}</TableCell>
                                                <TableCell>{license.allocated_seats} / {license.total_seats}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-secondary rounded-full h-2 max-w-[60px]">
                                                            <div
                                                                className={`h-2 rounded-full ${utilizationPercent > 95 ? 'bg-red-500' : utilizationPercent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-xs font-medium ${getUtilizationColor(utilizationPercent)}`}>
                                                            {utilizationPercent}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>${Number(license.cost_per_seat).toFixed(2)}</TableCell>
                                                <TableCell>${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                <TableCell>{license.renewal_date}</TableCell>
                                                <TableCell>{getStatusBadge(license.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">Edit</Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredLicenses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                No licenses matching your search.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
