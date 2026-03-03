import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Unplug, CheckCircle2, RotateCw, AlertCircle } from 'lucide-react';

const INTEGRATIONS = [
    { id: '1', name: 'Slack', description: 'Sync users and workspace data', status: 'connected', lastSync: '10 mins ago' },
    { id: '2', name: 'Google Workspace', description: 'Directory, licenses, and usage', status: 'connected', lastSync: '1 hour ago' },
    { id: '3', name: 'Adobe Creative Cloud', description: 'Entitlements and user groups', status: 'connected', lastSync: '2 hours ago' },
    { id: '4', name: 'Microsoft Teams', description: 'O365 subscriptions and presence', status: 'disconnected', lastSync: null },
    { id: '5', name: 'GitHub', description: 'Org members and billing seats', status: 'error', lastSync: 'Yesterday' },
    { id: '6', name: 'Zoom', description: 'Pro plans and meeting usage', status: 'disconnected', lastSync: null },
];

export const Integrations = () => {
    const [syncingId, setSyncingId] = useState<string | null>(null);

    const handleConnect = (name: string) => {
        // In prod: redirect to /api/integrations/:platform/auth
        console.log('Connecting to', name);
    };

    const handleSync = (id: string) => {
        setSyncingId(id);
        setTimeout(() => setSyncingId(null), 2000); // mock sync delay
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                <p className="text-muted-foreground">Connect your SaaS platforms to start syncing license and usage data.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {INTEGRATIONS.map((integration) => (
                    <Card key={integration.id} className="flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
                                    {/* Mock platform icons for MVP */}
                                    <Unplug className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">{integration.name}</CardTitle>
                                    <CardDescription className="text-xs">{integration.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                            {integration.status === 'connected' && (
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Connected (Synced {integration.lastSync})</span>
                                </div>
                            )}
                            {integration.status === 'error' && (
                                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Sync failed {integration.lastSync}. Check credentials.</span>
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
                                <Button className="w-full" onClick={() => handleConnect(integration.name)}>
                                    Connect {integration.name}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};
