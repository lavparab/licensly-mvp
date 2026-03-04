import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Check, ChevronRight, ChevronLeft, Building2, Puzzle, FileText, PartyPopper, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const INDUSTRIES = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
    'Manufacturing', 'Media & Entertainment', 'Legal', 'Non-Profit', 'Other'
];

const COMPANY_SIZES = ['1-50', '51-200', '201-1000', '1000+'];

const PLATFORMS = [
    { name: 'Slack', icon: '💬', desc: 'Team messaging & communication' },
    { name: 'Microsoft Teams', icon: '👥', desc: 'Collaboration & meetings' },
    { name: 'Google Workspace', icon: '📧', desc: 'Email, docs & drive' },
    { name: 'Microsoft 365', icon: '📊', desc: 'Office suite & services' },
    { name: 'Adobe Creative Cloud', icon: '🎨', desc: 'Design & creative tools' },
    { name: 'Zoom', icon: '📹', desc: 'Video conferencing' },
    { name: 'GitHub', icon: '🐙', desc: 'Code hosting & collaboration' },
    { name: 'Dropbox', icon: '📦', desc: 'Cloud storage & sharing' },
    { name: 'Canva', icon: '🖌️', desc: 'Graphic design platform' },
];

const STEPS = [
    { title: 'Company Setup', icon: Building2 },
    { title: 'Select Integrations', icon: Puzzle },
    { title: 'License Details', icon: FileText },
    { title: 'All Done!', icon: PartyPopper },
];

interface LicenseInput {
    platform: string;
    seats: number;
    costPerSeat: number;
}

