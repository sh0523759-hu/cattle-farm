// CSV Export utility and Print handler

export const exportToCSV = (data, filename = 'export.csv', columns = null) => {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  const csvRows = [];

  if (Array.isArray(columns) && columns.length > 0) {
    // Custom column schema
    const headerRow = columns.map(c => `"${String(c.header || c.label || c.key).replace(/"/g, '""')}"`).join(',');
    csvRows.push(headerRow);

    for (const row of data) {
      const values = columns.map(col => {
        let val = '';
        if (typeof col.accessor === 'function') {
          val = col.accessor(row);
        } else if (col.key) {
          val = row[col.key];
        }
        val = val !== undefined && val !== null ? String(val) : '';
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
  } else {
    // Automatic headers excluding internal IDs and binary/image URLs
    const excludedKeys = new Set(['_id', '__v', 'image', 'photo', 'avatar', 'password']);
    const sample = data[0];
    const headers = Object.keys(sample).filter(k => !excludedKeys.has(k) && typeof sample[k] !== 'function');

    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    for (const row of data) {
      const values = headers.map(header => {
        let val = row[header];
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        val = val !== undefined && val !== null ? String(val) : '';
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
  }

  // Prepend UTF-8 BOM (\uFEFF) for full Microsoft Excel and Google Sheets compatibility
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const triggerPrint = () => {
  window.print();
};
