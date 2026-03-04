import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Unplug, CheckCircle2, RotateCw, AlertCircle, Loader2, Link2Off, Plug } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const ALL_PLATFORMS = [
    { name: 'Slack', icon: '💬', desc: 'Sync users and workspace data' },
    { name: 'Microsoft Teams', icon: '👥', desc: 'O365 subscriptions and presence' },
    { name: 'Google Workspace', icon: '📧', desc: 'Directory, licenses, and usage' },
    { name: 'Microsoft 365', icon: '📊', desc: 'Office suite subscriptions' },
    { name: 'Adobe Creative Cloud', icon: '🎨', desc: 'Entitlements and user groups' },
    { name: 'Zoom', icon: '📹', desc: 'Pro plans and meeting usage' },
    { name: 'GitHub', icon: '🐙', desc: 'Org members and billing seats' },
    { name: 'Dropbox', icon: '📦', desc: 'Cloud storage & sharing' },
    { name: 'Canva', icon: '🖌️', desc: 'Graphic design platform' },
];

export const Integrations = () => {
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
    const [connectProgress, setConnectProgress] = useState(0);
    const [disconnectTarget, setDisconnectTarget] = useState<any | null>(null);

    useEffect(() => { fetchIntegrations(); }, []);

    const fetchIntegrations = async () => {
        try {
            const { data, error } = await supabase.from('integrations').select('*').order('created_at', { ascending: false });
            if (!error && data) setIntegrations(data);
        } catch (error) { console.error('Error fetching integrations:', error); }
        finally { setIsLoading(false); }
    };

    const handleConnect = async (platform: string) => {
        setConnectingPlatform(platform);
        setConnectProgress(0);

        // Simulate OAuth flow
        const interval = setInterval(() => {
            setConnectProgress(prev => {
                if (prev >= 100) { clearInterval(interval); return 100; }
                return prev + 20;
            });
        }, 400);

        await new Promise(r => setTimeout(r, 2500));
        clearInterval(interval);
        setConnectProgress(100);

        try {
            const { data: profile } = await supabase.from('users').select('org_id').eq('id', (await supabase.auth.getUser()).data.user?.id).single();
            if (profile?.org_id) {
                await supabase.from('integrations').upsert(
                    { org_id: profile.org_id, platform, status: 'connected', last_synced_at: new Date().toISOString() },
                    { onConflict: 'org_id,platform' }
                );
            }
            await fetchIntegrations();
            toast.success(`${platform} connected successfully!`);
        } catch (err) {
            toast.error(`Failed to connect ${platform}`);
        }
        setConnectingPlatform(null);
    };

    const handleDisconnect = async () => {
        if (!disconnectTarget) return;
        try {
            await supabase.from('integrations').update({ status: 'disconnected' }).eq('id', disconnectTarget.id);
            await fetchIntegrations();
            toast.success(`${disconnectTarget.platform} disconnected.`);
        } catch (err) {
            toast.error('Failed to disconnect');
        }
        setDisconnectTarget(null);
    };

    const handleSync = async (integration: any) => {
        setSyncingId(integration.id);
        await new Promise(r => setTimeout(r, 2000));
        try {
            await supabase.from('integrations').update({ last_synced_at: new Date().toISOString() }).eq('id', integration.id);
            await fetchIntegrations();
            toast.success(`${integration.platform} synced!`);
        } catch (err) {
            toast.error('Sync failed');
        }
        setSyncingId(null);
    };

    const getPlatformMeta = (name: string) => ALL_PLATFORMS.find(p => p.name === name) || { icon: '🔌', desc: 'Sync platform data' };
    const connectedNames = integrations.filter(i => i.status === 'connected').map(i => i.platform);
    const availablePlatforms = ALL_PLATFORMS.filter(p => !connectedNames.includes(p.name));

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                <p className="text-muted-foreground">Connect your SaaS platforms to start syncing license and usage data.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
                <>
                    {/* Connected */}
                    {integrations.filter(i => i.status === 'connected').length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" /> Connected
                                <Badge variant="secondary">{integrations.filter(i => i.status === 'connected').length}</Badge>
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {integrations.filter(i => i.status === 'connected').map(integration => {
                                    const meta = getPlatformMeta(integration.platform);
                                    return (
                                        <Card key={integration.id} className="flex flex-col">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted text-xl">{meta.icon}</div>
                                                    <div>
                                                        <CardTitle className="text-base">{integration.platform}</CardTitle>
                                                        <CardDescription className="text-xs">{meta.desc}</CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-1 pb-4">
                                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded-md">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span>Connected {integration.last_synced_at ? `• Synced ${formatDistanceToNow(new Date(integration.last_synced_at), { addSuffix: true })}` : ''}</span>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="pt-2 border-t">
                                                <div className="flex w-full gap-2">
                                                    <Button variant="outline" className="flex-1" onClick={() => handleSync(integration)} disabled={syncingId === integration.id}>
                                                        <RotateCw className={`mr-2 h-4 w-4 ${syncingId === integration.id ? 'animate-spin' : ''}`} />
                                                        {syncingId === integration.id ? 'Syncing...' : 'Sync'}
                                                    </Button>
                                                    <Button variant="ghost" className="text-destructive" onClick={() => setDisconnectTarget(integration)}>
                                                        <Link2Off className="mr-2 h-4 w-4" /> Disconnect
                                                    </Button>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Disconnected from DB */}
                    {integrations.filter(i => i.status === 'disconnected').length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-muted-foreground" /> Disconnected
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {integrations.filter(i => i.status === 'disconnected').map(integration => {
                                    const meta = getPlatformMeta(integration.platform);
                                    return (
                                        <Card key={integration.id} className="flex flex-col opacity-75">
                                            <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted text-xl">{meta.icon}</div>
                                                <div>
                                                    <CardTitle className="text-base">{integration.platform}</CardTitle>
                                                    <CardDescription className="text-xs">{meta.desc}</CardDescription>
                                                </div>
                                            </CardHeader>
                                            <CardFooter className="pt-2 border-t">
                                                <Button className="w-full" onClick={() => handleConnect(integration.platform)}>
                                                    <Plug className="mr-2 h-4 w-4" /> Reconnect
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Available Platforms */}
                    {availablePlatforms.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Plug className="h-5 w-5 text-muted-foreground" /> Available Platforms
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {availablePlatforms.map(p => (
                                    <Card key={p.name} className="flex flex-col border-dashed">
                                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted text-xl">{p.icon}</div>
                                            <div>
                                                <CardTitle className="text-base">{p.name}</CardTitle>
                                                <CardDescription className="text-xs">{p.desc}</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardFooter className="pt-2 border-t mt-auto">
                                            <Button className="w-full" variant="outline" onClick={() => handleConnect(p.name)}>
                                                Connect {p.name}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {integrations.length === 0 && availablePlatforms.length === ALL_PLATFORMS.length && (
                        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                            <div className="bg-muted p-4 rounded-full mb-4"><Unplug className="h-8 w-8 text-muted-foreground" /></div>
                            <CardTitle className="text-xl mb-2">No integrations connected</CardTitle>
                            <CardDescription className="max-w-md mb-6">Connect your first SaaS platform to start tracking licenses and usage.</CardDescription>
                        </Card>
                    )}
                </>
            )}

            {/* Connect Progress Dialog */}
            <Dialog open={!!connectingPlatform} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Connecting {connectingPlatform}...</DialogTitle>
                        <DialogDescription>Authorizing access to your account</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="w-full bg-muted rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${connectProgress}%` }} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                            {connectProgress < 50 ? 'Authenticating...' : connectProgress < 100 ? 'Syncing initial data...' : 'Complete!'}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Disconnect Confirm Dialog */}
            <Dialog open={!!disconnectTarget} onOpenChange={() => setDisconnectTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disconnect {disconnectTarget?.platform}?</DialogTitle>
                        <DialogDescription>This will stop syncing data from {disconnectTarget?.platform}. You can reconnect later.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDisconnectTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
