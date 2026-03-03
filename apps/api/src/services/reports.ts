import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { supabase } from '../utils/supabase';

// Mock report generation for MVP data
export async function generateUtilizationPDF(orgId: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        try {
            const { data: licenses, error } = await supabase
                .from('licenses')
                .select('*')
                .eq('org_id', orgId);

            if (error) throw error;

            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            doc.fontSize(24).text('Licensly Utilization Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
            doc.moveDown(2);

            let totalSpend = 0;
            let totalWasted = 0;

            if (licenses && licenses.length > 0) {
                licenses.forEach((lic: any) => {
                    const cost = lic.cost_per_seat * lic.seats_purchased;
                    const wasted = (lic.seats_purchased - lic.seats_used) * lic.cost_per_seat;
                    totalSpend += cost;
                    if (wasted > 0) totalWasted += wasted;

                    doc.fontSize(14).text(`${lic.platform} - ${lic.plan_name}`);
                    doc.fontSize(10).text(`Seats: ${lic.seats_used} active / ${lic.seats_purchased} purchased`);
                    doc.fontSize(10).text(`Cost Rate: $${lic.cost_per_seat} per seat`);
                    doc.moveDown();
                });
            } else {
                doc.text('No license data found for this organization.');
            }

            doc.moveDown(2);
            doc.fontSize(16).text(`Total Estimated Spend: $${totalSpend.toFixed(2)}`);
            doc.fontSize(16).fillColor('red').text(`Total Estimated Waste: $${totalWasted.toFixed(2)}`);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

export async function generateRawDataExcel(orgId: string): Promise<Buffer> {
    const { data: licenses, error } = await supabase
        .from('licenses')
        .select('platform, plan_name, seats_purchased, seats_used, cost_per_seat, renewal_date')
        .eq('org_id', orgId);

    if (error) throw error;

    const worksheet = XLSX.utils.json_to_sheet(licenses || []);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Licenses");

    // Write to buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return excelBuffer;
}
