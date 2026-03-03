import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, Filter, Download, MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../components/ui/dropdown-menu';

// Mock licenses array
const MOCK_LICENSES = [
    { id: '1', platform: 'Slack', plan: 'Enterprise Grid', purchased: 200, used: 185, util: 92.5, cost: 15.0, status: 'Active', renewal: '2027-01-15' },
    { id: '2', platform: 'Google Workspace', plan: 'Business Plus', purchased: 150, used: 150, util: 100, cost: 18.0, status: 'Active', renewal: '2026-11-20' },
    { id: '3', platform: 'Adobe Creative Cloud', plan: 'All Apps', purchased: 25, used: 12, util: 48.0, cost: 84.99, status: 'Underutilized', renewal: '2026-08-01' },
    { id: '4', platform: 'GitHub', plan: 'Enterprise', purchased: 50, used: 52, util: 104, cost: 21.0, status: 'Overused', renewal: '2026-10-10' },
    { id: '5', platform: 'Zoom', plan: 'Pro', purchased: 100, used: 40, util: 40.0, cost: 14.99, status: 'Underutilized', renewal: '2026-12-05' },
    { id: '6', platform: 'Microsoft Teams', plan: 'E3', purchased: 150, used: 145, util: 96.6, cost: 23.0, status: 'Active', renewal: '2027-02-28' },
];

export const Licenses = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLicenses = MOCK_LICENSES.filter(l =>
        l.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.plan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Licenses</h1>
                    <p className="text-muted-foreground">Manage and track your corporate SaaS subscriptions.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button>Add License</Button>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex flex-col gap-1">
                        <CardTitle>All Subscriptions</CardTitle>
                        <CardDescription>View utilization and cost details for all tracked platforms.</CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search platforms or plans..."
                                className="pl-8 bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" className="shrink-0">
                            <Filter className="h-4 w-4" />
                            <span className="sr-only">Filter</span>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Platform / Plan</TableHead>
                                    <TableHead className="text-center">Purchased</TableHead>
                                    <TableHead className="text-center">Used (Active)</TableHead>
                                    <TableHead className="text-center">Utilization</TableHead>
                                    <TableHead className="text-right">Cost/Seat (Mo)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden md:table-cell">Renewal</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLicenses.length > 0 ? (
                                    filteredLicenses.map((license) => (
                                        <TableRow key={license.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{license.platform}</span>
                                                    <span className="text-xs text-muted-foreground font-normal">{license.plan}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">{license.purchased}</TableCell>
                                            <TableCell className="text-center font-medium">{license.used}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-xs">{license.util}%</span>
                                                    <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${license.util > 100 ? 'bg-destructive' :
                                                                    license.util < 60 ? 'bg-yellow-500' : 'bg-primary'
                                                                }`}
                                                            style={{ width: `${Math.min(license.util, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">${license.cost.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    license.status === 'Active' ? 'default' :
                                                        license.status === 'Overused' ? 'destructive' : 'secondary'
                                                }>
                                                    {license.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">
                                                {license.renewal}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Open menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>View Users</DropdownMenuItem>
                                                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
