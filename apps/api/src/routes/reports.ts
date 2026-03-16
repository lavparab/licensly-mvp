import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateUtilizationPDF, generateRawDataExcel } from '../services/reports';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { generateReportSchema } from '../types/schemas';

const router = Router();

// Generate and Download Report
router.post('/generate', requireAuth, validate(generateReportSchema), asyncHandler(async (req: AuthRequest, res) => {
    const { type, format } = req.body;
    const orgId = req.orgId;

    if (!orgId) throw new Error("Unauthorized");

    if (format === 'pdf') {
        const pdfBuffer = await generateUtilizationPDF(orgId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=licensly-report-${Date.now()}.pdf`);
        res.send(pdfBuffer);
    }
    else if (format === 'csv' || format === 'excel') {
        const excelBuffer = await generateRawDataExcel(orgId);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=licensly-data-${Date.now()}.xlsx`);
        res.send(excelBuffer);
    }
    else {
        res.status(400).json({ error: "Unsupported format. Use 'pdf', 'csv', or 'excel'." });
    }
}));

export default router;

