import PDFDocument from 'pdfkit';
import { supabase } from '../utils/supabase';

// Fetch all org data needed for reports
export async function fetchReportData(orgId: string) {
    const [licensesRes, integrationsRes, alertsRes, recommendationsRes] = await Promise.all([
        supabase.from('licenses').select('*').eq('org_id', orgId),
        supabase.from('integrations').select('*').eq('org_id', orgId),
        supabase.from('compliance_alerts').select('*').eq('org_id', orgId),
        supabase.from('optimization_recommendations').select('*').eq('org_id', orgId),
    ]);

    const licenses = licensesRes.data || [];
    const integrations = integrationsRes.data || [];
    const alerts = alertsRes.data || [];
    const recommendations = recommendationsRes.data || [];

    const totalMonthlySpend = licenses.reduce((sum, l) =>
        sum + (Number(l.cost_per_seat) * (l.seats_purchased || 0)), 0);
    const totalSeats = licenses.reduce((sum, l) => sum + (l.seats_purchased || 0), 0);
    const totalUsedSeats = licenses.reduce((sum, l) => sum + (l.seats_used || 0), 0);
    const utilizationRate = totalSeats > 0 ? ((totalUsedSeats / totalSeats) * 100).toFixed(1) : '0';
    const potentialSavings = recommendations
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + Number(r.estimated_savings || 0), 0);

    return {
        licenses,
        integrations,
        alerts,
        recommendations,
        summary: {
            totalMonthlySpend,
            totalSeats,
            totalUsedSeats,
            utilizationRate,
            potentialSavings,
            connectedIntegrations: integrations.filter(i => i.status === 'connected').length,
            openAlerts: alerts.filter(a => !a.is_resolved).length,
        }
    };
}

// Helper — draw section header
function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, y: number) {
    doc.rect(50, y, 495, 28).fill('#2563eb');
    doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
        .text(title, 60, y + 8);
    doc.fillColor('#0f0f0f').font('Helvetica');
    return y + 40;
}

// Helper — draw table
function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], startY: number) {
    const colWidth = 495 / headers.length;
    let y = startY;

    // Header row
    doc.rect(50, y, 495, 22).fill('#f0f4ff');
    headers.forEach((h, i) => {
        doc.fillColor('#2563eb').fontSize(9).font('Helvetica-Bold')
            .text(h.toUpperCase(), 55 + i * colWidth, y + 7, { width: colWidth - 10 });
    });
    y += 22;

    // Data rows
    rows.forEach((row, rowIdx) => {
        if (y > 700) { doc.addPage(); y = 50; }
        if (rowIdx % 2 === 0) doc.rect(50, y, 495, 20).fill('#fafafa');
        doc.rect(50, y, 495, 20).stroke('#e8e8e8');
        row.forEach((cell, i) => {
            doc.fillColor('#0f0f0f').fontSize(9).font('Helvetica')
                .text(cell || '—', 55 + i * colWidth, y + 6, { width: colWidth - 10 });
        });
        y += 20;
    });

    return y + 15;
}

// Helper — draw key metric box
function drawMetricBox(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, color = '#2563eb') {
    doc.rect(x, y, 115, 55).fill('#f8f8f8').stroke('#e8e8e8');
    doc.fillColor(color).fontSize(18).font('Helvetica-Bold')
        .text(value, x + 8, y + 10, { width: 99 });
    doc.fillColor('#666666').fontSize(8).font('Helvetica')
        .text(label, x + 8, y + 35, { width: 99 });
}

