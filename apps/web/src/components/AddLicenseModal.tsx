import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { supabase } from '../lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface AddLicenseModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const CATEGORIES = ['Productivity', 'Development', 'Design', 'Security', 'Communication', 'Analytics', 'Infrastructure', 'Other'];
const LICENSE_TYPES = ['Per User', 'Site License', 'Enterprise', 'Open Source', 'Freemium'];
const BILLING_CYCLES = ['Monthly', 'Annual', 'Quarterly', 'One-time'];

export function AddLicenseModal({ open, onClose, onSuccess, initialData }: AddLicenseModalProps) {
    const defaultForm = {
        name: '',
        vendor: '',
        category: '',
        license_type: '',
        seats_purchased: 1,
        seats_used: 0,
        cost_per_seat: 0,
        billing_cycle: '',
        purchase_date: '',
        renewal_date: '',
        description: '',
    };

    const [formData, setFormData] = useState(defaultForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            if (initialData) {
                // Ensure dates are formatted correctly for input type="date"
                setFormData({
                    ...defaultForm,
                    name: initialData.plan_name || '',  // ← map plan_name to name
                    vendor: initialData.vendor || '',
                    category: initialData.category || '',
                    license_type: initialData.license_type || '',
                    seats_purchased: initialData.seats_purchased || 1,
                    seats_used: initialData.seats_used || 0,
                    cost_per_seat: initialData.cost_per_seat || 0,
                    billing_cycle: initialData.billing_cycle
                        ? initialData.billing_cycle.charAt(0).toUpperCase() + initialData.billing_cycle.slice(1)
                        : '',  // ← capitalize to match dropdown options
                    purchase_date: initialData.purchase_date ? new Date(initialData.purchase_date).toISOString().split('T')[0] : '',
                    renewal_date: initialData.renewal_date ? new Date(initialData.renewal_date).toISOString().split('T')[0] : '',
                    description: initialData.description || '',
                });
            } else {
                setFormData(defaultForm);
            }
        }
    }, [initialData, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        setFormData(defaultForm);
        setError('');
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session before submit:', session?.access_token ? 'EXISTS' : 'NULL');
        setError('');

        // Client-side validations
        if (!formData.name || !formData.vendor || !formData.category || !formData.license_type || !formData.billing_cycle || !formData.purchase_date || !formData.renewal_date) {
            setError('Please fill in all required fields marked with *');
            return;
        }

        if (Number(formData.seats_purchased) < 1) {
            setError('Total seats must be at least 1');
            return;
        }
        if (Number(formData.cost_per_seat) < 0) {
            setError('Cost per seat cannot be negative');
            return;
        }
        if (Number(formData.seats_used) > Number(formData.seats_purchased)) {
            setError('Used seats cannot exceed total purchased seats');
            return;
        }
        if (new Date(formData.renewal_date) <= new Date(formData.purchase_date)) {
            setError('Renewal date must be after purchase date');
            return;
        }

        try {
            setIsSubmitting(true);
            if (initialData?.id) {
                await api.patch(`/api/licenses/${initialData.id}`, {
                    ...formData,
                    plan_name: formData.name,
                    billing_cycle: formData.billing_cycle.toLowerCase(),
                });
                toast.success('License updated successfully');
            } else {
                await api.post('/api/licenses', formData);
                toast.success('License added successfully');
            }
            setFormData(defaultForm);
            onSuccess();
        } catch (err: any) {
            setError(err.message || (initialData?.id ? 'Failed to update license' : 'Failed to create license'));
            toast.error(err.message || (initialData?.id ? 'Failed to update license' : 'Failed to create license'));
        } finally {
            setIsSubmitting(false);
        }
    };

        return (
            <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleReset()}>
                <DialogContent className="sm:max-w-[600px] p-6">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="mb-4">
                            <DialogTitle className="font-sans font-semibold text-[24px] tracking-tight">
                                {initialData ? 'Edit License' : 'Add New License'}
                            </DialogTitle>
                        </DialogHeader>

                        {error && (
                            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Full width: License Name */}
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-[var(--text-primary)]">License Name<span className="text-destructive ml-1">*</span></label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Acme Pro Subscription"
                                    className="h-9"
                                    required
                                />
                            </div>

                            {/* Two column grid for: Vendor + Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-[var(--text-primary)]">Vendor<span className="text-destructive ml-1">*</span></label>
                                    <Input
                                        name="vendor"
                                        value={formData.vendor}
                                        onChange={handleChange}
                                        placeholder="e.g. Adobe"
                                        className="h-9"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-[var(--text-primary)]">Category<span className="text-destructive ml-1">*</span></label>
                                    <Select value={formData.category} onValueChange={(val) => handleSelectChange('category', val)} required>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Two column grid for: License Type + Total Seats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-[var(--text-primary)]">License Type<span className="text-destructive ml-1">*</span></label>
                                    <Select value={formData.license_type} onValueChange={(val) => handleSelectChange('license_type', val)} required>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LICENSE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-[var(--text-primary)]">Total Seats<span className="text-destructive ml-1">*</span></label>
                                    <Input
                                        name="seats_purchased"
                                        type="number"
                                        min="1"
                                        value={formData.seats_purchased}
                                        onChange={handleChange}
                                        className="h-9"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Two column grid for: Used Seats + Cost Per Seat */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-[var(--text-primary)]">Used Seats</label>
                                    <Input
                                        name="seats_used"
                                        type="number"
                                        min="0"
                                        value={formData.seats_used}
                                        onChange={handleChange}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-[var(--text-primary)]">Cost Per Seat<span className="text-destructive ml-1">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[13px]">$</span>
                                        <Input
                                            name="cost_per_seat"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.cost_per_seat}
                                            onChange={handleChange}
                                            className="h-9 pl-6"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Two column grid for: Billing Cycle + Purchase Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-[var(--text-primary)]">Billing Cycle<span className="text-destructive ml-1">*</span></label>
                                    <Select value={formData.billing_cycle} onValueChange={(val) => handleSelectChange('billing_cycle', val)} required>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select cycle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BILLING_CYCLES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-[var(--text-primary)]">Purchase Date<span className="text-destructive ml-1">*</span></label>
                                    <Input
                                        name="purchase_date"
                                        type="date"
                                        value={formData.purchase_date}
                                        onChange={handleChange}
                                        className="h-9 text-[13px]"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Full width: Renewal Date, Description */}
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-[var(--text-primary)]">Renewal Date<span className="text-destructive ml-1">*</span></label>
                                <Input
                                    name="renewal_date"
                                    type="date"
                                    value={formData.renewal_date}
                                    onChange={handleChange}
                                    className="h-9 text-[13px] w-1/2"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-[var(--text-primary)]">Description</label>
                                <Textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Optional notes about this license..."
                                    className="resize-none h-20 text-[13px]"
                                />
                            </div>

                        </div>

                        <DialogFooter className="mt-6 flex gap-2">
                            <Button type="button" variant="outline" onClick={handleReset} className="rounded-[6px] h-9 text-[13px]">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-[6px] h-9 text-[13px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white border border-[#1d4ed8]">
                                {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add License')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        );
    }