export const Onboarding = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 1
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('');
    const [companySize, setCompanySize] = useState('');

    // Step 2
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

    // Step 3
    const [licenseInputs, setLicenseInputs] = useState<LicenseInput[]>([]);

    const togglePlatform = (name: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
        );
    };

    const initLicenseInputs = () => {
        setLicenseInputs(
            selectedPlatforms.map(platform => ({
                platform,
                seats: 10,
                costPerSeat: 15,
            }))
        );
    };

    const updateLicense = (index: number, field: keyof LicenseInput, value: number) => {
        setLicenseInputs(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const canProceed = () => {
        switch (step) {
            case 0: return companyName.trim() && industry && companySize;
            case 1: return selectedPlatforms.length > 0;
            case 2: return licenseInputs.every(l => l.seats > 0 && l.costPerSeat > 0);
            default: return true;
        }
    };

    const handleNext = () => {
        if (step === 1) {
            initLicenseInputs();
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleComplete = async () => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            // 1. Get org_id
            const { data: profile } = await supabase
                .from('users')
                .select('org_id')
                .eq('id', user.id)
                .single();

            if (!profile?.org_id) throw new Error('No org found');
            const orgId = profile.org_id;

            // 2. Update organization
            await supabase
                .from('organizations')
                .update({ name: companyName, industry, company_size: companySize })
                .eq('id', orgId);

            // 3. Upsert integrations
            for (const platform of selectedPlatforms) {
                await supabase
                    .from('integrations')
                    .upsert(
                        { org_id: orgId, platform, status: 'connected', last_synced_at: new Date().toISOString() },
                        { onConflict: 'org_id,platform' }
                    );
            }

            // 4. Insert licenses per integration
            for (const lic of licenseInputs) {
                // Get integration id
                const { data: intData } = await supabase
                    .from('integrations')
                    .select('id')
                    .eq('org_id', orgId)
                    .eq('platform', lic.platform)
                    .single();

                await supabase.from('licenses').insert({
                    org_id: orgId,
                    integration_id: intData?.id || null,
                    platform: lic.platform,
                    plan_name: 'Standard',
                    seats_purchased: lic.seats,
                    seats_used: 0,
                    cost_per_seat: lic.costPerSeat,
                    billing_cycle: 'monthly',
                    renewal_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                });
            }

            // 5. Mark onboarding complete
            await supabase
                .from('users')
                .update({ onboarding_completed: true })
                .eq('id', user.id);

            toast.success('Onboarding complete! Welcome to Licensly.');
            navigate('/dashboard');
        } catch (err) {
            console.error('Onboarding error:', err);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Company Name</label>
                            <Input
                                placeholder="e.g. Acme Corp"
                                value={companyName}
                                onChange={e => setCompanyName(e.target.value)}
                                className="h-12 text-base"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Industry</label>
                            <div className="grid grid-cols-2 gap-2">
                                {INDUSTRIES.map(ind => (
                                    <button
                                        key={ind}
                                        type="button"
                                        onClick={() => setIndustry(ind)}
                                        className={`rounded-lg border px-4 py-3 text-sm text-left transition-all ${industry === ind
                                                ? 'border-primary bg-primary/10 text-primary font-medium'
                                                : 'border-border hover:border-primary/50 hover:bg-muted'
                                            }`}
                                    >
                                        {ind}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Company Size</label>
                            <div className="grid grid-cols-4 gap-2">
                                {COMPANY_SIZES.map(size => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => setCompanySize(size)}
                                        className={`rounded-lg border px-4 py-3 text-sm text-center transition-all ${companySize === size
                                                ? 'border-primary bg-primary/10 text-primary font-medium'
                                                : 'border-border hover:border-primary/50 hover:bg-muted'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {PLATFORMS.map(p => {
                            const selected = selectedPlatforms.includes(p.name);
                            return (
                                <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => togglePlatform(p.name)}
                                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${selected
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-border hover:border-primary/40 hover:bg-muted/50'
                                        }`}
                                >
                                    <span className="text-2xl">{p.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{p.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{p.desc}</p>
                                    </div>
                                    {selected && (
                                        <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Enter how many licenses you've purchased and the monthly cost per seat for each platform.
                        </p>
                        <div className="space-y-3">
                            {licenseInputs.map((lic, idx) => {
                                const platform = PLATFORMS.find(p => p.name === lic.platform);
                                return (
                                    <div key={lic.platform} className="flex items-center gap-4 rounded-lg border p-4">
                                        <span className="text-xl">{platform?.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{lic.platform}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-end">
                                                <label className="text-xs text-muted-foreground mb-1">Licenses</label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={lic.seats}
                                                    onChange={e => updateLicense(idx, 'seats', Number(e.target.value))}
                                                    className="w-24 h-9 text-right"
                                                />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <label className="text-xs text-muted-foreground mb-1">$/seat/mo</label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    value={lic.costPerSeat}
                                                    onChange={e => updateLicense(idx, 'costPerSeat', Number(e.target.value))}
                                                    className="w-24 h-9 text-right"
                                                />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <label className="text-xs text-muted-foreground mb-1">Monthly</label>
                                                <div className="h-9 flex items-center font-medium text-sm text-green-600">
                                                    ${(lic.seats * lic.costPerSeat).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end pt-2 border-t">
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total Monthly Spend</p>
                                <p className="text-2xl font-bold text-primary">
                                    ${licenseInputs.reduce((sum, l) => sum + l.seats * l.costPerSeat, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                <PartyPopper className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold">You're all set!</h3>
                            <p className="text-muted-foreground mt-1">Here's a summary of your setup</p>
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Company</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-1">
                                <p><span className="text-muted-foreground">Name:</span> {companyName}</p>
                                <p><span className="text-muted-foreground">Industry:</span> {industry}</p>
                                <p><span className="text-muted-foreground">Size:</span> {companySize} employees</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Platforms & Licenses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {licenseInputs.map(lic => {
                                        const platform = PLATFORMS.find(p => p.name === lic.platform);
                                        return (
                                            <div key={lic.platform} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <span>{platform?.icon}</span>
                                                    <span className="font-medium">{lic.platform}</span>
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {lic.seats} seats • ${lic.costPerSeat}/seat • <span className="text-foreground font-medium">${(lic.seats * lic.costPerSeat).toLocaleString()}/mo</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between pt-3 mt-2 border-t font-medium">
                                    <span>Total Monthly Spend</span>
                                    <span className="text-primary">${licenseInputs.reduce((sum, l) => sum + l.seats * l.costPerSeat, 0).toLocaleString()}/mo</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Progress Bar */}
            <div className="border-b bg-card">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <span className="text-primary">Licensly</span>
                            <span className="text-muted-foreground font-normal">Setup</span>
                        </h1>
                        <Badge variant="secondary">Step {step + 1} of {STEPS.length}</Badge>
                    </div>
                    <div className="flex gap-2">
                        {STEPS.map((s, i) => (
                            <div key={i} className="flex-1 flex items-center gap-2">
                                <div className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-muted'
                                    }`} />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2">
                        {STEPS.map((s, i) => (
                            <span key={i} className={`text-xs ${i <= step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                {s.title}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-start justify-center py-8 px-4">
                <div className="w-full max-w-3xl">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold">{STEPS[step].title}</h2>
                        <p className="text-muted-foreground mt-1">
                            {step === 0 && 'Tell us about your company so we can personalize your experience.'}
                            {step === 1 && 'Select the SaaS platforms your company currently uses.'}
                            {step === 2 && 'Enter your license details for each selected platform.'}
                            {step === 3 && 'Review your setup and get started.'}
                        </p>
                    </div>

                    {renderStep()}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={step === 0}
                            className={step === 0 ? 'invisible' : ''}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        {step < STEPS.length - 1 ? (
                            <Button onClick={handleNext} disabled={!canProceed()}>
                                Next
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleComplete} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        Go to Dashboard
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
