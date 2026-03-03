"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUtilizationPDF = generateUtilizationPDF;
exports.generateRawDataExcel = generateRawDataExcel;
const pdfkit_1 = __importDefault(require("pdfkit"));
const XLSX = __importStar(require("xlsx"));
const supabase_1 = require("../utils/supabase");
// Mock report generation for MVP data
async function generateUtilizationPDF(orgId) {
    return new Promise(async (resolve, reject) => {
        try {
            const { data: licenses, error } = await supabase_1.supabase
                .from('licenses')
                .select('*')
                .eq('org_id', orgId);
            if (error)
                throw error;
            const doc = new pdfkit_1.default({ margin: 50 });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.fontSize(24).text('Licensly Utilization Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
            doc.moveDown(2);
            let totalSpend = 0;
            let totalWasted = 0;
            if (licenses && licenses.length > 0) {
                licenses.forEach((lic) => {
                    const cost = lic.cost_per_seat * lic.seats_purchased;
                    const wasted = (lic.seats_purchased - lic.seats_used) * lic.cost_per_seat;
                    totalSpend += cost;
                    if (wasted > 0)
                        totalWasted += wasted;
                    doc.fontSize(14).text(`${lic.platform} - ${lic.plan_name}`);
                    doc.fontSize(10).text(`Seats: ${lic.seats_used} active / ${lic.seats_purchased} purchased`);
                    doc.fontSize(10).text(`Cost Rate: $${lic.cost_per_seat} per seat`);
                    doc.moveDown();
                });
            }
            else {
                doc.text('No license data found for this organization.');
            }
            doc.moveDown(2);
            doc.fontSize(16).text(`Total Estimated Spend: $${totalSpend.toFixed(2)}`);
            doc.fontSize(16).fillColor('red').text(`Total Estimated Waste: $${totalWasted.toFixed(2)}`);
            doc.end();
        }
        catch (err) {
            reject(err);
        }
    });
}
async function generateRawDataExcel(orgId) {
    const { data: licenses, error } = await supabase_1.supabase
        .from('licenses')
        .select('platform, plan_name, seats_purchased, seats_used, cost_per_seat, renewal_date')
        .eq('org_id', orgId);
    if (error)
        throw error;
    const worksheet = XLSX.utils.json_to_sheet(licenses || []);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Licenses");
    // Write to buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return excelBuffer;
}
