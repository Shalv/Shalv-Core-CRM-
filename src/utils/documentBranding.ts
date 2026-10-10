import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CompanyProfileMaster, PurchaseOrder, Invoice } from '../types';
import { amountInWords } from './numberToWords';

/**
 * Returns the company initials (e.g. "CS" for Coreenact Solutions)
 */
export function getCompanyInitials(companyName?: string): string {
  if (!companyName) return 'CS';
  return (
    companyName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'CS'
  );
}

/**
 * Returns an inline SVG / IMG HTML string for standalone print & HTML archive documents
 */
export function getInlineBrandLogoHtml(
  supplierCompany: CompanyProfileMaster,
  sizePx = 44
): string {
  if (supplierCompany.logoUrl) {
    return `<img src="${supplierCompany.logoUrl}" alt="${supplierCompany.name}" style="height: ${sizePx}px; width: auto; max-width: 160px; object-fit: contain; border-radius: 8px; display: block;" />`;
  }

  return `
    <div style="display: inline-flex; align-items: center; justify-content: center; width: ${sizePx}px; height: ${sizePx}px; border-radius: 10px; background: linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #06b6d4 100%); box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25); flex-shrink: 0; position: relative; overflow: hidden;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="${Math.round(sizePx * 0.78)}" height="${Math.round(sizePx * 0.78)}" fill="none">
        <path d="M46 20 C66 10, 96 18, 108 34 C113 41, 108 50, 98 49 C85 48, 72 38, 52 36 Z" fill="#93c5fd" opacity="0.85"/>
        <path d="M16 42 C14 64, 16 88, 30 104 C42 116, 58 114, 66 104 C50 96, 42 78, 42 56 C42 40, 48 26, 58 16 C38 16, 18 26, 16 42 Z" fill="#ffffff"/>
        <path d="M16 52 C16 30, 38 10, 66 10 C82 10, 96 16, 104 26 C90 20, 72 20, 56 30 C42 38, 34 54, 30 70 C20 66, 16 59, 16 52 Z" fill="#67e8f9"/>
        <path d="M48 114 C70 120, 98 110, 110 92 C114 85, 110 76, 102 78 C92 80, 82 96, 62 104 Z" fill="#38bdf8"/>
        <path d="M20 78 C24 98, 42 116, 66 116 C84 116, 98 104, 106 88 C109 81, 103 74, 94 76 C80 80, 68 94, 50 94 C36 94, 26 86, 20 78 Z" fill="#e0f2fe"/>
      </svg>
    </div>
  `;
}

/**
 * Draws a branded emblem on a jsPDF instance (supports data-URI image if uploaded, or vector emblem)
 */
export function drawPdfBrandEmblem(
  doc: jsPDF,
  x: number,
  y: number,
  sizeMm: number,
  supplierCompany: CompanyProfileMaster
) {
  const initials = getCompanyInitials(supplierCompany.name);

  if (supplierCompany.logoUrl && supplierCompany.logoUrl.startsWith('data:image/')) {
    try {
      const isPng = supplierCompany.logoUrl.startsWith('data:image/png');
      doc.addImage(
        supplierCompany.logoUrl,
        isPng ? 'PNG' : 'JPEG',
        x,
        y,
        sizeMm,
        sizeMm,
        undefined,
        'FAST'
      );
      return;
    } catch {
      // Fallback to vector emblem below
    }
  }

  // Outer Royal Blue Badge
  doc.setFillColor(30, 64, 175); // #1e40af
  doc.roundedRect(x, y, sizeMm, sizeMm, 2.2, 2.2, 'F');

  // Inner Cyan/Blue Accent Ribbon
  doc.setFillColor(14, 165, 233); // #0ea5e9
  doc.roundedRect(x + 0.8, y + 0.8, sizeMm - 1.6, sizeMm * 0.35, 1.2, 1.2, 'F');

  // Monogram Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(sizeMm * 0.85);
  doc.text(initials, x + sizeMm / 2, y + sizeMm * 0.68, { align: 'center' });
}

/**
 * High-Resolution A4 Portrait PDF Exporter using html2canvas + jsPDF with proper 10mm A4 margins
 */
export async function exportElementToPortraitPdf(
  captureEl: HTMLElement,
  fileName: string
): Promise<void> {
  const canvas = await html2canvas(captureEl, {
    scale: 2.2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 820,
    scrollX: 0,
    scrollY: 0,
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 10; // 10mm left & right margin
  const marginY = 10; // 10mm top & bottom margin
  const printableWidth = pageWidth - marginX * 2; // 190mm
  const printableHeight = pageHeight - marginY * 2; // 277mm

  const imgWidth = printableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  if (imgHeight <= printableHeight) {
    pdf.addImage(imgData, 'JPEG', marginX, marginY, imgWidth, imgHeight, undefined, 'FAST');
  } else {
    // If slightly taller than 1 page (e.g. up to 315mm), scale to fit neatly on a single A4 page with margins
    if (imgHeight <= printableHeight * 1.18) {
      const scaleFactor = printableHeight / imgHeight;
      const scaledWidth = imgWidth * scaleFactor;
      const centeredX = marginX + (printableWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'JPEG', centeredX, marginY, scaledWidth, printableHeight, undefined, 'FAST');
    } else {
      // Multi-page slice with clean top/bottom margins
      let heightLeft = imgHeight;
      let pageIndex = 0;

      while (heightLeft > 0) {
        if (pageIndex > 0) {
          pdf.addPage();
        }
        const offsetY = marginY - pageIndex * printableHeight;
        pdf.addImage(imgData, 'JPEG', marginX, offsetY, imgWidth, imgHeight, undefined, 'FAST');

        // Mask top and bottom margin bands in white so multi-page slices have clean 10mm margins
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, marginY, 'F');
        pdf.rect(0, pageHeight - marginY, pageWidth, marginY, 'F');

        heightLeft -= printableHeight;
        pageIndex++;
      }
    }
  }

  pdf.save(fileName);
}

/**
 * Triggers isolated A4 portrait print / Save as PDF via hidden iframe with fallback
 */
export function triggerStandalonePrint(printHtml: string): void {
  try {
    let iframe = document.getElementById('crm-print-hidden-iframe') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'crm-print-hidden-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
        } catch (iframeErr) {
          console.warn('Iframe print error, falling back to window.print', iframeErr);
          window.print();
        }
      }, 300);
      return;
    }
  } catch (err) {
    console.warn('Iframe print setup failed, falling back to window.print', err);
  }

  setTimeout(() => {
    window.print();
  }, 150);
}

/**
 * Generates standalone A4 HTML for Purchase Order (used for Print / Save as PDF & HTML Archive Download)
 */
