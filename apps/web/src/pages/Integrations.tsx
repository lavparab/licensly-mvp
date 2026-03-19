import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Unplug, CheckCircle2, RotateCw, AlertCircle, Loader2, Link2Off, Plug, Users, UserX, Bot, GitCommit, GitPullRequest, Eye, Activity, ChevronDown, ChevronUp, Building, Globe } from 'lucide-react';
import { api } from '../lib/api';
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

interface Member {
    login: string;
    avatarUrl: string;
    lastCommitDate: string;
    lastPrDate: string;
    lastReviewDate: string;
    activityScore: number;
    status: 'active' | 'idle';
}

interface CopilotData {
    enabled: boolean;
    assigned: number;
    used: number;
    costPerSeat?: number;
}

function timeAgo(dateStr: string) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
}

function ScoreBar({ score }: { score: number }) {
    const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
            </div>
            <span className="text-xs font-mono w-6 text-right" style={{ color }}>{score}</span>
        </div>
    );
}

function GithubDataPanel() {
    const [members, setMembers] = useState<Member[]>([]);
    const [idleMembers, setIdleMembers] = useState<Member[]>([]);
    const [copilot, setCopilot] = useState<CopilotData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'members' | 'idle' | 'copilot'>('members');

    useEffect(() => {
        Promise.all([
            api.get('/api/integrations/github/members'),
            api.get('/api/integrations/github/idle'),
            api.get('/api/integrations/github/copilot'),
        ]).then(([membersRes, idleRes, copilotRes]) => {
            setMembers(membersRes.members || []);
            setIdleMembers(idleRes.idleMembers || []);
            setCopilot(copilotRes.copilotData);
        }).catch(err => {
            toast.error('Failed to load GitHub data: ' + err.message);
        }).finally(() => setLoading(false));
    }, []);

    const tabs = [
        { id: 'members' as const, label: 'Members', icon: Users, count: members.length },
        { id: 'idle' as const, label: 'Idle', icon: UserX, count: idleMembers.length },
        { id: 'copilot' as const, label: 'Copilot', icon: Bot, count: null },
    ];

    if (loading) return (
        <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <div className="mt-4 border-t pt-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="text-lg font-bold leading-none">{members.length}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Members</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                    <UserX className="h-4 w-4 text-amber-500" />
                    <div>
                        <p className="text-lg font-bold leading-none">{idleMembers.length}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Idle</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                    <Bot className="h-4 w-4 text-blue-500" />
                    <div>
                        <p className="text-lg font-bold leading-none">{copilot ? `${copilot.used}/${copilot.assigned}` : '—'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Copilot</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b mb-3">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <tab.icon className="h-3 w-3" />
                        {tab.label}
                        {tab.count !== null && (
                            <Badge variant="secondary" className="text-xs px-1 py-0 h-4">{tab.count}</Badge>
                        )}
                    </button>
                ))}
            </div>

            {/* Members Tab */}
            {activeTab === 'members' && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {members.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No members found</p>
                    ) : members.map(member => (
                        <div key={member.login} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <img src={member.avatarUrl} alt={member.login} className="h-7 w-7 rounded-full border flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <p className="text-xs font-medium truncate">{member.login}</p>
                                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs px-1 py-0 h-4 flex-shrink-0">
                                        {member.status}
                                    </Badge>
                                </div>
                                <ScoreBar score={member.activityScore} />
                            </div>
                            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                                <span className="flex items-center gap-1"><GitCommit className="h-3 w-3" />{timeAgo(member.lastCommitDate)}</span>
                                <span className="flex items-center gap-1"><GitPullRequest className="h-3 w-3" />{timeAgo(member.lastPrDate)}</span>
                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{timeAgo(member.lastReviewDate)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Idle Tab */}
            {activeTab === 'idle' && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {idleMembers.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-xs font-medium">No idle members 🎉</p>
                            <p className="text-xs text-muted-foreground mt-1">All members have activity score above 50</p>
                        </div>
                    ) : idleMembers.map(member => (
                        <div key={member.login} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
                            <img src={member.avatarUrl} alt={member.login} className="h-7 w-7 rounded-full border flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <p className="text-xs font-medium truncate">{member.login}</p>
                                    <Badge variant="secondary" className="text-xs px-1 py-0 h-4 text-amber-600 flex-shrink-0">idle</Badge>
                                </div>
                                <ScoreBar score={member.activityScore} />
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                                <GitCommit className="h-3 w-3" />{timeAgo(member.lastCommitDate)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Copilot Tab */}
            {activeTab === 'copilot' && (
                <div className="grid grid-cols-2 gap-3">
                    {!copilot ? (
                        <p className="text-xs text-muted-foreground col-span-2 text-center py-6">No Copilot data available</p>
                    ) : (
                        <>
                            <div className="bg-muted/50 rounded-lg p-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Activity className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-xs font-medium">Seat Usage</p>
                                </div>
                                <p className="text-2xl font-bold">{copilot.used}<span className="text-sm font-normal text-muted-foreground">/{copilot.assigned}</span></p>
                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(copilot.used / copilot.assigned) * 100}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{copilot.assigned - copilot.used} unassigned</p>
                            </div>
                            {copilot.costPerSeat && (
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Bot className="h-3 w-3 text-muted-foreground" />
                                        <p className="text-xs font-medium">Monthly Cost</p>
                                    </div>
                                    <p className="text-2xl font-bold">${(copilot.used * copilot.costPerSeat).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                                    <p className="text-xs text-muted-foreground mt-2">${copilot.costPerSeat}/seat × {copilot.used} seats</p>
                                    <p className="text-xs text-green-600 mt-1">Save ${((copilot.assigned - copilot.used) * copilot.costPerSeat).toFixed(0)}/mo by removing unused</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    ); // end of GithubDataPanel


} interface SlackMember {
    id: string;
    name: string;
    realName: string;
    email: string;
    isAdmin: boolean;
    isOwner: boolean;
    status: 'active' | 'inactive';
    lastActiveAt: string;
    avatarUrl: string;
}

interface WorkspaceInfo {
    id: string;
    name: string;
    plan: string;
    domain: string;
}

function SlackDataPanel() {
    const [members, setMembers] = useState<SlackMember[]>([]);
    const [inactiveMembers, setInactiveMembers] = useState<SlackMember[]>([]);
    const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'members' | 'inactive' | 'workspace'>('members');

    useEffect(() => {
        Promise.all([
            api.get('/api/integrations/slack/members'),
            api.get('/api/integrations/slack/inactive'),
            api.get('/api/integrations/slack/workspace'),
        ]).then(([membersRes, inactiveRes, workspaceRes]) => {
            setMembers(membersRes.members || []);
            setInactiveMembers(inactiveRes.inactiveMembers || []);
            setWorkspace(workspaceRes.team || null);
        }).catch(err => {
            toast.error('Failed to load Slack data: ' + err.message);
        }).finally(() => setLoading(false));
    }, []);

    const tabs = [
        { id: 'members' as const, label: 'Members', icon: Users, count: members.length },
        { id: 'inactive' as const, label: 'Inactive', icon: UserX, count: inactiveMembers.length },
        { id: 'workspace' as const, label: 'Workspace', icon: Building, count: null },
    ];

    if (loading) return (
        <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <div className="mt-4 border-t pt-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                        <p className="text-lg font-bold leading-none">{members.length}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Members</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                    <UserX className="h-4 w-4 text-amber-500" />
                    <div>
                        <p className="text-lg font-bold leading-none">{inactiveMembers.length}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Inactive</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                    <Building className="h-4 w-4 text-green-500" />
                    <div>
                        <p className="text-lg font-bold leading-none truncate">{workspace?.plan || '—'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Plan</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b mb-3">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <tab.icon className="h-3 w-3" />
                        {tab.label}
                        {tab.count !== null && (
                            <Badge variant="secondary" className="text-xs px-1 py-0 h-4">{tab.count}</Badge>
                        )}
                    </button>
                ))}
            </div>

            {/* Members Tab */}
            {activeTab === 'members' && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {members.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No members found</p>
                    ) : members.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <img src={member.avatarUrl} alt={member.realName} className="h-7 w-7 rounded-full border flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-medium truncate">{member.realName}</p>
                                    {member.isOwner && <Badge variant="default" className="text-xs px-1 py-0 h-4 flex-shrink-0">Owner</Badge>}
                                    {member.isAdmin && !member.isOwner && <Badge variant="secondary" className="text-xs px-1 py-0 h-4 flex-shrink-0">Admin</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            </div>
                            <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs px-1 py-0 h-4 flex-shrink-0">
                                {member.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            )}

            {/* Inactive Tab */}
            {activeTab === 'inactive' && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {inactiveMembers.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-xs font-medium">No inactive members 🎉</p>
                            <p className="text-xs text-muted-foreground mt-1">All members are currently active</p>
                        </div>
                    ) : inactiveMembers.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
                            <img src={member.avatarUrl} alt={member.realName} className="h-7 w-7 rounded-full border flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{member.realName}</p>
                                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs px-1 py-0 h-4 text-amber-600 flex-shrink-0">inactive</Badge>
                        </div>
                    ))}
                </div>
            )}

            {/* Workspace Tab */}
            {activeTab === 'workspace' && (
                <div className="grid grid-cols-2 gap-3">
                    {!workspace ? (
                        <p className="text-xs text-muted-foreground col-span-2 text-center py-6">No workspace data available</p>
                    ) : (
                        <>
                            <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <Building className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-xs font-medium">Workspace Info</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Name</p>
                                        <p className="text-sm font-medium">{workspace.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Domain</p>
                                        <p className="text-sm font-medium">{workspace.domain}.slack.com</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Plan</p>
                                        <p className="text-sm font-medium capitalize">{workspace.plan}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total Members</p>
                                        <p className="text-sm font-medium">{members.length}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

interface GoogleWorkspaceUser {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    isSuspended: boolean;
    status: 'active' | 'suspended';
    lastLoginTime: string;
    avatarUrl: string;
    orgUnit: string;
}

interface GoogleWorkspaceDomainInfo {
    domain: string;
    isPrimary: boolean;
    verified: boolean;
    totalUsers: number;
}

function GoogleWorkspaceDataPanel() {
    const [users, setUsers] = useState<GoogleWorkspaceUser[]>([]);
    const [suspendedUsers, setSuspendedUsers] = useState<GoogleWorkspaceUser[]>([]);
    const [domain, setDomain] = useState<GoogleWorkspaceDomainInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'suspended' | 'domain'>('users');

    useEffect(() => {
        Promise.all([
            api.get('/api/integrations/google-workspace/users'),
            api.get('/api/integrations/google-workspace/suspended'),
            api.get('/api/integrations/google-workspace/domain'),
        ]).then(([usersRes, suspendedRes, domainRes]) => {
            setUsers(usersRes.users || []);
            setSuspendedUsers(suspendedRes.suspendedUsers || []);
            setDomain(domainRes.domain || null);
        }).catch(err => {
            toast.error('Failed to load Google Workspace data: ' + err.message);
        }).finally(() => setLoading(false));
    }, []);

    const tabs = [
        { id: 'users' as const, label: 'Users', icon: Users, count: users.length },
        { id: 'suspended' as const, label: 'Suspended', icon: UserX, count: suspendedUsers.length },
        { id: 'domain' as const, label: 'Domain', icon: Globe, count: null },
    ];

    if (loading) return (
        <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <div className="mt-4 border-t pt-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                        <p className="text-lg font-bold leading-none">{users.length}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Users</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                    <UserX className="h-4 w-4 text-amber-500" />
                    <div>
                        <p className="text-lg font-bold leading-none">{suspendedUsers.length}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Suspended</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                    <Globe className="h-4 w-4 text-green-500" />
                    <div className="min-w-0">
                        <p className="text-lg font-bold leading-none truncate">{domain?.domain || '—'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Domain</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b mb-3">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <tab.icon className="h-3 w-3" />
                        {tab.label}
                        {tab.count !== null && (
                            <Badge variant="secondary" className="text-xs px-1 py-0 h-4">{tab.count}</Badge>
                        )}
                    </button>
                ))}
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {users.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No users found</p>
                    ) : users.map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="h-7 w-7 rounded-full border flex-shrink-0" />
                            ) : (
                                <div className="h-7 w-7 rounded-full border flex-shrink-0 bg-muted flex items-center justify-center">
                                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-medium truncate">{user.name}</p>
                                    {user.isAdmin && <Badge variant="secondary" className="text-xs px-1 py-0 h-4 flex-shrink-0">Admin</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs px-1 py-0 h-4 flex-shrink-0">
                                {user.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            )}

            {/* Suspended Tab */}
            {activeTab === 'suspended' && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {suspendedUsers.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-xs font-medium">No suspended users 🎉</p>
                            <p className="text-xs text-muted-foreground mt-1">All users are currently active</p>
                        </div>
                    ) : suspendedUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="h-7 w-7 rounded-full border flex-shrink-0" />
                            ) : (
                                <div className="h-7 w-7 rounded-full border flex-shrink-0 bg-muted flex items-center justify-center">
                                    <UserX className="h-3.5 w-3.5 text-amber-500/70" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-medium truncate">{user.name}</p>
                                    {user.isAdmin && <Badge variant="secondary" className="text-xs px-1 py-0 h-4 flex-shrink-0 bg-transparent border-amber-200 text-amber-700">Admin</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs px-1 py-0 h-4 text-amber-600 flex-shrink-0 border-amber-200">
                                suspended
                            </Badge>
                        </div>
                    ))}
                </div>
            )}

            {/* Domain Tab */}
            {activeTab === 'domain' && (
                <div className="grid grid-cols-2 gap-3">
                    {!domain ? (
                        <p className="text-xs text-muted-foreground col-span-2 text-center py-6">No domain data available</p>
                    ) : (
                        <>
                            <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <Globe className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-xs font-medium">Domain Information</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Domain</p>
                                        <p className="text-sm font-medium">{domain.domain}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <div className="flex mt-0.5 gap-2">
                                            {domain.verified && <Badge variant="default" className="text-[10px] px-1 h-4 bg-green-500 hover:bg-green-600">Verified</Badge>}
                                            {domain.isPrimary && <Badge variant="secondary" className="text-[10px] px-1 h-4">Primary</Badge>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total Users</p>
                                        <p className="text-sm font-medium">{domain.totalUsers}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export const Integrations = () => {
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
    const [connectProgress, setConnectProgress] = useState(0);
    const [disconnectTarget, setDisconnectTarget] = useState<any | null>(null);
    const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchIntegrations();
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('success') === 'true') {
            const platform = searchParams.get('platform');
            toast.success(`Successfully connected ${platform}! Data synced.`);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (searchParams.get('error')) {
            toast.error(`Connection failed: ${searchParams.get('error')}`);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const fetchIntegrations = async () => {
        try {
            const data = await api.get('/api/integrations');
            if (data && data.integrations) setIntegrations(data.integrations);
        } catch (error) {
            console.error('Error fetching integrations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = async (platform: string) => {
        setConnectingPlatform(platform);
        setConnectProgress(0);

        const interval = setInterval(() => {
            setConnectProgress(prev => {
                if (prev >= 80) { clearInterval(interval); return 80; }
                return prev + 20;
            });
        }, 400);

        try {
            const data = await api.get(`/api/integrations/${platform.toLowerCase()}/auth`);
            clearInterval(interval);
            setConnectProgress(100);
            window.location.href = data.url;
        } catch (err) {
            clearInterval(interval);
            toast.error(`Failed to connect ${platform}`);
            setConnectingPlatform(null);
        }
    };

    const handleDisconnect = async () => {
        if (!disconnectTarget) return;
        try {
            await api.delete(`/api/integrations/${disconnectTarget.id}`);
            await fetchIntegrations();
            toast.success(`${disconnectTarget.platform} disconnected.`);
        } catch (err) {
            toast.error('Failed to disconnect');
        }
        setDisconnectTarget(null);
    };

    const handleSync = async (integration: any) => {
        setSyncingId(integration.id);
        try {
            await api.post(`/api/integrations/${integration.id}/sync`);
            await fetchIntegrations();
            toast.success(`${integration.platform} synced!`);
        } catch (err) {
            toast.error('Sync failed');
        } finally {
            setSyncingId(null);
        }
    };

    const toggleExpand = (platform: string) => {
        setExpandedPlatforms(prev => {
            const next = new Set(prev);
            next.has(platform) ? next.delete(platform) : next.add(platform);
            return next;
        });
    };

    // Platforms that have a detail panel
    const EXPANDABLE_PLATFORMS = ['github', 'slack', 'google-workspace'];

    const getPlatformMeta = (name: string) => ALL_PLATFORMS.find(p => p.name.toLowerCase() === name.toLowerCase()) || { icon: '🔌', desc: 'Sync platform data', name };
    const connectedNames = integrations.filter(i => i.status === 'connected').map(i => i.platform.toLowerCase());
    const availablePlatforms = ALL_PLATFORMS.filter(p => !connectedNames.includes(p.name.toLowerCase()));

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
            ) : (
                <>
                    {/* Connected */}
                    {integrations.filter(i => i.status === 'connected').length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" /> Connected
                                <Badge variant="secondary">{integrations.filter(i => i.status === 'connected').length}</Badge>
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                                {integrations.filter(i => i.status === 'connected').map(integration => {
                                    const meta = getPlatformMeta(integration.platform);
                                    const isExpandable = EXPANDABLE_PLATFORMS.includes(integration.platform.toLowerCase());
                                    const isExpanded = expandedPlatforms.has(integration.platform.toLowerCase());

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
                                                {/* Expandable detail panel */}
                                                {isExpandable && isExpanded && (
                                                    <>
                                                        {integration.platform.toLowerCase() === 'github' && <GithubDataPanel />}
                                                        {integration.platform.toLowerCase() === 'slack' && <SlackDataPanel />}
                                                        {integration.platform.toLowerCase() === 'google-workspace' && <GoogleWorkspaceDataPanel />}
                                                    </>
                                                )}
                                            </CardContent>
                                            <CardFooter className="pt-2 border-t">
                                                <div className="flex w-full gap-2">
                                                    <Button variant="outline" className="flex-1" onClick={() => handleSync(integration)} disabled={syncingId === integration.id}>
                                                        <RotateCw className={`mr-2 h-4 w-4 ${syncingId === integration.id ? 'animate-spin' : ''}`} />
                                                        {syncingId === integration.id ? 'Syncing...' : 'Sync'}
                                                    </Button>
                                                    {isExpandable && (
                                                        <Button variant="outline" onClick={() => toggleExpand(integration.platform.toLowerCase())}>
                                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                            {isExpanded ? 'Hide' : 'View Data'}
                                                        </Button>
                                                    )}
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

                    {/* Disconnected */}
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