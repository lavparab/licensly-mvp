import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { UserPlus, Shield, Key } from 'lucide-react';

const MOCK_TEAM = [
    { id: '1', name: 'Admin User', email: 'admin@acmecorp.com', role: 'Owner', mfa: true },
    { id: '2', name: 'IT Manager', email: 'it@acmecorp.com', role: 'Admin', mfa: true },
    { id: '3', name: 'Finance Lead', email: 'finance@acmecorp.com', role: 'Viewer', mfa: false },
];

export const Settings = () => {
    return (
        <div className="flex flex-col gap-6 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
                <p className="text-muted-foreground">Manage your workspace, team members, and security preferences.</p>
            </div>

            <div className="grid gap-6">

                {/* Profile / Org Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Info</CardTitle>
                        <CardDescription>Update your company's primary details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Company Name</label>
                                <Input defaultValue="Acme Corp" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Primary Domain</label>
                                <Input defaultValue="acmecorp.com" disabled />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Billing Email</label>
                            <Input defaultValue="finance@acmecorp.com" type="email" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex justify-end">
                        <Button>Save Changes</Button>
                    </CardFooter>
                </Card>

                {/* Team Management */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>Manage who has access to the Licensly dashboard.</CardDescription>
                        </div>
                        <Button size="sm">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite Member
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Security</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {MOCK_TEAM.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="font-medium">{member.name}</div>
                                            <div className="text-xs text-muted-foreground">{member.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={member.role === 'Owner' ? 'default' : 'secondary'}>
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {member.mfa ? (
                                                <div className="flex items-center text-xs text-green-600">
                                                    <Shield className="mr-1 h-3 w-3" /> MFA Enabled
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-xs text-yellow-600">
                                                    <Key className="mr-1 h-3 w-3" /> Password Only
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="text-muted-foreground">Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};
