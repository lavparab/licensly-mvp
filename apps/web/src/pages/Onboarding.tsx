import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Check, ChevronRight, ChevronLeft, Building2, Puzzle, FileText, PartyPopper, Loader2, MessageSquare, Users, Mail, LayoutGrid, Palette, Video, Github, Brush, CheckCircle2, Activity } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORM_ICONS: Record<string, any> = {
    'Slack': MessageSquare,
    'Microsoft Teams': Users,
    'Google Workspace': Mail,
    'Microsoft 365': LayoutGrid,
    'Adobe Creative Cloud': Palette,
    'Zoom': Video,
    'GitHub': Github,
    'Canva': Brush,
};

const INDUSTRIES = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
    'Manufacturing', 'Media & Entertainment', 'Legal', 'Non-Profit', 'Other'
];

const COMPANY_SIZES = ['1-50', '51-200', '201-1000', '1000+'];

const PLATFORMS = [
    { name: 'Slack', icon: MessageSquare, desc: 'Team messaging & communication' },
    { name: 'Microsoft Teams', icon: Users, desc: 'Collaboration & meetings' },
    { name: 'Google Workspace', icon: Mail, desc: 'Email, docs & drive' },
    { name: 'Microsoft 365', icon: LayoutGrid, desc: 'Office suite & services' },
    { name: 'Adobe Creative Cloud', icon: Palette, desc: 'Design & creative tools' },
    { name: 'Zoom', icon: Video, desc: 'Video conferencing' },
    { name: 'GitHub', icon: Github, desc: 'Code hosting & collaboration' },
    { name: 'Canva', icon: Brush, desc: 'Graphic design platform' },
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
            await api.post('/api/onboarding/complete', {
                company_size: companySize,
                industry: industry,
                org_name: companyName,
                platforms: selectedPlatforms,
                licenses: licenseInputs
            });

            toast.success('Onboarding complete! Welcome to Licensly.');

            // Force a hard redirect so AuthContext re-fetches onboarding status
            window.location.href = '/dashboard';
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
                                            ? 'border-[#2563eb] bg-[#2563eb]/10 text-[#2563eb] font-medium'
                                            : 'border-border hover:border-[#2563eb]/50 hover:bg-muted'
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
                                            ? 'border-[#2563eb] bg-[#2563eb] text-white font-medium'
                                            : 'border-border hover:border-[#2563eb]/50 hover:bg-muted'
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
                            const Icon = PLATFORM_ICONS[p.name] || Activity;
                            return (
                                <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => togglePlatform(p.name)}
                                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${selected
                                        ? 'border-[#2563eb] bg-[#2563eb]/5 shadow-sm'
                                        : 'border-border hover:border-[#2563eb]/40 hover:bg-muted/50'
                                        }`}
                                >
                                    <span className="flex items-center justify-center bg-gray-100 dark:bg-[#2a2a2a] p-2 rounded-lg">
                                        <Icon className="h-5 w-5 text-[#2563eb]" />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{p.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{p.desc}</p>
                                    </div>
                                    {selected && (
                                        <div className="bg-[#2563eb] text-white rounded-full p-0.5">
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
                                const Icon = platform ? PLATFORM_ICONS[platform.name] : Activity;
                                return (
                                    <div key={lic.platform} className="flex items-center gap-4 rounded-lg border p-4">
                                        <span className="flex items-center justify-center bg-gray-100 dark:bg-[#2a2a2a] p-2 rounded-lg">
                                            <Icon className="h-5 w-5 text-[#2563eb]" />
                                        </span>
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
                                                <div className={`h-9 flex items-center font-medium text-sm ${(lic.seats * lic.costPerSeat) > 0 ? 'text-[#16a34a]' : 'text-muted-foreground'}`}>
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
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#16a34a]/10 mb-4">
                                <CheckCircle2 className="h-8 w-8 text-[#16a34a]" />
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
                                        const Icon = platform ? PLATFORM_ICONS[platform.name] : Activity;
                                        return (
                                            <div key={lic.platform} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center justify-center bg-gray-100 dark:bg-[#2a2a2a] p-1.5 rounded-md">
                                                        <Icon className="h-4 w-4 text-[#2563eb]" />
                                                    </span>
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
                            <Activity className="h-6 w-6 text-[#2563eb]" />
                            <span className="text-[#2563eb]">Licensly</span>
                            <span className="text-muted-foreground font-normal">Setup</span>
                        </h1>
                        <Badge variant="secondary">Step {step + 1} of {STEPS.length}</Badge>
                    </div>
                    <div className="flex gap-2">
                        {STEPS.map((_s, i) => (
                            <div key={i} className="flex-1 flex items-center gap-2">
                                <div className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-[#2563eb]' : 'bg-muted'
                                    }`} />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2">
                        {STEPS.map((stepItem, i) => (
                            <span key={i} className={`text-xs ${i <= step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                {stepItem.title}
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
                            <Button onClick={handleComplete} disabled={isSubmitting} className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white">
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
