function autoFitWorksheetColumns(worksheet, rows, maxWidth = 50) {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  worksheet['!cols'] = headers.map((header) => {
    const longestValue = rows.reduce((longest, row) => {
      const valueLength = String(row[header] ?? '').length;
      return Math.max(longest, valueLength);
    }, header.length);

    return { wch: Math.min(Math.max(longestValue + 2, 12), maxWidth) };
  });
}

module.exports = { autoFitWorksheetColumns };
