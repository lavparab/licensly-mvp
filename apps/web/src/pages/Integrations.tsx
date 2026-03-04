import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Unplug, CheckCircle2, RotateCw, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export const Integrations = () => {
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        try {
            const { data, error } = await supabase
                .from('integrations')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setIntegrations(data);
            }
        } catch (error) {
            console.error('Error fetching integrations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = (name: string) => {
        // In prod: redirect to /api/integrations/:platform/auth
        console.log('Connecting to', name);
    };

    const handleSync = (id: string) => {
        setSyncingId(id);
        setTimeout(() => {
            setSyncingId(null);
            fetchIntegrations(); // Refresh after sync
        }, 2000); // mock sync delay
    };

    const getPlatformDescription = (platform: string) => {
        const descMap: Record<string, string> = {
            'Slack': 'Sync users and workspace data',
            'Google Workspace': 'Directory, licenses, and usage',
            'Adobe Creative Cloud': 'Entitlements and user groups',
            'Microsoft Teams': 'O365 subscriptions and presence',
            'GitHub': 'Org members and billing seats',
            'Zoom': 'Pro plans and meeting usage'
        };
        return descMap[platform] || 'Sync platform data';
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                <p className="text-muted-foreground">Connect your SaaS platforms to start syncing license and usage data.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : integrations.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <Unplug className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl mb-2">No integrations connected</CardTitle>
                    <CardDescription className="max-w-md mb-6">
                        You haven't added any platforms yet. Complete your onboarding to select platforms or add them manually.
                    </CardDescription>
                    <Button>Browse Platform Directory</Button>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {integrations.map((integration) => (
                        <Card key={integration.id} className="flex flex-col">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
                                        <Unplug className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{integration.platform}</CardTitle>
                                        <CardDescription className="text-xs">{getPlatformDescription(integration.platform)}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 pb-4">
                                {integration.status === 'connected' && (
                                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Connected {integration.last_synced_at ? `(Synced ${formatDistanceToNow(new Date(integration.last_synced_at), { addSuffix: true })})` : ''}</span>
                                    </div>
                                )}
                                {integration.status === 'error' && (
                                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>Sync failed. Check credentials.</span>
                                    </div>
                                )}
                                {integration.status === 'disconnected' && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                                        <span>Not connected</span>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-2 border-t">
                                {integration.status === 'connected' || integration.status === 'error' ? (
                                    <div className="flex w-full gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => handleSync(integration.id)}
                                            disabled={syncingId === integration.id}
                                        >
                                            <RotateCw className={`mr-2 h-4 w-4 ${syncingId === integration.id ? 'animate-spin' : ''}`} />
                                            {syncingId === integration.id ? 'Syncing...' : 'Sync Now'}
                                        </Button>
                                        <Button variant="ghost" className="text-destructive">Manage</Button>
                                    </div>
                                ) : (
                                    <Button className="w-full" onClick={() => handleConnect(integration.platform)}>
                                        Connect {integration.platform}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
