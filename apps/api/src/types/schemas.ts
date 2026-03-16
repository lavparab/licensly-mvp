import { z } from 'zod';

// ── License Schemas ──

export const createLicenseSchema = z.object({
    platform: z.string().min(1, 'Platform is required'),
    plan_name: z.string().min(1, 'Plan name is required'),
    seats_purchased: z.number().int().min(0),
    seats_used: z.number().int().min(0).default(0),
    cost_per_seat: z.number().min(0),
    billing_cycle: z.enum(['monthly', 'annual']),
    renewal_date: z.string().optional(), // ISO date string
});

export const updateLicenseSchema = z.object({
    platform: z.string().min(1).optional(),
    plan_name: z.string().min(1).optional(),
    seats_purchased: z.number().int().min(0).optional(),
    seats_used: z.number().int().min(0).optional(),
    cost_per_seat: z.number().min(0).optional(),
    billing_cycle: z.enum(['monthly', 'annual']).optional(),
    renewal_date: z.string().optional(),
});

// ── Organization / Settings Schemas ──

export const updateOrgSchema = z.object({
    name: z.string().min(1).optional(),
    plan: z.string().optional(),
    company_size: z.string().optional(),
    industry: z.string().optional(),
});

export const updateProfileSchema = z.object({
    avatar_url: z.string().url().optional().or(z.literal('')),
});

// ── Onboarding Schema ──

export const onboardingCompleteSchema = z.object({
    company_size: z.string().min(1, 'Company size is required'),
    industry: z.string().min(1, 'Industry is required'),
    org_name: z.string().min(1).optional(),
});

// ── Report Schema ──

export const generateReportSchema = z.object({
    type: z.enum(['utilization', 'optimization', 'compliance']),
    format: z.enum(['pdf', 'csv', 'excel']),
});

// ── Query Schemas ──

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const alertFilterSchema = z.object({
    severity: z.enum(['info', 'warning', 'critical']).optional(),
    is_resolved: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const licenseFilterSchema = z.object({
    platform: z.string().optional(),
    billing_cycle: z.enum(['monthly', 'annual']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
});