// PDF header
function drawPDFHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
    doc.rect(0, 0, 595, 80).fill('#0f0f0f');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
        .text('Licensly', 50, 20);
    doc.fillColor('#a1a1a1').fontSize(10).font('Helvetica')
        .text(`AI-Powered SaaS License Management`, 50, 46);
    doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
        .text(title, 300, 20, { align: 'right', width: 245 });
    doc.fillColor('#a1a1a1').fontSize(9).font('Helvetica')
        .text(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`, 300, 46, { align: 'right', width: 245 });
    doc.fillColor('#0f0f0f');
    return 100;
}

// ── REPORT 1: License Utilization ──
export async function generateLicenseUtilizationPDF(orgId: string): Promise<Buffer> {
    const data = await fetchReportData(orgId);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        let y = drawPDFHeader(doc, 'License Utilization Report', '');

        // Summary metrics
        y = drawSectionHeader(doc, 'Executive Summary', y);
        drawMetricBox(doc, 'Total Licenses', String(data.licenses.length), 50, y);
        drawMetricBox(doc, 'Total Monthly Spend', `$${data.summary.totalMonthlySpend.toFixed(0)}`, 175, y, '#16a34a');
        drawMetricBox(doc, 'Seats Purchased', String(data.summary.totalSeats), 300, y);
        drawMetricBox(doc, 'Utilization Rate', `${data.summary.utilizationRate}%`, 425, y, Number(data.summary.utilizationRate) >= 70 ? '#16a34a' : '#d97706');
        y += 70;

        // License table
        y = drawSectionHeader(doc, 'License Details', y);
        const rows = data.licenses.map(l => [
            l.platform,
            l.plan_name || '—',
            String(l.seats_purchased),
            String(l.seats_used),
            `${l.seats_purchased > 0 ? ((l.seats_used / l.seats_purchased) * 100).toFixed(0) : 0}%`,
            `$${Number(l.cost_per_seat).toFixed(2)}`,
            `$${(Number(l.cost_per_seat) * l.seats_purchased).toFixed(2)}/mo`,
            l.renewal_date ? new Date(l.renewal_date).toLocaleDateString() : '—'
        ]);
        y = drawTable(doc, ['Platform', 'Plan', 'Purchased', 'Used', 'Util%', 'Cost/Seat', 'Monthly', 'Renewal'], rows, y);

        // Unused seats section
        const unusedLicenses = data.licenses.filter(l => l.seats_purchased > l.seats_used);
        if (unusedLicenses.length > 0) {
            y = drawSectionHeader(doc, 'Unused Seats Analysis', y);
            const unusedRows = unusedLicenses.map(l => [
                l.platform,
                String(l.seats_purchased - l.seats_used),
                `$${(Number(l.cost_per_seat) * (l.seats_purchased - l.seats_used)).toFixed(2)}/mo`,
                'Consider downgrading or removing unused seats'
            ]);
            y = drawTable(doc, ['Platform', 'Unused Seats', 'Wasted Cost', 'Recommendation'], unusedRows, y);
        }

        doc.end();
    });
}

// ── REPORT 2: Cost Optimization ──
export async function generateCostOptimizationPDF(orgId: string): Promise<Buffer> {
    const data = await fetchReportData(orgId);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        let y = drawPDFHeader(doc, 'Cost Optimization Report', '');

        y = drawSectionHeader(doc, 'Cost Summary', y);
        drawMetricBox(doc, 'Monthly Spend', `$${data.summary.totalMonthlySpend.toFixed(0)}`, 50, y, '#0f0f0f');
        drawMetricBox(doc, 'Annual Spend', `$${(data.summary.totalMonthlySpend * 12).toFixed(0)}`, 175, y, '#0f0f0f');
        drawMetricBox(doc, 'Potential Savings', `$${data.summary.potentialSavings.toFixed(0)}/mo`, 300, y, '#16a34a');
        drawMetricBox(doc, 'Recommendations', String(data.recommendations.filter(r => r.status === 'pending').length), 425, y, '#d97706');
        y += 70;

        // Cost by platform
        y = drawSectionHeader(doc, 'Spend by Platform', y);
        const spendRows = data.licenses
            .sort((a, b) => (Number(b.cost_per_seat) * b.seats_purchased) - (Number(a.cost_per_seat) * a.seats_purchased))
            .map(l => [
                l.platform,
                `$${Number(l.cost_per_seat).toFixed(2)}`,
                String(l.seats_purchased),
                `$${(Number(l.cost_per_seat) * l.seats_purchased).toFixed(2)}`,
                `$${(Number(l.cost_per_seat) * l.seats_purchased * 12).toFixed(2)}`,
                l.billing_cycle || '—'
            ]);
        y = drawTable(doc, ['Platform', 'Cost/Seat', 'Seats', 'Monthly', 'Annual', 'Cycle'], spendRows, y);

        // Optimization recommendations
        const pending = data.recommendations.filter(r => r.status === 'pending');
        if (pending.length > 0) {
            y = drawSectionHeader(doc, 'AI Optimization Recommendations', y);
            const recRows = pending.map(r => [
                r.platform || '—',
                r.type,
                r.title || r.description?.slice(0, 40) || '—',
                `$${Number(r.estimated_savings).toFixed(2)}/mo`
            ]);
            y = drawTable(doc, ['Platform', 'Type', 'Recommendation', 'Est. Savings'], recRows, y);

            // Total savings callout
            doc.rect(50, y, 495, 35).fill('#f0fdf4').stroke('#16a34a');
            doc.fillColor('#16a34a').fontSize(12).font('Helvetica-Bold')
                .text(`Total Potential Savings: $${data.summary.potentialSavings.toFixed(2)}/month ($${(data.summary.potentialSavings * 12).toFixed(2)}/year)`, 60, y + 11);
        }

        doc.end();
    });
}

// ── REPORT 3: Compliance Audit ──
export async function generateComplianceAuditPDF(orgId: string): Promise<Buffer> {
    const data = await fetchReportData(orgId);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        let y = drawPDFHeader(doc, 'Compliance Audit Report', '');

        const openAlerts = data.alerts.filter(a => !a.is_resolved);
        const criticalAlerts = openAlerts.filter(a => a.severity === 'critical');
        const complianceScore = Math.max(0, 100 - openAlerts.length * 10);

        y = drawSectionHeader(doc, 'Compliance Overview', y);
        drawMetricBox(doc, 'Compliance Score', `${complianceScore}%`, 50, y, complianceScore === 100 ? '#16a34a' : complianceScore >= 70 ? '#d97706' : '#dc2626');
        drawMetricBox(doc, 'Open Alerts', String(openAlerts.length), 175, y, openAlerts.length === 0 ? '#16a34a' : '#dc2626');
        drawMetricBox(doc, 'Critical Alerts', String(criticalAlerts.length), 300, y, criticalAlerts.length === 0 ? '#16a34a' : '#dc2626');
        drawMetricBox(doc, 'Resolved Alerts', String(data.alerts.filter(a => a.is_resolved).length), 425, y, '#16a34a');
        y += 70;

        // Expiring licenses
        const today = new Date();
        const expiring = data.licenses.filter(l => {
            if (!l.renewal_date) return false;
            const days = Math.ceil((new Date(l.renewal_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return days >= 0 && days <= 30;
        });

        if (expiring.length > 0) {
            y = drawSectionHeader(doc, 'Licenses Expiring Within 30 Days', y);
            const expiringRows = expiring.map(l => {
                const days = Math.ceil((new Date(l.renewal_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return [l.platform, l.renewal_date, String(days), days <= 7 ? 'CRITICAL' : 'WARNING'];
            });
            y = drawTable(doc, ['Platform', 'Renewal Date', 'Days Left', 'Priority'], expiringRows, y);
        }

        // Active alerts
        if (openAlerts.length > 0) {
            y = drawSectionHeader(doc, 'Active Compliance Alerts', y);
            const alertRows = openAlerts.map(a => [
                a.severity?.toUpperCase() || '—',
                a.alert_type || '—',
                a.message?.slice(0, 60) || '—',
                a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'
            ]);
            y = drawTable(doc, ['Severity', 'Type', 'Message', 'Due Date'], alertRows, y);
        } else {
            y = drawSectionHeader(doc, 'Active Compliance Alerts', y);
            doc.fillColor('#16a34a').fontSize(12).font('Helvetica-Bold')
                .text('✓ No open compliance alerts. All licenses are in good standing.', 60, y);
            y += 30;
        }

        doc.end();
    });
}

// ── REPORT 4: Integration Summary ──
export async function generateIntegrationSummaryPDF(orgId: string): Promise<Buffer> {
    const data = await fetchReportData(orgId);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        let y = drawPDFHeader(doc, 'Integration Summary Report', '');

        const connected = data.integrations.filter(i => i.status === 'connected');
        const disconnected = data.integrations.filter(i => i.status !== 'connected');

        y = drawSectionHeader(doc, 'Integration Overview', y);
        drawMetricBox(doc, 'Total Integrations', String(data.integrations.length), 50, y);
        drawMetricBox(doc, 'Connected', String(connected.length), 175, y, '#16a34a');
        drawMetricBox(doc, 'Disconnected', String(disconnected.length), 300, y, disconnected.length > 0 ? '#dc2626' : '#16a34a');
        drawMetricBox(doc, 'Licenses Tracked', String(data.licenses.length), 425, y, '#2563eb');
        y += 70;

        // Integration details
        y = drawSectionHeader(doc, 'Integration Details', y);
        const intRows = data.integrations.map(i => [
            i.platform,
            i.status?.toUpperCase() || '—',
            i.last_synced_at ? new Date(i.last_synced_at).toLocaleDateString() : 'Never',
            String(data.licenses.filter(l => l.platform?.toLowerCase() === i.platform?.toLowerCase()).length)
        ]);
        y = drawTable(doc, ['Platform', 'Status', 'Last Synced', 'Licenses'], intRows, y);

        // Licenses per integration
        y = drawSectionHeader(doc, 'Licenses by Platform', y);
        const licRows = data.licenses.map(l => [
            l.platform,
            l.plan_name || '—',
            String(l.seats_purchased),
            String(l.seats_used),
            `$${(Number(l.cost_per_seat) * l.seats_purchased).toFixed(2)}/mo`
        ]);
        y = drawTable(doc, ['Platform', 'Plan', 'Seats', 'Used', 'Monthly Cost'], licRows, y);

        doc.end();
    });
}

// ── CSV GENERATORS ──
export async function generateCSV(orgId: string, type: string): Promise<string> {
    const data = await fetchReportData(orgId);

    if (type === 'utilization') {
        const headers = ['Platform', 'Plan', 'Seats Purchased', 'Seats Used', 'Utilization %', 'Cost/Seat', 'Monthly Total', 'Renewal Date'];
        const rows = data.licenses.map(l => [
            l.platform,
            l.plan_name || '',
            l.seats_purchased,
            l.seats_used,
            `${l.seats_purchased > 0 ? ((l.seats_used / l.seats_purchased) * 100).toFixed(0) : 0}%`,
            `$${Number(l.cost_per_seat).toFixed(2)}`,
            `$${(Number(l.cost_per_seat) * l.seats_purchased).toFixed(2)}`,
            l.renewal_date || ''
        ]);
        return [headers, ...rows].map(r => r.join(',')).join('\n');
    }

    if (type === 'optimization') {
        const headers = ['Platform', 'Type', 'Description', 'Estimated Savings/mo', 'Status'];
        const rows = data.recommendations.map(r => [
            r.platform || '',
            r.type,
            `"${(r.description || '').replace(/"/g, '""')}"`,
            `$${Number(r.estimated_savings).toFixed(2)}`,
            r.status
        ]);
        return [headers, ...rows].map(r => r.join(',')).join('\n');
    }

    if (type === 'compliance') {
        const headers = ['Severity', 'Type', 'Message', 'Resolved', 'Due Date'];
        const rows = data.alerts.map(a => [
            a.severity,
            a.alert_type,
            `"${(a.message || '').replace(/"/g, '""')}"`,
            a.is_resolved ? 'Yes' : 'No',
            a.due_date || ''
        ]);
        return [headers, ...rows].map(r => r.join(',')).join('\n');
    }

    if (type === 'integrations') {
        const headers = ['Platform', 'Status', 'Last Synced', 'Licenses Count'];
        const rows = data.integrations.map(i => [
            i.platform,
            i.status,
            i.last_synced_at || 'Never',
            data.licenses.filter(l => l.platform?.toLowerCase() === i.platform?.toLowerCase()).length
        ]);
        return [headers, ...rows].map(r => r.join(',')).join('\n');
    }

    return '';
}
