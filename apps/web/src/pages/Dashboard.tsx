import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { AlertCircle, CreditCard, Users, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { Badge } from '../components/ui/badge';

// Mock Data for MVP rendering
const platformSpend = [
    { name: 'Slack', spend: 850 },
    { name: 'Google WS', spend: 1200 },
    { name: 'Adobe CC', spend: 2400 },
    { name: 'GitHub', spend: 450 },
    { name: 'Teams', spend: 600 },
];

const utilizationData = [
    { name: 'Active', value: 125, color: 'hsl(var(--chart-1))' },
    { name: 'Idle (>30d)', value: 45, color: 'hsl(var(--chart-2))' },
    { name: 'Unassigned', value: 30, color: 'hsl(var(--chart-3))' },
];

const alerts = [
    { id: 1, title: 'Adobe CC Renewal', desc: '15 Enterprise licenses renewing in 7 days.', severity: 'warning' },
    { id: 2, title: 'Over-provisioned GitHub', desc: 'Used 22 of 20 purchased seats.', severity: 'critical' },
    { id: 3, title: 'Slack Sync Failure', desc: 'Failed to sync users 2 hours ago.', severity: 'info' },
];

export const Dashboard = () => {
    return (
        <>
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground">Monitor your corporate SaaS licenses and identify savings.</p>
            </div>

            {/* Quick Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Monthly Spend</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$5,500.00</div>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <ArrowUpRight className="mr-1 h-3 w-3 text-red-500" />
                            <span className="text-red-500 font-medium">+4%</span> from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">$1,250.00</div>
                        <p className="text-xs text-muted-foreground flex items-center">
                            across 12 optimization recommendations
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Seats</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">125 / 200</div>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <span className="text-yellow-600 font-medium mr-1">37.5%</span> of seats are idle or unused
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Alerts</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex gap-2 items-center">
                            <Badge variant="destructive">1 Critical</Badge>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">1 Warning</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* Bar Chart: Platform Spend */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Spend by Platform</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={platformSpend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--muted)' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                                        formatter={(value: number) => [`$${value}`, 'Spend']}
                                    />
                                    <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Donut Chart: Utilization */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Seat Utilization</CardTitle>
                        <CardDescription>Aggregate across all active integrations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={utilizationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {utilizationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [`${value} Seats`, 'Count']} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts & Next Renewals */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Alerts</CardTitle>
                        <CardDescription>Compliance flags and system notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {alerts.map((alert) => (
                                <div key={alert.id} className="flex items-start gap-4 rounded-lg border p-3">
                                    <AlertCircle className={`mt-0.5 h-5 w-5 ${alert.severity === 'critical' ? 'text-red-500' :
                                            alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                                        }`} />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{alert.title}</p>
                                        <p className="text-sm text-muted-foreground">{alert.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Renewals</CardTitle>
                        <CardDescription>Licenses renewing in the next 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Mock renewals */}
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Adobe CC Enterprise</p>
                                    <p className="text-sm text-muted-foreground">15 seats • $1800/yr</p>
                                </div>
                                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">In 7 Days</Badge>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Zoom Pro</p>
                                    <p className="text-sm text-muted-foreground">50 seats • $750/mo</p>
                                </div>
                                <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">In 12 Days</Badge>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Dropbox Business</p>
                                    <p className="text-sm text-muted-foreground">10 seats • $150/mo</p>
                                </div>
                                <Badge variant="outline" className="bg-muted">In 28 Days</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};
