import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CheckCircle2, Building2, LayoutGrid, Target, Loader2 } from 'lucide-react';

const INDUSTRIES = [
    'Technology', 'Healthcare', 'Financial Services', 'Education', 'Manufacturing', 'Retail', 'Other'
];

const SIZES = [
    '1-50', '51-200', '201-500', '501-1000', '1000+'
];

const PLATFORMS = [
    'Slack', 'Google Workspace', 'Microsoft Teams', 'GitHub', 'Adobe Creative Cloud', 'Zoom', 'Salesforce', 'Jira', 'Figma'
];

const GOALS = [
    'Cost Optimization', 'Compliance & Security', 'Shadow IT Detection', 'Usage Analytics', 'Automated Provisioning'
];

export const Onboarding = () => {
    const navigate = useNavigate();
    const { user, session } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        companyName: '',
        industry: '',
        companySize: '',
        platforms: [] as string[],
        goals: [] as string[]
    });

    const togglePlatform = (platform: string) => {
        setFormData(prev => ({
            ...prev,
            platforms: prev.platforms.includes(platform)
                ? prev.platforms.filter(p => p !== platform)
                : [...prev.platforms, platform]
        }));
    };

    const toggleGoal = (goal: string) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.includes(goal)
                ? prev.goals.filter(g => g !== goal)
                : [...prev.goals, goal]
        }));
    };

    const handleComplete = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            // First, get the user's org_id
            const { data: userData } = await supabase
                .from('users')
                .select('org_id')
                .eq('id', user.id)
                .single();

            if (userData?.org_id) {
                // Update organizations
                await supabase
                    .from('organizations')
                    .update({
                        name: formData.companyName || 'My Organization',
                        industry: formData.industry,
                        company_size: formData.companySize
                    })
                    .eq('id', userData.org_id);

                // Add selected platforms as disconnected integrations
                if (formData.platforms.length > 0) {
                    const integrationsToInsert = formData.platforms.map(platform => ({
                        org_id: userData.org_id,
                        platform,
                        status: 'disconnected' as const
                    }));
                    await supabase.from('integrations').insert(integrationsToInsert);
                }
            }

            // Finally, update user onboarding status
            await supabase
                .from('users')
                .update({ onboarding_completed: true })
                .eq('id', user.id);

            // Redirect to dashboard
            // We force a page reload to ensure all AuthContext state is fresh
            window.location.href = '/dashboard';
        } catch (err) {
            console.error('Error during onboarding:', err);
            setIsLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Company Name</label>
                            <Input
                                placeholder="Acme Corp"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Industry</label>
                            <Select
                                value={formData.industry}
                                onValueChange={(value) => setFormData({ ...formData, industry: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INDUSTRIES.map(ind => (
                                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Company Size</label>
                            <Select
                                value={formData.companySize}
                                onValueChange={(value) => setFormData({ ...formData, companySize: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SIZES.map(size => (
                                        <SelectItem key={size} value={size}>{size} Employees</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <p className="text-sm text-muted-foreground mb-4">Select the tools your team currently uses.</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {PLATFORMS.map(platform => {
                                const isSelected = formData.platforms.includes(platform);
                                return (
                                    <div
                                        key={platform}
                                        onClick={() => togglePlatform(platform)}
                                        className={`cursor-pointer rounded-lg border p-4 text-center text-sm transition-all flex flex-col items-center justify-center gap-2 ${isSelected
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'hover:border-primary/50 hover:bg-muted/50'
                                            }`}
                                    >
                                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                                            }`}>
                                            {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                                        </div>
                                        <span className={isSelected ? 'font-medium' : ''}>{platform}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <p className="text-sm text-muted-foreground mb-4">What do you want to achieve with Licensly?</p>
                        <div className="grid grid-cols-1 gap-3">
                            {GOALS.map(goal => {
                                const isSelected = formData.goals.includes(goal);
                                return (
                                    <div
                                        key={goal}
                                        onClick={() => toggleGoal(goal)}
                                        className={`cursor-pointer rounded-lg border p-4 text-center text-sm transition-all flex items-center gap-3 ${isSelected
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'hover:border-primary/50 hover:bg-muted/50'
                                            }`}
                                    >
                                        <div className={`h-5 w-5 rounded-full border flex flex-shrink-0 items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                                            }`}>
                                            {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                                        </div>
                                        <span className={isSelected ? 'font-medium' : ''}>{goal}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-muted/40 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="mb-8 text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Welcome to Licensly</h1>
                    <p className="text-muted-foreground">Let's get your workspace set up in a few quick steps.</p>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step >= i
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-muted-foreground text-muted-foreground'
                                }`}>
                                {i === 1 && <Building2 className="w-4 h-4" />}
                                {i === 2 && <LayoutGrid className="w-4 h-4" />}
                                {i === 3 && <Target className="w-4 h-4" />}
                            </div>
                            {i < 3 && (
                                <div className={`w-12 h-1 mx-2 rounded ${step > i ? 'bg-primary' : 'bg-muted'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                <Card className="shadow-lg border-muted">
                    <CardHeader>
                        <CardTitle className="text-xl">
                            {step === 1 && '1. Company Profile'}
                            {step === 2 && '2. Your SaaS Stack'}
                            {step === 3 && '3. Primary Goals'}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 && 'Tell us about your organization to personalize your experience.'}
                            {step === 2 && 'Select the platforms you use. You can connect them later.'}
                            {step === 3 && 'Help us tailor our recommendations to what matters most.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderStepContent()}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-muted pt-6">
                        <Button
                            variant="outline"
                            onClick={() => setStep(step - 1)}
                            disabled={step === 1 || isLoading}
                        >
                            Back
                        </Button>
                        <Button
                            onClick={() => {
                                if (step < 3) setStep(step + 1);
                                else handleComplete();
                            }}
                            disabled={
                                (step === 1 && (!formData.companyName || !formData.industry || !formData.companySize)) ||
                                isLoading
                            }
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {step === 3 ? 'Complete Setup' : 'Continue'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};
