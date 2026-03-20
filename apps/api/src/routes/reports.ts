import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
    generateLicenseUtilizationPDF,
    generateCostOptimizationPDF,
    generateComplianceAuditPDF,
    generateIntegrationSummaryPDF,
    generateCSV
} from '../services/reportGenerator';

const router = Router();

// POST /api/reports/generate — Generate PDF report
router.post('/generate', requireAuth, async (req: AuthRequest, res) => {
    try {
        const orgId = req.orgId!;
        const { type, format } = req.body;

        if (!type || !format) {
            return res.status(400).json({ error: 'type and format are required' });
        }

        if (format === 'csv') {
            const csv = await generateCSV(orgId, type);
            const filename = `licensly-${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.send(csv);
        }

        // PDF generation
        let pdfBuffer: Buffer;
        const filename = `licensly-${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;

        switch (type) {
            case 'utilization':
                pdfBuffer = await generateLicenseUtilizationPDF(orgId);
                break;
            case 'optimization':
                pdfBuffer = await generateCostOptimizationPDF(orgId);
                break;
            case 'compliance':
                pdfBuffer = await generateComplianceAuditPDF(orgId);
                break;
            case 'integrations':
                pdfBuffer = await generateIntegrationSummaryPDF(orgId);
                break;
            default:
                return res.status(400).json({ error: 'Invalid report type' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', String(pdfBuffer.length));
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('Report generation failed:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

export default router;
