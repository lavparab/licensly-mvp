import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Building2, CreditCard, Shield, Users, Loader2, Moon, Sun, Monitor } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
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
    const [orgData, setOrgData] = useState({ id: '', name: '', domain: '', plan: '', company_size: '', industry: '' });
    const [profileData, setProfileData] = useState({ id: '', email: '', role: '', full_name: '' });

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
                    full_name: profile.full_name || ''
                });

                if (profile.organizations) {
                    setOrgData({
                        id: profile.organizations.id,
                        name: profile.organizations.name,
                        domain: profile.organizations.domain || '',
                        plan: profile.organizations.plan,
                        company_size: profile.organizations.company_size || '',
                        industry: profile.organizations.industry || '',
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
                .update({ name: orgData.name, domain: orgData.domain, company_size: orgData.company_size, industry: orgData.industry })
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
                .update({ full_name: profileData.full_name })
                .eq('id', profileData.id);
            toast.success('Profile settings saved');
        } catch (error) {
            toast.error('Failed to save profile settings');
        }
        setIsSavingProfile(false);
    };

    if (isLoading) return <LoadingScreen />;

    // Avatar shows initials from full_name or email
    const initials = profileData.full_name
        ? profileData.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.email?.charAt(0).toUpperCase() || 'U';

    return (
        <div className="flex flex-col gap-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and organization preferences.</p>
            </div>

            <div className="grid gap-6">
                {/* Organization Settings */}
                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#2e2e2e] rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">Organization</h2>
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-[#666666] mb-6">Update your company's details.</p>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-gray-700 dark:text-[#a1a1a1]">Company Name</label>
                            <Input
                                value={orgData.name}
                                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                                className="h-10 text-[13px] bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2e2e2e] text-gray-900 dark:text-[#ededed]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-gray-700 dark:text-[#a1a1a1]">Primary Domain</label>
                            <Input
                                value={orgData.domain}
                                onChange={(e) => setOrgData({ ...orgData, domain: e.target.value })}
                                placeholder="example.com"
                                className="h-10 text-[13px] bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2e2e2e] text-gray-900 dark:text-[#ededed]"
                            />
                        </div>

                        {/* Company Size */}
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-gray-700 dark:text-[#a1a1a1]">Company Size</label>
                            <select
                                value={orgData.company_size || ''}
                                onChange={e => setOrgData({ ...orgData, company_size: e.target.value })}
                                className="w-full h-10 rounded-lg border border-gray-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-[#ededed] px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="">Select size</option>
                                <option value="1-50">1-50 employees</option>
                                <option value="51-200">51-200 employees</option>
                                <option value="201-1000">201-1000 employees</option>
                                <option value="1000+">1000+ employees</option>
                            </select>
                        </div>

                        {/* Industry */}
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-gray-700 dark:text-[#a1a1a1]">Industry</label>
                            <select
                                value={orgData.industry || ''}
                                onChange={e => setOrgData({ ...orgData, industry: e.target.value })}
                                className="w-full h-10 rounded-lg border border-gray-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-[#ededed] px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="">Select industry</option>
                                {['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Media & Entertainment', 'Legal', 'Non-Profit', 'Other'].map(ind => (
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-[#2e2e2e] mt-6 pt-4">
                        <Button onClick={handleSaveOrganization} disabled={isSavingOrg} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white h-9 px-4 text-[13px] rounded-lg">
                            {isSavingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                {/* Profile Settings */}
                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#2e2e2e] rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">Personal Profile</h2>
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-[#666666] mb-6">Manage your personal information and preferences.</p>

                    <div className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2563eb]/10 text-[#2563eb] text-xl font-semibold border border-[#2563eb]/20">
                                {initials}
                            </div>
                            <div className="space-y-1.5 flex-1 max-w-sm">
                                <label className="text-[13px] font-medium text-gray-700 dark:text-[#a1a1a1]">Full Name</label>
                                <Input
                                    value={profileData.full_name || ''}
                                    onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                                    placeholder="e.g. John Smith"
                                    className="h-10 text-[13px] bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2e2e2e] text-gray-900 dark:text-[#ededed]"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-gray-700 dark:text-[#a1a1a1]">Email Address</label>
                                <Input value={profileData.email} disabled className="h-10 text-[13px] bg-gray-50 dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2e2e2e] text-gray-500 dark:text-[#666666] cursor-not-allowed" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-gray-700 dark:text-[#a1a1a1]">Role</label>
                                <div className="h-10 px-3 py-2 border border-gray-200 dark:border-[#2e2e2e] rounded-lg bg-gray-50 dark:bg-[#0a0a0a] text-[13px] text-gray-500 dark:text-[#666666] capitalize flex items-center">
                                    {profileData.role === 'admin' && <Shield className="h-4 w-4 mr-2" />}
                                    {profileData.role}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-[#2e2e2e] mt-6 pt-4">
                        <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white h-9 px-4 text-[13px] rounded-lg">
                            {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                {/* Preferences */}
                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#2e2e2e] rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-1">App Preferences</h2>
                    <p className="text-[13px] text-gray-500 dark:text-[#666666] mb-6">Customize how Licensly looks and feels.</p>

                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-gray-700 dark:text-[#a1a1a1] block mb-2">Theme</label>
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
                </div>

                {/* Billing */}
                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#2e2e2e] rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">Billing & Subscription</h2>
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-[#666666] mb-6">Manage your Licensly subscription and payment methods.</p>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2e2e2e]">
                        <div>
                            <p className="text-[13px] font-medium text-gray-900 dark:text-[#ededed] capitalize">
                                {orgData.plan || 'Free'} Plan
                            </p>
                            <p className="text-[12px] text-gray-500 dark:text-[#666666] mt-0.5">
                                {orgData.plan === 'free' || !orgData.plan ? 'Upgrade to unlock advanced features' : 'Billed annually'}
                            </p>
                        </div>
                        <Button variant="outline" className="text-[13px] h-9 rounded-lg dark:border-[#2e2e2e]">
                            {orgData.plan === 'free' || !orgData.plan ? 'Upgrade Plan' : 'Manage Billing'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
