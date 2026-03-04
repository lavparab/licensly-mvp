import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Building2, CreditCard, Shield, Users, Save, Loader2, Moon, Sun, Monitor } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { useTheme } from '../components/theme-provider';

export const Settings = () => {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingOrg, setIsSavingOrg] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Form states
    const [orgData, setOrgData] = useState({ id: '', name: '', domain: '', plan: '' });
    const [profileData, setProfileData] = useState({ id: '', email: '', role: '', avatar_url: '' });

    // Avatar preview state
    const [avatarInput, setAvatarInput] = useState('');

    useEffect(() => {
        if (user) fetchSettingsData();
    }, [user]);

    const fetchSettingsData = async () => {
        try {
            const { data: profile } = await supabase
                .from('users')
                .select('*, organizations(*)')
                .eq('id', user?.id)
                .single();

            if (profile) {
                setProfileData({
                    id: profile.id,
                    email: profile.email,
                    role: profile.role,
                    avatar_url: profile.avatar_url || ''
                });
                setAvatarInput(profile.avatar_url || '');

                if (profile.organizations) {
                    setOrgData({
                        id: profile.organizations.id,
                        name: profile.organizations.name,
                        domain: profile.organizations.domain || '',
                        plan: profile.organizations.plan
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveOrganization = async () => {
        setIsSavingOrg(true);
        try {
            await supabase
                .from('organizations')
                .update({ name: orgData.name, domain: orgData.domain })
                .eq('id', orgData.id);
            toast.success('Organization settings saved');
        } catch (error) {
            toast.error('Failed to save organization settings');
        }
        setIsSavingOrg(false);
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            await supabase
                .from('users')
                .update({ avatar_url: avatarInput })
                .eq('id', profileData.id);
            setProfileData(prev => ({ ...prev, avatar_url: avatarInput }));
            toast.success('Profile settings saved');
        } catch (error) {
            toast.error('Failed to save profile settings');
        }
        setIsSavingProfile(false);
    };

    if (isLoading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    const getInitials = (email: string) => {
        return email ? email.substring(0, 2).toUpperCase() : 'US';
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and organization preferences.</p>
            </div>

            <div className="grid gap-6">
                {/* Organization Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Organization</CardTitle>
                        </div>
                        <CardDescription>Update your company's details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Company Name</label>
                            <Input
                                value={orgData.name}
                                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Primary Domain</label>
                            <Input
                                value={orgData.domain}
                                onChange={(e) => setOrgData({ ...orgData, domain: e.target.value })}
                                placeholder="example.com"
                            />
                        </div>
                        <div className="pt-2">
                            <label className="text-sm font-medium block mb-2">Current Plan</label>
                            <Badge variant="secondary" className="uppercase">{orgData.plan}</Badge>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSaveOrganization} disabled={isSavingOrg}>
                            {isSavingOrg ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Organization
                        </Button>
                    </CardFooter>
                </Card>

                {/* Profile Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Personal Profile</CardTitle>
                        </div>
                        <CardDescription>Manage your personal information and preferences.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted text-2xl font-semibold overflow-hidden border">
                                {avatarInput ? (
                                    <img src={avatarInput} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    getInitials(profileData.email)
                                )}
                            </div>
                            <div className="space-y-2 flex-1 max-w-sm">
                                <label className="text-sm font-medium">Avatar URL</label>
                                <Input
                                    value={avatarInput}
                                    onChange={(e) => setAvatarInput(e.target.value)}
                                    placeholder="https://example.com/avatar.png"
                                />
                                <p className="text-xs text-muted-foreground">Provide a URL for your profile picture.</p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <Input value={profileData.email} disabled className="bg-muted cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <div className="h-10 px-3 py-2 border rounded-md bg-muted text-sm text-muted-foreground capitalize flex items-center">
                                    {profileData.role === 'admin' && <Shield className="h-4 w-4 mr-2" />}
                                    {profileData.role}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                            {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Profile
                        </Button>
                    </CardFooter>
                </Card>

                {/* Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle>App Preferences</CardTitle>
                        <CardDescription>Customize how Licensly looks and feels.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <label className="text-sm font-medium block mb-2">Theme</label>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={theme === 'light' ? 'default' : 'outline'}
                                    onClick={() => setTheme('light')}
                                    className="w-32"
                                >
                                    <Sun className="mr-2 h-4 w-4" /> Light
                                </Button>
                                <Button
                                    variant={theme === 'dark' ? 'default' : 'outline'}
                                    onClick={() => setTheme('dark')}
                                    className="w-32"
                                >
                                    <Moon className="mr-2 h-4 w-4" /> Dark
                                </Button>
                                <Button
                                    variant={theme === 'system' ? 'default' : 'outline'}
                                    onClick={() => setTheme('system')}
                                    className="w-32"
                                >
                                    <Monitor className="mr-2 h-4 w-4" /> System
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Billing (Disabled for MVP) */}
                <Card className="opacity-60 cursor-not-allowed">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Billing & Subscription</CardTitle>
                        </div>
                        <CardDescription>Manage your Licensly payment methods (Coming soon).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between border rounded-lg p-4">
                            <div>
                                <p className="font-medium">Enterprise Plan</p>
                                <p className="text-sm text-muted-foreground">Billed annually</p>
                            </div>
                            <Button disabled variant="outline">Manage Billing</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
