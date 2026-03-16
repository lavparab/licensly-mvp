"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.licenseFilterSchema = exports.alertFilterSchema = exports.paginationSchema = exports.generateReportSchema = exports.onboardingCompleteSchema = exports.updateProfileSchema = exports.updateOrgSchema = exports.updateLicenseSchema = exports.createLicenseSchema = void 0;
const zod_1 = require("zod");
// ── License Schemas ──
exports.createLicenseSchema = zod_1.z.object({
    platform: zod_1.z.string().min(1, 'Platform is required'),
    plan_name: zod_1.z.string().min(1, 'Plan name is required'),
    seats_purchased: zod_1.z.number().int().min(0),
    seats_used: zod_1.z.number().int().min(0).default(0),
    cost_per_seat: zod_1.z.number().min(0),
    billing_cycle: zod_1.z.enum(['monthly', 'annual']),
    renewal_date: zod_1.z.string().optional(), // ISO date string
});
exports.updateLicenseSchema = zod_1.z.object({
    platform: zod_1.z.string().min(1).optional(),
    plan_name: zod_1.z.string().min(1).optional(),
    seats_purchased: zod_1.z.number().int().min(0).optional(),
    seats_used: zod_1.z.number().int().min(0).optional(),
    cost_per_seat: zod_1.z.number().min(0).optional(),
    billing_cycle: zod_1.z.enum(['monthly', 'annual']).optional(),
    renewal_date: zod_1.z.string().optional(),
});
// ── Organization / Settings Schemas ──
exports.updateOrgSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    plan: zod_1.z.string().optional(),
    company_size: zod_1.z.string().optional(),
    industry: zod_1.z.string().optional(),
});
exports.updateProfileSchema = zod_1.z.object({
    avatar_url: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
// ── Onboarding Schema ──
exports.onboardingCompleteSchema = zod_1.z.object({
    company_size: zod_1.z.string().min(1, 'Company size is required'),
    industry: zod_1.z.string().min(1, 'Industry is required'),
    org_name: zod_1.z.string().min(1).optional(),
});
// ── Report Schema ──
exports.generateReportSchema = zod_1.z.object({
    type: zod_1.z.enum(['utilization', 'optimization', 'compliance']),
    format: zod_1.z.enum(['pdf', 'csv', 'excel']),
});
// ── Query Schemas ──
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
});
exports.alertFilterSchema = zod_1.z.object({
    severity: zod_1.z.enum(['info', 'warning', 'critical']).optional(),
    is_resolved: zod_1.z.coerce.boolean().optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
});
exports.licenseFilterSchema = zod_1.z.object({
    platform: zod_1.z.string().optional(),
    billing_cycle: zod_1.z.enum(['monthly', 'annual']).optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
});
