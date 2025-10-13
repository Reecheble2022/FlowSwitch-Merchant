export function exportToCSV(data: any[], filename: string, filters?: Record<string, any>) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);

  const csvRows: string[] = [];

  if (filters && Object.keys(filters).length > 0) {
    const filterStr = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
    csvRows.push(`# Filters: ${filterStr}`);
  }

  csvRows.push(headers.map(escapeCSV).join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return escapeCSV(value);
    });
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const fullFilename = `flowswitch-${filename}-${timestamp}.csv`;

  downloadBlob(blob, fullFilename);
}

export function exportToXLSX(data: any[], filename: string, filters?: Record<string, any>) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => row[h]));

  let xml = '<?xml version="1.0"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Worksheet ss:Name="Sheet1">\n';
  xml += '<Table>\n';

  if (filters && Object.keys(filters).length > 0) {
    xml += '<Row>\n';
    const filterStr = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
    xml += `<Cell><Data ss:Type="String">Filters: ${escapeXML(filterStr)}</Data></Cell>\n`;
    xml += '</Row>\n';
  }

  xml += '<Row>\n';
  headers.forEach(header => {
    xml += `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXML(header)}</Data></Cell>\n`;
  });
  xml += '</Row>\n';

  rows.forEach(row => {
    xml += '<Row>\n';
    row.forEach(cell => {
      const cellValue = cell === null || cell === undefined ? '' : String(cell);
      const cellType = typeof cell === 'number' ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${cellType}">${escapeXML(cellValue)}</Data></Cell>\n`;
    });
    xml += '</Row>\n';
  });

  xml += '</Table>\n';
  xml += '</Worksheet>\n';
  xml += '</Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const fullFilename = `flowswitch-${filename}-${timestamp}.xls`;

  downloadBlob(blob, fullFilename);
}

export function printTable(data: any[], title: string, filters?: Record<string, any>) {
  if (!data || data.length === 0) {
    throw new Error('No data to print');
  }

  const headers = Object.keys(data[0]);

  let html = '<!DOCTYPE html>\n<html>\n<head>\n';
  html += '<meta charset="utf-8">\n';
  html += `<title>${title}</title>\n`;
  html += '<style>\n';
  html += 'body { font-family: Arial, sans-serif; margin: 20px; }\n';
  html += 'h1 { color: #10b981; margin-bottom: 5px; }\n';
  html += '.filters { color: #6b7280; font-size: 14px; margin-bottom: 20px; }\n';
  html += 'table { border-collapse: collapse; width: 100%; }\n';
  html += 'th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }\n';
  html += 'th { background: linear-gradient(135deg, #10b981, #06b6d4); color: white; font-weight: 600; }\n';
  html += 'tr:nth-child(even) { background-color: #f9fafb; }\n';
  html += '@media print { button { display: none; } }\n';
  html += '</style>\n';
  html += '</head>\n<body>\n';
  html += `<h1>${title}</h1>\n`;

  if (filters && Object.keys(filters).length > 0) {
    const filterStr = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
    html += `<div class="filters">Filters: ${filterStr}</div>\n`;
  }

  html += `<p style="color: #6b7280; font-size: 14px;">Generated: ${new Date().toLocaleString()}</p>\n`;
  html += '<table>\n<thead>\n<tr>\n';

  headers.forEach(header => {
    html += `<th>${header.replace(/_/g, ' ').toUpperCase()}</th>\n`;
  });

  html += '</tr>\n</thead>\n<tbody>\n';

  data.forEach(row => {
    html += '<tr>\n';
    headers.forEach(header => {
      const value = row[header] === null || row[header] === undefined ? '' : String(row[header]);
      html += `<td>${value}</td>\n`;
    });
    html += '</tr>\n';
  });

  html += '</tbody>\n</table>\n';
  html += '<br><button onclick="window.print()" style="padding: 10px 20px; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Print</button>\n';
  html += '</body>\n</html>';

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';

  const str = String(value);

  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function escapeXML(value: any): string {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
