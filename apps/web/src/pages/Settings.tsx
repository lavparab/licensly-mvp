import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { UserPlus, Shield, Key, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const Settings = () => {
    const { user } = useAuth();
    const [organization, setOrganization] = useState<any>(null);
    const [team, setTeam] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchSettingsData();
        }
    }, [user]);

    const fetchSettingsData = async () => {
        if (!user) return;

        try {
            // 1. Fetch current user's profile to get org_id
            const { data: profileData, error: profileError } = await supabase
                .from('users')
                .select('org_id')
                .eq('id', user.id)
                .single();

            if (profileError || !profileData?.org_id) return;
            const orgId = profileData.org_id;

            // 2. Fetch Organization Data
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', orgId)
                .single();

            if (!orgError && orgData) {
                setOrganization(orgData);
            }

            // 3. Fetch Team Data
            const { data: teamData, error: teamError } = await supabase
                .from('users')
                .select('*')
                .eq('org_id', orgId)
                .order('created_at', { ascending: true });

            if (!teamError && teamData) {
                setTeam(teamData);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

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
                                <Input defaultValue={organization?.name || ''} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Primary Domain</label>
                                <Input defaultValue={organization?.domain || ''} disabled />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Industry</label>
                                <Input defaultValue={organization?.industry || ''} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Company Size</label>
                                <Input defaultValue={organization?.company_size || ''} />
                            </div>
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
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {team.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="font-medium">{member.full_name || 'Unnamed User'}</div>
                                                <div className="text-xs text-muted-foreground">{member.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                                    {member.role || 'user'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {member.onboarding_completed ? (
                                                    <div className="flex items-center text-xs text-green-600">
                                                        <Shield className="mr-1 h-3 w-3" /> Active
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-xs text-yellow-600">
                                                        <Key className="mr-1 h-3 w-3" /> Pending Onboarding
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="text-muted-foreground">Edit</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {team.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                No team members found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};
