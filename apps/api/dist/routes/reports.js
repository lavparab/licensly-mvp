"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reports_1 = require("../services/reports");
const validate_1 = require("../middleware/validate");
const errorHandler_1 = require("../middleware/errorHandler");
const schemas_1 = require("../types/schemas");
const router = (0, express_1.Router)();
// Generate and Download Report
router.post('/generate', auth_1.requireAuth, (0, validate_1.validate)(schemas_1.generateReportSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { type, format } = req.body;
    const orgId = req.orgId;
    if (!orgId)
        throw new Error("Unauthorized");
    if (format === 'pdf') {
        const pdfBuffer = await (0, reports_1.generateUtilizationPDF)(orgId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=licensly-report-${Date.now()}.pdf`);
        res.send(pdfBuffer);
    }
    else if (format === 'csv' || format === 'excel') {
        const excelBuffer = await (0, reports_1.generateRawDataExcel)(orgId);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=licensly-data-${Date.now()}.xlsx`);
        res.send(excelBuffer);
    }
    else {
        res.status(400).json({ error: "Unsupported format. Use 'pdf', 'csv', or 'excel'." });
    }
}));
exports.default = router;