export function generatePrintablePurchaseOrderHtml(
  po: PurchaseOrder,
  supplierCompany: CompanyProfileMaster,
  options: {
    copyType: string;
    includeGstTable: boolean;
    includeBankDetails: boolean;
    includeSignatory: boolean;
    includeNotes: boolean;
  }
): string {
  const formatCur = (amt: number) =>
    '₹' +
    Number(amt || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const amountWords = amountInWords(po.grandTotal);
  const isInterState = po.igstAmount > 0 || (po.vendorStateCode && po.vendorStateCode !== supplierCompany.stateCode);
  const isApproved =
    po.status === 'Approved' ||
    po.status === 'Issued to Vendor' ||
    po.status === 'Received / Completed';

  const gstMap: Record<
    string,
    {
      hsnSac: string;
      taxableAmount: number;
      gstRate: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalTax: number;
    }
  > = {};

  po.items.forEach((it) => {
    const k = `${it.hsnSac || '998313'}_${it.gstRate}`;
    if (!gstMap[k]) {
      gstMap[k] = {
        hsnSac: it.hsnSac || '998313',
        taxableAmount: 0,
        gstRate: it.gstRate,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
      };
    }
    gstMap[k].taxableAmount += it.taxableAmount;
    gstMap[k].cgstAmount += it.cgstAmount;
    gstMap[k].sgstAmount += it.sgstAmount;
    gstMap[k].igstAmount += it.igstAmount;
    gstMap[k].totalTax += it.totalTax;
  });

  const gstList = Object.values(gstMap);
  const logoHtml = getInlineBrandLogoHtml(supplierCompany, 44);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Purchase_Order_${po.poNumber.replace(/\//g, '_')}</title>
  <style>
    @page {
      size: A4 portrait !important;
      margin: 10mm 12mm !important;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10.5px;
      line-height: 1.45;
    }
    .sheet {
      width: 100%;
      max-width: 760px;
      margin: 0 auto;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      overflow: hidden;
      background: #ffffff;
    }
    .brand-bar {
      height: 6px;
      background: linear-gradient(90deg, #1e40af 0%, #2563eb 50%, #06b6d4 100%);
    }
    .sheet-inner {
      padding: 20px 22px;
    }
    .top-badges {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .badge-primary {
      display: inline-block;
      padding: 4px 10px;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #1d4ed8;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
    }
    .badge-copy {
      display: inline-block;
      padding: 4px 10px;
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-left: 6px;
    }
    .badge-status {
      display: inline-block;
      padding: 4px 10px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 6px;
      background: ${isApproved ? '#ecfdf5' : '#fffbeb'};
      color: ${isApproved ? '#047857' : '#b45309'};
      border: 1px solid ${isApproved ? '#6ee7b7' : '#fde68a'};
    }
    table.layout-table {
      width: 100%;
      border-collapse: collapse;
    }
    .company-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.2;
    }
    .company-tagline {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1d4ed8;
      margin-top: 2px;
    }
    .meta-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .party-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      height: 100%;
    }
    .section-label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1d4ed8;
      margin-bottom: 4px;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      margin-bottom: 14px;
      border: 1px solid #cbd5e1;
    }
    table.items-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 7px 6px;
      border-bottom: 1.5px solid #94a3b8;
      border-right: 1px solid #cbd5e1;
      text-align: left;
    }
    table.items-table td {
      padding: 7px 6px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      vertical-align: top;
      font-size: 10px;
      word-break: break-word;
    }
    table.items-table th:last-child,
    table.items-table td:last-child {
      border-right: none;
    }
    .mono {
      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-variant-numeric: tabular-nums;
    }
    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="brand-bar"></div>
    <div class="sheet-inner">
      <div class="top-badges">
        <div>
          <span class="badge-primary">PURCHASE ORDER</span>
          <span class="badge-copy">${options.copyType}</span>
        </div>
        <div>
          <span class="badge-status">${po.status}</span>
        </div>
      </div>

      <!-- Company Identity & PO Metadata -->
      <table class="layout-table" style="margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0;">
        <tr>
          <td style="width: 58%; vertical-align: top; padding-right: 14px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              ${logoHtml}
              <div>
                <h1 class="company-title">${supplierCompany.legalName || supplierCompany.name}</h1>
                <div class="company-tagline">Authorized Procurement & Enterprise Operations</div>
              </div>
            </div>
            <div style="color: #475569; font-size: 10px; margin-bottom: 6px;">
              ${supplierCompany.address}, ${supplierCompany.city}, ${supplierCompany.state} - ${supplierCompany.pincode}
            </div>
            <table style="width: 100%; font-size: 9.5px; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px;">
              <tr>
                <td style="padding: 2px 6px;">GSTIN: <strong class="mono">${supplierCompany.gstin}</strong></td>
                <td style="padding: 2px 6px;">PAN: <strong class="mono">${supplierCompany.pan}</strong></td>
              </tr>
              <tr>
                <td style="padding: 2px 6px;">State: <strong>${supplierCompany.state} (${supplierCompany.stateCode})</strong></td>
                <td style="padding: 2px 6px;">Phone: <strong class="mono">${supplierCompany.phone}</strong></td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 2px 6px;">Email: <strong>${supplierCompany.email}</strong> ${supplierCompany.website ? `| Web: <strong>${supplierCompany.website}</strong>` : ''}</td>
              </tr>
            </table>
          </td>
          <td style="width: 42%; vertical-align: top;">
            <div class="meta-card">
              <div style="text-align: right; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
                <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Purchase Order Number</div>
                <div class="mono" style="font-size: 14px; font-weight: 800; color: #1d4ed8; margin-top: 2px;">${po.poNumber}</div>
              </div>
              <table style="width: 100%; font-size: 10px;">
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">PO Date:</td>
                  <td class="text-right mono" style="font-weight: 700;">${po.poDate}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Expected Delivery:</td>
                  <td class="text-right mono" style="font-weight: 700; color: #1d4ed8;">${po.expectedDeliveryDate || 'Immediate'}</td>
                </tr>
                ${po.referenceQuotationNo ? `
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Vendor Quote Ref:</td>
                  <td class="text-right mono" style="font-weight: 600;">${po.referenceQuotationNo}</td>
                </tr>` : ''}
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Payment Terms:</td>
                  <td class="text-right" style="font-weight: 700;">${po.paymentTerms || '30 Days Net'}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Place of Supply:</td>
                  <td class="text-right" style="font-weight: 700;">${po.placeOfSupply} (${po.placeOfSupplyCode})</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>

      <!-- Vendor (Bill From) & Delivery Destination (Ship To) -->
      <table class="layout-table" style="margin-bottom: 12px;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 7px;">
            <div class="party-card">
              <div class="section-label">Vendor / Supplier (Bill From)</div>
              <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">${po.vendorName}</div>
              <div style="color: #475569; font-size: 10px; margin-bottom: 6px;">
                ${po.vendorAddress}${po.vendorCity ? `, ${po.vendorCity}` : ''}${po.vendorState ? `, ${po.vendorState}` : ''}${po.vendorPincode ? ` - ${po.vendorPincode}` : ''}
              </div>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 5px; font-size: 9.5px; color: #334155;">
                <div>GSTIN: <strong class="mono">${po.vendorGstin || 'Unregistered'}</strong> | State: <strong>${po.vendorState || '—'} (${po.vendorStateCode || '—'})</strong></div>
                ${po.contactPerson ? `<div style="margin-top: 2px;">Contact: <strong>${po.contactPerson}</strong> ${po.vendorPhone ? `(${po.vendorPhone})` : ''}</div>` : ''}
                ${po.vendorEmail ? `<div style="margin-top: 2px;">Email: <span class="mono">${po.vendorEmail}</span></div>` : ''}
              </div>
            </div>
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 7px;">
            <div class="party-card">
              <div class="section-label">Delivery & Shipping Destination (Ship To)</div>
              <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">${supplierCompany.legalName || supplierCompany.name} — Receiving Desk</div>
              <div style="color: #475569; font-size: 10px; margin-bottom: 6px;">
                ${po.shippingAddress || `${supplierCompany.address}, ${supplierCompany.city}, ${supplierCompany.state} - ${supplierCompany.pincode}`}
              </div>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 5px; font-size: 9.5px; color: #334155;">
                <div>Destination GSTIN: <strong class="mono">${supplierCompany.gstin}</strong></div>
                <div style="margin-top: 2px;">Destination State: <strong>${supplierCompany.state} (${supplierCompany.stateCode})</strong></div>
                <div style="margin-top: 2px;">Receiving Contact: <strong class="mono">${supplierCompany.phone}</strong> · ${supplierCompany.email}</div>
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Line Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th class="text-center" style="width: 4%;">#</th>
            <th style="width: 28%;">Item Description & Specifications</th>
            <th class="text-center" style="width: 9%;">HSN/SAC</th>
            <th class="text-center" style="width: 8%;">Qty</th>
            <th class="text-right" style="width: 12%;">Rate (₹)</th>
            <th class="text-right" style="width: 13%;">Taxable (₹)</th>
            <th class="text-center" style="width: 6%;">GST %</th>
            <th class="text-right" style="width: 9%;">Tax (₹)</th>
            <th class="text-right" style="width: 11%;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${po.items
            .map(
              (it, idx) => `
            <tr>
              <td class="text-center mono" style="color: #64748b;">${idx + 1}</td>
              <td>
                <div style="font-weight: 700; color: #0f172a;">${it.productName}</div>
                ${it.description ? `<div style="font-size: 9px; color: #64748b; margin-top: 2px;">${it.description}</div>` : ''}
                ${it.productCode ? `<div class="mono" style="font-size: 8.5px; color: #94a3b8; margin-top: 1px;">SKU: ${it.productCode}</div>` : ''}
              </td>
              <td class="text-center mono">${it.hsnSac || '998313'}</td>
              <td class="text-center mono"><strong>${it.quantity}</strong> <span style="font-size: 8.5px; color: #64748b;">${it.unit || 'Each'}</span></td>
              <td class="text-right mono">${formatCur(it.unitPrice)}</td>
              <td class="text-right mono" style="font-weight: 600;">${formatCur(it.taxableAmount)}</td>
              <td class="text-center mono">${it.gstRate}%</td>
              <td class="text-right mono" style="color: #1d4ed8;">${formatCur(it.totalTax)}</td>
              <td class="text-right mono" style="font-weight: 700; color: #0f172a;">${formatCur(it.lineTotal)}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>

      ${
        options.includeGstTable && gstList.length > 0
          ? `
      <!-- GST Tax Analysis Breakdown -->
      <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; background: #f8fafc;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 6px;">
          <span>Statutory GST & HSN/SAC Tax Summary</span>
          <span style="color: #64748b;">Supply Type: ${isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;" class="mono">
          <thead>
            <tr style="border-bottom: 1px solid #cbd5e1; color: #475569;">
              <th style="padding: 4px 6px; text-align: left;">HSN / SAC</th>
              <th style="padding: 4px 6px; text-align: right;">Taxable Value (₹)</th>
              ${
                !isInterState
                  ? `<th style="padding: 4px 6px; text-align: center;">CGST %</th>
                     <th style="padding: 4px 6px; text-align: right;">CGST Amt (₹)</th>
                     <th style="padding: 4px 6px; text-align: center;">SGST %</th>
                     <th style="padding: 4px 6px; text-align: right;">SGST Amt (₹)</th>`
                  : `<th style="padding: 4px 6px; text-align: center;">IGST %</th>
                     <th style="padding: 4px 6px; text-align: right;">IGST Amt (₹)</th>`
              }
              <th style="padding: 4px 6px; text-align: right; color: #0f172a;">Total Tax (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${gstList
              .map(
                (g) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 4px 6px; font-weight: 700;">${g.hsnSac}</td>
                <td style="padding: 4px 6px; text-align: right;">${formatCur(g.taxableAmount)}</td>
                ${
                  !isInterState
                    ? `<td style="padding: 4px 6px; text-align: center;">${g.gstRate / 2}%</td>
                       <td style="padding: 4px 6px; text-align: right;">${formatCur(g.cgstAmount)}</td>
                       <td style="padding: 4px 6px; text-align: center;">${g.gstRate / 2}%</td>
                       <td style="padding: 4px 6px; text-align: right;">${formatCur(g.sgstAmount)}</td>`
                    : `<td style="padding: 4px 6px; text-align: center;">${g.gstRate}%</td>
                       <td style="padding: 4px 6px; text-align: right;">${formatCur(g.igstAmount)}</td>`
                }
                <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #1d4ed8;">${formatCur(g.totalTax)}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`
          : ''
      }

      <!-- Totals, Words, Bank & Terms -->
      <table class="layout-table" style="margin-bottom: 14px;">
        <tr>
          <td style="width: 56%; vertical-align: top; padding-right: 12px;">
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px;">
              <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #1e40af;">Total Order Value in Words</div>
              <div style="font-size: 10.5px; font-weight: 700; color: #0f172a; margin-top: 2px;">${amountWords}</div>
            </div>

            ${
              options.includeBankDetails
                ? `
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; font-size: 9.5px;">
              <div style="font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 3px; font-size: 9px;">Buyer Bank & Billing Settlement Coordinates</div>
              <div>Bank: <strong>${supplierCompany.bankDetails.bankName}</strong> | A/C Name: <strong>${supplierCompany.bankDetails.accountName}</strong></div>
              <div>A/C No: <strong class="mono">${supplierCompany.bankDetails.accountNumber}</strong> | IFSC: <strong class="mono">${supplierCompany.bankDetails.ifscCode}</strong></div>
              <div style="color: #64748b;">Branch: ${supplierCompany.bankDetails.branch}</div>
            </div>`
                : ''
            }

            ${
              options.includeNotes
                ? `
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 12px; font-size: 9.5px; color: #334155;">
              <div style="font-weight: 800; text-transform: uppercase; color: #92400e; margin-bottom: 3px; font-size: 9px;">Procurement Terms & Delivery Instructions</div>
              <div style="white-space: pre-line;">${po.termsAndConditions || '1. Deliveries must strictly adhere to stated specifications.\n2. Vendor tax invoices must quote this Purchase Order number.'}</div>
              ${po.notes ? `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #fcd34d;"><strong>Notes:</strong> ${po.notes}</div>` : ''}
            </div>`
                : ''
            }
          </td>
          <td style="width: 44%; vertical-align: top;">
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px;">
              <table style="width: 100%; font-size: 10.5px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #475569;">Subtotal (Gross):</td>
                  <td class="text-right mono" style="padding: 4px 0; font-weight: 600;">${formatCur(po.subtotal)}</td>
                </tr>
                ${
                  po.totalDiscount > 0
                    ? `<tr>
                        <td style="padding: 4px 0; color: #047857;">Vendor Discount:</td>
                        <td class="text-right mono" style="padding: 4px 0; color: #047857;">- ${formatCur(po.totalDiscount)}</td>
                      </tr>`
                    : ''
                }
                <tr style="border-top: 1px solid #cbd5e1;">
                  <td style="padding: 5px 0; font-weight: 700; color: #0f172a;">Taxable Value:</td>
                  <td class="text-right mono" style="padding: 5px 0; font-weight: 700;">${formatCur(po.taxableAmount)}</td>
                </tr>
                ${
                  po.cgstAmount > 0
                    ? `<tr>
                        <td style="padding: 3px 0; color: #475569;">Central GST (CGST):</td>
                        <td class="text-right mono" style="padding: 3px 0;">${formatCur(po.cgstAmount)}</td>
                      </tr>`
                    : ''
                }
                ${
                  po.sgstAmount > 0
                    ? `<tr>
                        <td style="padding: 3px 0; color: #475569;">State GST (SGST):</td>
                        <td class="text-right mono" style="padding: 3px 0;">${formatCur(po.sgstAmount)}</td>
                      </tr>`
                    : ''
                }
                ${
                  po.igstAmount > 0
                    ? `<tr>
                        <td style="padding: 3px 0; color: #475569;">Integrated GST (IGST):</td>
                        <td class="text-right mono" style="padding: 3px 0;">${formatCur(po.igstAmount)}</td>
                      </tr>`
                    : ''
                }
                <tr style="border-top: 2px solid #0f172a; background: #eff6ff;">
                  <td style="padding: 8px 6px; font-weight: 800; font-size: 11.5px; color: #0f172a;">Grand Total (PO Value):</td>
                  <td class="text-right mono" style="padding: 8px 6px; font-weight: 800; font-size: 12.5px; color: #1d4ed8;">${formatCur(po.grandTotal)}</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>

      <!-- Statutory Declaration & Signatory -->
      <table class="layout-table" style="border-top: 1px solid #cbd5e1; padding-top: 12px;">
        <tr>
          <td style="width: 58%; vertical-align: bottom; padding-top: 10px;">
            <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #334155;">Commercial & Statutory Declaration:</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 2px; line-height: 1.4;">
              This Purchase Order is an official commercial commitment issued by ${supplierCompany.legalName || supplierCompany.name}. Please quote PO Number <strong>${po.poNumber}</strong> on all delivery challans, e-way bills, and GST tax invoices.
            </div>
          </td>
          <td style="width: 42%; vertical-align: bottom; text-align: right; padding-top: 10px;">
            ${
              options.includeSignatory
                ? `
            <div style="font-size: 10.5px; font-weight: 800; color: #0f172a;">For ${supplierCompany.legalName || supplierCompany.name}</div>
            <div style="margin: 8px 0;">
              <span style="display: inline-block; padding: 4px 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; color: #1d4ed8; font-size: 9px; font-weight: 700;">
                ✓ Digitally Verified · Coreenact Authority
              </span>
            </div>
            <div style="border-top: 1px solid #64748b; display: inline-block; min-width: 180px; padding-top: 4px; text-align: center;">
              <div style="font-size: 10px; font-weight: 700; color: #0f172a;">${po.approvedByName || 'Authorized Procurement Signatory'}</div>
              <div style="font-size: 8.5px; color: #64748b;">${isApproved ? `Approved (${po.approvedAt ? po.approvedAt.split('T')[0] : po.poDate})` : 'Pending Final Authorization'}</div>
            </div>`
                : ''
            }
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates a pure Vector A4 Portrait PDF for a Purchase Order using jsPDF (Zero overlapping columns)
 */
export function generatePurchaseOrderVectorPdf(
  po: PurchaseOrder,
  supplierCompany: CompanyProfileMaster,
  options: {
    copyType: string;
    includeGstTable: boolean;
    includeBankDetails: boolean;
    includeSignatory: boolean;
    includeNotes: boolean;
  }
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const left = 12;
  const right = 198;
  const contentWidth = right - left; // 186mm
  const midX = 105;
  let y = 12;

  const formatNum = (amt: number): string =>
    Number(amt || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatRs = (amt: number): string => 'Rs. ' + formatNum(amt);
  const isInterState = po.igstAmount > 0 || (po.vendorStateCode && po.vendorStateCode !== supplierCompany.stateCode);
  const isApproved =
    po.status === 'Approved' ||
    po.status === 'Issued to Vendor' ||
    po.status === 'Received / Completed';

  // Top Brand Accent Bar
  doc.setFillColor(30, 64, 175);
  doc.rect(left, y, contentWidth, 2, 'F');
  y += 2;

  // Header Section
  drawPdfBrandEmblem(doc, left + 4, y + 3.5, 11, supplierCompany);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(supplierCompany.legalName || supplierCompany.name, left + 18, y + 8);

  doc.setFontSize(7);
  doc.setTextColor(29, 78, 216);
  doc.text('AUTHORIZED PROCUREMENT & ENTERPRISE OPERATIONS', left + 18, y + 12);

  // Right Document Title & Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(29, 78, 216);
  doc.text('PURCHASE ORDER', right - 4, y + 7.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(`(${options.copyType})`, right - 4, y + 11.5, { align: 'right' });

  if (isApproved) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(110, 231, 183);
    doc.roundedRect(right - 36, y + 13, 32, 4.5, 1, 1, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(4, 120, 87);
    doc.setFont('helvetica', 'bold');
    doc.text(po.status.toUpperCase(), right - 20, y + 16.2, { align: 'center' });
  } else {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(right - 38, y + 13, 34, 4.5, 1, 1, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.text(po.status.toUpperCase(), right - 21, y + 16.2, { align: 'center' });
  }

  // Left Company Address (wrapped cleanly to 105mm max width)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(71, 85, 105);
  const fullCompanyAddr = `${supplierCompany.address}, ${supplierCompany.city}, ${supplierCompany.state} - ${supplierCompany.pincode}`;
  const addrLines = doc.splitTextToSize(fullCompanyAddr, 102);
  doc.text(addrLines, left + 4, y + 18);
  const addrOffset = addrLines.length * 3.5;

  doc.text(
    `GSTIN: ${supplierCompany.gstin}   |   PAN: ${supplierCompany.pan}   |   State: ${supplierCompany.state} (${supplierCompany.stateCode})`,
    left + 4,
    y + 18 + addrOffset
  );
  doc.text(
    `Email: ${supplierCompany.email}   |   Phone: ${supplierCompany.phone}`,
    left + 4,
    y + 21.8 + addrOffset
  );

  // Right PO Number & Dates
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`PO No: ${po.poNumber}`, right - 4, y + 21.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(71, 85, 105);
  doc.text(`PO Date: ${po.poDate}`, right - 4, y + 25.5, { align: 'right' });
  doc.text(`Expected Delivery: ${po.expectedDeliveryDate || 'Immediate'}`, right - 4, y + 29.2, { align: 'right' });
  doc.text(
    `Terms: ${po.paymentTerms || '30 Days'}   |   POS: ${po.placeOfSupply} (${po.placeOfSupplyCode})`,
    right - 4,
    y + 33,
    { align: 'right' }
  );

  y += Math.max(36, 25 + addrOffset);
  doc.setDrawColor(203, 213, 225);
  doc.line(left, y, right, y);

  // --- Vendor (Bill From) & Ship To Section ---
  const partyBoxHeight = 27;
  doc.line(midX, y, midX, y + partyBoxHeight);

  // Left: Vendor
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text('VENDOR / SUPPLIER (BILL FROM)', left + 4, y + 4.5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(doc.splitTextToSize(po.vendorName, 85)[0] || po.vendorName, left + 4, y + 9);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const vendorAddrStr = `${po.vendorAddress}${po.vendorCity ? ', ' + po.vendorCity : ''}${po.vendorState ? ', ' + po.vendorState : ''}`;
  const vendorAddrLines = doc.splitTextToSize(vendorAddrStr, 85).slice(0, 2);
  doc.text(vendorAddrLines, left + 4, y + 13);

  doc.text(
    `GSTIN: ${po.vendorGstin || 'Unregistered'}  |  State: ${po.vendorState || '—'} (${po.vendorStateCode || '—'})`,
    left + 4,
    y + 20.5
  );
  if (po.contactPerson || po.vendorPhone) {
    doc.text(
      `Contact: ${po.contactPerson || '—'} ${po.vendorPhone ? `(${po.vendorPhone})` : ''}`,
      left + 4,
      y + 24.5
    );
  }

  // Right: Ship To
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text('DELIVERY & SHIPPING DESTINATION (SHIP TO)', midX + 4, y + 4.5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${supplierCompany.name} - Receiving Facility`, midX + 4, y + 9);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const shipAddr =
    po.shippingAddress ||
    `${supplierCompany.address}, ${supplierCompany.city}, ${supplierCompany.state} - ${supplierCompany.pincode}`;
  const shipLines = doc.splitTextToSize(shipAddr, 85).slice(0, 2);
  doc.text(shipLines, midX + 4, y + 13);
  doc.text(`Destination GSTIN: ${supplierCompany.gstin}`, midX + 4, y + 20.5);
  doc.text(
    `State: ${supplierCompany.state} (${supplierCompany.stateCode})  |  Ref: ${po.referenceQuotationNo || 'Direct PO'}`,
    midX + 4,
    y + 24.5
  );

  y += partyBoxHeight;
  doc.line(left, y, right, y);

  // --- Items Table Header (Non-overlapping calibrated column boundaries) ---
  // Col boundaries: 12 | 20 | 78 | 93 | 107 | 128 | 150 | 161 | 179 | 198
  const colX = [12, 20, 78, 93, 107, 128, 150, 161, 179, 198];

  doc.setFillColor(241, 245, 249);
  doc.rect(left, y, contentWidth, 7, 'F');
  doc.line(left, y + 7, right, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.6);
  doc.setTextColor(15, 23, 42);
  doc.text('#', 16, y + 4.6, { align: 'center' });
  doc.text('ITEM DESCRIPTION', 21.5, y + 4.6);
  doc.text('HSN/SAC', 85.5, y + 4.6, { align: 'center' });
  doc.text('QTY', 100, y + 4.6, { align: 'center' });
  doc.text('RATE (INR)', 126.5, y + 4.6, { align: 'right' });
  doc.text('TAXABLE (INR)', 148.5, y + 4.6, { align: 'right' });
  doc.text('GST%', 155.5, y + 4.6, { align: 'center' });
  doc.text('TAX (INR)', 177.5, y + 4.6, { align: 'right' });
  doc.text('TOTAL (INR)', 196.5, y + 4.6, { align: 'right' });

  y += 7;

  // --- Items Rows ---
  po.items.forEach((item, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    const titleLines = doc.splitTextToSize(item.productName, 54);
    const descLines = item.description
      ? doc.splitTextToSize(item.description, 54).slice(0, 2)
      : [];
    const rowHeight = Math.max(7.5, titleLines.length * 3.5 + descLines.length * 3 + 2.5);

    const textY = y + 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(String(idx + 1), 16, textY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(titleLines, 21.5, textY);

    if (descLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.3);
      doc.setTextColor(100, 116, 139);
      doc.text(descLines, 21.5, textY + titleLines.length * 3.4);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(item.hsnSac || '998313', 85.5, textY, { align: 'center' });
    doc.text(`${item.quantity} ${item.unit || ''}`, 100, textY, { align: 'center' });
    doc.text(formatNum(item.unitPrice), 126.5, textY, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatNum(item.taxableAmount), 148.5, textY, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${item.gstRate}%`, 155.5, textY, { align: 'center' });

    doc.setTextColor(29, 78, 216);
    doc.text(formatNum(item.totalTax), 177.5, textY, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatNum(item.lineTotal), 196.5, textY, { align: 'right' });

    // Vertical column dividers for crisp tabular separation
    doc.setDrawColor(226, 232, 240);
    for (let i = 1; i < colX.length - 1; i++) {
      doc.line(colX[i], y - (idx === 0 ? 7 : 0), colX[i], y + rowHeight);
    }

    y += rowHeight;
    doc.line(left, y, right, y);
  });

  if (y < 132) {
    y = 132;
    doc.setDrawColor(203, 213, 225);
    doc.line(left, y, right, y);
  }

  // --- GST Breakdown Table ---
  const gstMap: Record<
    string,
    {
      hsnSac: string;
      taxableAmount: number;
      gstRate: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalTax: number;
    }
  > = {};
  po.items.forEach((it) => {
    const k = `${it.hsnSac || '998313'}_${it.gstRate}`;
    if (!gstMap[k]) {
      gstMap[k] = {
        hsnSac: it.hsnSac || '998313',
        taxableAmount: 0,
        gstRate: it.gstRate,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
      };
    }
    gstMap[k].taxableAmount += it.taxableAmount;
    gstMap[k].cgstAmount += it.cgstAmount;
    gstMap[k].sgstAmount += it.sgstAmount;
    gstMap[k].igstAmount += it.igstAmount;
    gstMap[k].totalTax += it.totalTax;
  });
  const gstList = Object.values(gstMap);

  if (options.includeGstTable && gstList.length > 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(left, y, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    doc.text('STATUTORY GST & HSN/SAC TAX BREAKDOWN', left + 4, y + 3.8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      isInterState ? 'Supply Type: Inter-State (IGST)' : 'Supply Type: Intra-State (CGST + SGST)',
      right - 4,
      y + 3.8,
      { align: 'right' }
    );
    y += 5.5;
    doc.line(left, y, right, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    if (!isInterState) {
      doc.text('HSN / SAC', 16, y + 3.8);
      doc.text('Taxable Value (Rs.)', 70, y + 3.8, { align: 'right' });
      doc.text('CGST %', 84, y + 3.8, { align: 'center' });
      doc.text('CGST Amt (Rs.)', 116, y + 3.8, { align: 'right' });
      doc.text('SGST %', 130, y + 3.8, { align: 'center' });
      doc.text('SGST Amt (Rs.)', 162, y + 3.8, { align: 'right' });
      doc.text('Total Tax (Rs.)', 196, y + 3.8, { align: 'right' });
    } else {
      doc.text('HSN / SAC', 16, y + 3.8);
      doc.text('Taxable Value (Rs.)', 90, y + 3.8, { align: 'right' });
      doc.text('IGST %', 115, y + 3.8, { align: 'center' });
      doc.text('IGST Amt (Rs.)', 158, y + 3.8, { align: 'right' });
      doc.text('Total Tax (Rs.)', 196, y + 3.8, { align: 'right' });
    }
    y += 5;
    doc.line(left, y, right, y);

    gstList.forEach((g) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      doc.text(g.hsnSac, 16, y + 3.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      if (!isInterState) {
        doc.text(formatRs(g.taxableAmount), 70, y + 3.8, { align: 'right' });
        doc.text(`${g.gstRate / 2}%`, 84, y + 3.8, { align: 'center' });
        doc.text(formatRs(g.cgstAmount), 116, y + 3.8, { align: 'right' });
        doc.text(`${g.gstRate / 2}%`, 130, y + 3.8, { align: 'center' });
        doc.text(formatRs(g.sgstAmount), 162, y + 3.8, { align: 'right' });
      } else {
        doc.text(formatRs(g.taxableAmount), 90, y + 3.8, { align: 'right' });
        doc.text(`${g.gstRate}%`, 115, y + 3.8, { align: 'center' });
        doc.text(formatRs(g.igstAmount), 158, y + 3.8, { align: 'right' });
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text(formatRs(g.totalTax), 196, y + 3.8, { align: 'right' });
      y += 5;
      doc.line(left, y, right, y);
    });
  }

  // --- Totals, Amount in Words & Terms ---
  const totalsBlockHeight = 52;
  doc.line(midX + 4, y, midX + 4, y + totalsBlockHeight);
  const maxLeftWidth = midX - left;

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text('TOTAL ORDER VALUE IN WORDS:', left + 4, y + 4.5);

  doc.setFontSize(7.4);
  doc.setTextColor(15, 23, 42);
  const splitWords = doc.splitTextToSize(amountInWords(po.grandTotal), maxLeftWidth - 4);
  doc.text(splitWords, left + 4, y + 8.5);

  let leftCursorY = y + 9 + splitWords.length * 3.6;

  if (options.includeBankDetails) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(left + 3, leftCursorY, maxLeftWidth - 2, 18, 1.5, 1.5, 'FD');
    doc.setFontSize(6.6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('BUYER BANK & SETTLEMENT DETAILS', left + 5, leftCursorY + 3.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Bank: ${supplierCompany.bankDetails.bankName}  |  A/C: ${supplierCompany.bankDetails.accountNumber}`, left + 5, leftCursorY + 8);
    doc.text(`IFSC: ${supplierCompany.bankDetails.ifscCode}  |  Branch: ${supplierCompany.bankDetails.branch}`, left + 5, leftCursorY + 12);
    leftCursorY += 20;
  }

  if (options.includeNotes) {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const termsText = po.termsAndConditions || '1. Deliveries must adhere to stated specifications. 2. Quote PO number on all invoices.';
    const splitTerms = doc.splitTextToSize(`Terms: ${termsText.replace(/\n/g, ' ')}`, maxLeftWidth - 4).slice(0, 3);
    doc.text(splitTerms, left + 4, leftCursorY + 2);
  }

  // Right Totals Calculation
  let sumY = y + 5.5;
  doc.setFontSize(7.4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal (Gross):', midX + 8, sumY);
  doc.text(formatRs(po.subtotal), right - 4, sumY, { align: 'right' });

  if (po.totalDiscount > 0) {
    sumY += 4.5;
    doc.setTextColor(4, 120, 87);
    doc.text('Vendor Discount:', midX + 8, sumY);
    doc.text(`- ${formatRs(po.totalDiscount)}`, right - 4, sumY, { align: 'right' });
  }

  sumY += 4.8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Taxable Value:', midX + 8, sumY);
  doc.text(formatRs(po.taxableAmount), right - 4, sumY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  if (po.cgstAmount > 0) {
    sumY += 4.5;
    doc.text('Central GST (CGST):', midX + 8, sumY);
    doc.text(formatRs(po.cgstAmount), right - 4, sumY, { align: 'right' });
  }
  if (po.sgstAmount > 0) {
    sumY += 4.5;
    doc.text('State GST (SGST):', midX + 8, sumY);
    doc.text(formatRs(po.sgstAmount), right - 4, sumY, { align: 'right' });
  }
  if (po.igstAmount > 0) {
    sumY += 4.5;
    doc.text('Integrated GST (IGST):', midX + 8, sumY);
    doc.text(formatRs(po.igstAmount), right - 4, sumY, { align: 'right' });
  }

  sumY += 6.5;
  doc.setFillColor(239, 246, 255);
  doc.rect(midX + 4, sumY - 4.2, right - (midX + 4), 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(29, 78, 216);
  doc.text('Grand Total (PO Value):', midX + 8, sumY + 0.8);
  doc.text(formatRs(po.grandTotal), right - 4, sumY + 0.8, { align: 'right' });

  y += totalsBlockHeight;
  doc.setDrawColor(203, 213, 225);
  doc.line(left, y, right, y);

  // --- Signatory & Declaration Footer ---
  const footerHeight = 25;
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('COMMERCIAL & STATUTORY DECLARATION:', left + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Purchase Order issued by ' + (supplierCompany.legalName || supplierCompany.name) + '.', left + 4, y + 9);
  doc.text('Quote PO Number ' + po.poNumber + ' on all delivery challans and GST tax invoices.', left + 4, y + 13);
  doc.text('* Computer-generated Purchase Order valid for commercial & GST ITC reconciliation.', left + 4, y + 17);

  if (options.includeSignatory) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`For ${supplierCompany.legalName || supplierCompany.name}`, right - 4, y + 5, { align: 'right' });

    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(right - 48, y + 7, 44, 4.5, 1, 1, 'FD');
    doc.setFontSize(6.2);
    doc.setTextColor(29, 78, 216);
    doc.text('Digitally Verified - Coreenact', right - 26, y + 10.2, { align: 'center' });

    doc.setDrawColor(148, 163, 184);
    doc.line(right - 48, y + 18, right - 4, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(po.approvedByName || 'Authorized Signatory', right - 26, y + 21.5, { align: 'center' });
  }

  const finalHeight = y + footerHeight - 12;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(left, 12, contentWidth, finalHeight, 'S');

  return doc;
}

export interface SalarySlipPdfData {
  supplierCompany: CompanyProfileMaster;
  employee: {
    name: string;
    designation?: string;
    department?: string;
    role?: string;
  };
  statutory: {
    empCode: string;
    panNumber: string;
    uanNumber: string;
    bankName: string;
    bankAccountNo: string;
    ifscCode: string;
    taxRegime?: string;
  };
  monthMeta: {
    label: string;
    payDate: string;
  };
  breakdown: {
    basic: number;
    hra: number;
    specialAllowance: number;
    conveyance: number;
    incentive: number;
    grossEarnings: number;
    pfDeduction: number;
    professionalTax: number;
    incomeTaxTds: number;
    loanRecovery?: number;
    advanceRecovery?: number;
    otherDeductions?: number;
    totalDeductions?: number;
    approvedReimbursements: number;
    netPayable: number;
    paidDays?: number;
    lopDays?: number;
    policyLopDeductionAmount?: number;
  };
}

/**
 * Generates a clean A4 portrait Vector PDF for an Employee Salary Slip with logo branding
 */
export function generateSalarySlipVectorPdf(data: SalarySlipPdfData): jsPDF {
  const { supplierCompany, employee, statutory, monthMeta, breakdown } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const left = 14;
  const right = 196;
  const contentWidth = right - left; // 182mm
  const midX = 105;
  let y = 14;

  const formatNum = (amt: number): string =>
    Number(amt || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const formatRs = (amt: number): string => 'Rs. ' + formatNum(amt);

  // Top Accent Bar
  doc.setFillColor(30, 64, 175);
  doc.rect(left, y, contentWidth, 2.5, 'F');
  y += 2.5;

  // Header & Logo Emblem
  drawPdfBrandEmblem(doc, left + 4, y + 4, 12, supplierCompany);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(supplierCompany.legalName || supplierCompany.name, left + 20, y + 8.5);

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  const compAddr = `${supplierCompany.address}, ${supplierCompany.city}, ${supplierCompany.state} - ${supplierCompany.pincode}`;
  doc.text(doc.splitTextToSize(compAddr, 105)[0] || compAddr, left + 20, y + 12.5);
  doc.text(
    `GSTIN: ${supplierCompany.gstin}   |   PAN: ${supplierCompany.pan}`,
    left + 20,
    y + 16.5
  );

  // Right Header Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(29, 78, 216);
  doc.text('OFFICIAL SALARY SLIP', right - 4, y + 8.5, { align: 'right' });

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${monthMeta.label}`, right - 4, y + 12.5, { align: 'right' });
  doc.text(`Disbursement Date: ${monthMeta.payDate}`, right - 4, y + 16.5, { align: 'right' });

  y += 22;
  doc.setDrawColor(203, 213, 225);
  doc.line(left, y, right, y);

  // Employee Information Box
  const infoBoxHeight = 28;
  doc.setFillColor(248, 250, 252);
  doc.rect(left, y, contentWidth, infoBoxHeight, 'F');
  doc.line(left, y + infoBoxHeight, right, y + infoBoxHeight);
  doc.line(midX, y, midX, y + infoBoxHeight);

  // Left side: Employee Identity
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Employee Name:', left + 4, y + 6);
  doc.setTextColor(15, 23, 42);
  doc.text(employee.name, left + 34, y + 6);

  doc.setTextColor(71, 85, 105);
  doc.text('Employee Code:', left + 4, y + 11.5);
  doc.setTextColor(29, 78, 216);
  doc.text(statutory.empCode, left + 34, y + 11.5);

  doc.setTextColor(71, 85, 105);
  doc.text('Designation:', left + 4, y + 17);
  doc.setTextColor(15, 23, 42);
  doc.text(employee.designation || employee.role || 'Staff', left + 34, y + 17);

  doc.setTextColor(71, 85, 105);
  doc.text('Department:', left + 4, y + 22.5);
  doc.setTextColor(15, 23, 42);
  doc.text(employee.department || 'Operations', left + 34, y + 22.5);

  // Right side: Statutory & Bank Details
  doc.setTextColor(71, 85, 105);
  doc.text('PAN / UAN:', midX + 4, y + 6);
  doc.setTextColor(15, 23, 42);
  doc.text(`${statutory.panNumber} / ${statutory.uanNumber}`, midX + 34, y + 6);

  doc.setTextColor(71, 85, 105);
  doc.text('Bank Name & A/C:', midX + 4, y + 11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${statutory.bankName} (${statutory.bankAccountNo})`, midX + 34, y + 11.5);

  doc.setTextColor(71, 85, 105);
  doc.text('IFSC Code:', midX + 4, y + 17);
  doc.setTextColor(15, 23, 42);
  doc.text(statutory.ifscCode, midX + 34, y + 17);

  doc.setTextColor(71, 85, 105);
  doc.text('Paid Days / LOP:', midX + 4, y + 22.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${breakdown.paidDays ?? 30} Days (LOP: ${breakdown.lopDays ?? 0} Days)`, midX + 34, y + 22.5);

  y += infoBoxHeight;

  // Earnings vs Deductions Table
  const colW = contentWidth / 2;
  const tableHeaderH = 7;
  doc.setFillColor(241, 245, 249);
  doc.rect(left, y, contentWidth, tableHeaderH, 'F');
  doc.line(left, y + tableHeaderH, right, y + tableHeaderH);
  doc.line(left + colW, y, left + colW, y + tableHeaderH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('EARNINGS', left + 4, y + 4.8);
  doc.text('AMOUNT (INR)', left + colW - 4, y + 4.8, { align: 'right' });
  doc.text('DEDUCTIONS & ADJUSTMENTS', left + colW + 4, y + 4.8);
  doc.text('AMOUNT (INR)', right - 4, y + 4.8, { align: 'right' });

  y += tableHeaderH;

  const earnings = [
    { label: 'Basic Salary', amount: breakdown.basic },
    { label: 'House Rent Allowance (HRA)', amount: breakdown.hra },
    { label: 'Special Allowance', amount: breakdown.specialAllowance },
    { label: 'Conveyance Allowance', amount: breakdown.conveyance },
    { label: 'CRM Performance Incentive', amount: breakdown.incentive },
  ];

  const deductions = [
    { label: 'EPF Employee Contribution', amount: breakdown.pfDeduction, isMinus: true },
    { label: 'Professional Tax (PT)', amount: breakdown.professionalTax, isMinus: true },
    { label: 'Income Tax (TDS)', amount: breakdown.incomeTaxTds, isMinus: true },
    ...(breakdown.loanRecovery && breakdown.loanRecovery > 0
      ? [{ label: 'Loan EMI Recovery', amount: breakdown.loanRecovery, isMinus: true }]
      : []),
    ...(breakdown.advanceRecovery && breakdown.advanceRecovery > 0
      ? [{ label: 'Salary Advance Recovery', amount: breakdown.advanceRecovery, isMinus: true }]
      : []),
    ...(breakdown.otherDeductions && breakdown.otherDeductions > 0
      ? [{ label: 'Other Admin Deductions', amount: breakdown.otherDeductions, isMinus: true }]
      : []),
    { label: 'Approved Reimbursements', amount: breakdown.approvedReimbursements, isMinus: false },
    { label: 'Policy LOP Deduction', amount: breakdown.policyLopDeductionAmount || 0, isMinus: true },
  ];

  const rowCount = Math.max(earnings.length, deductions.length);
  const rowHeight = 7.5;

  for (let i = 0; i < rowCount; i++) {
    const e = earnings[i];
    const d = deductions[i];
    const rowY = y + i * rowHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);

    // Left Earnings
    if (e) {
      doc.text(e.label, left + 4, rowY + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(formatNum(e.amount), left + colW - 4, rowY + 5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    }

    // Right Deductions
    if (d) {
      doc.text(d.label, left + colW + 4, rowY + 5);
      doc.setFont('helvetica', 'bold');
      const sign = d.isMinus ? '- ' : '+ ';
      doc.setTextColor(d.isMinus ? 180 : 4, d.isMinus ? 30 : 120, d.isMinus ? 30 : 87);
      doc.text(d.amount > 0 ? `${sign}${formatNum(d.amount)}` : '0.00', right - 4, rowY + 5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(left, rowY + rowHeight, right, rowY + rowHeight);
    doc.line(left + colW, rowY, left + colW, rowY + rowHeight);
  }

  y += rowCount * rowHeight;

  // Subtotal Summary Rows
  const summaryH = 8.5;
  doc.setFillColor(248, 250, 252);
  doc.rect(left, y, contentWidth, summaryH, 'F');
  doc.line(left, y + summaryH, right, y + summaryH);
  doc.line(left + colW, y, left + colW, y + summaryH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  doc.text('Gross Earnings:', left + 4, y + 5.5);
  doc.text(formatRs(breakdown.grossEarnings), left + colW - 4, y + 5.5, { align: 'right' });

  const totalDeductions =
    breakdown.totalDeductions !== undefined
      ? breakdown.totalDeductions
      : breakdown.pfDeduction +
        breakdown.professionalTax +
        breakdown.incomeTaxTds +
        (breakdown.loanRecovery || 0) +
        (breakdown.advanceRecovery || 0) +
        (breakdown.otherDeductions || 0) +
        (breakdown.policyLopDeductionAmount || 0);
  doc.text('Total Deductions:', left + colW + 4, y + 5.5);
  doc.setTextColor(180, 30, 30);
  doc.text(`- ${formatRs(totalDeductions)}`, right - 4, y + 5.5, { align: 'right' });

  y += summaryH;

  // NET PAY HIGHLIGHT BLOCK
  const netH = 14;
  doc.setFillColor(239, 246, 255);
  doc.rect(left, y, contentWidth, netH, 'F');
  doc.line(left, y + netH, right, y + netH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('NET SALARY PAYABLE:', left + 4, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87);
  doc.text(formatRs(breakdown.netPayable), right - 4, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`In Words: ${amountInWords(breakdown.netPayable)}`, left + 4, y + 11);

  y += netH;

  // Signatory & Authentication Footer
  const footerH = 26;
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('DISCLAIMER & AUTHORIZATION:', left + 4, y + 6);
  doc.text(
    'This is a digitally generated salary slip from Enact 360 Enterprise Payroll & ESS.',
    left + 4,
    y + 10.5
  );
  doc.text(
    'All statutory deductions (EPF, PT, TDS) are deposited as per Indian Government regulations.',
    left + 4,
    y + 15
  );

  // Signatory Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`For ${supplierCompany.legalName || supplierCompany.name}`, right - 4, y + 6, {
    align: 'right',
  });

  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(right - 46, y + 8, 42, 4.5, 1, 1, 'FD');
  doc.setFontSize(6.2);
  doc.setTextColor(29, 78, 216);
  doc.text('Digitally Verified - Coreenact Payroll', right - 25, y + 11.2, { align: 'center' });

  doc.setDrawColor(148, 163, 184);
  doc.line(right - 46, y + 18, right - 4, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('Authorized HR Signatory', right - 25, y + 21.5, { align: 'center' });

  // Outer Border Box
  const finalH = y + footerH - 14;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(left, 14, contentWidth, finalH, 'S');

  return doc;
}

