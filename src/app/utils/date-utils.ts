export function formatDateToISO(dateValue: any, emptyFallback: string = 'N/A'): string {
  if (!dateValue) {
    return emptyFallback;
  }

  let date: Date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    date = new Date(dateValue);
  } else {
    return emptyFallback;
  }

  if (isNaN(date.getTime())) {
    return emptyFallback;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Return date formatted for display as DD-MM-YYYY (or fallback)
export function formatDateToDisplay(dateValue: any, emptyFallback: string = ''): string {
  if (!dateValue) return emptyFallback;
  let date: Date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    // Try ISO parse first
    if (/^\d{4}-\d{2}-\d{2}/.test(String(dateValue))) {
      date = new Date(dateValue);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(String(dateValue))) {
      const parts = String(dateValue).split('-');
      date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      date = new Date(dateValue);
    }
  } else {
    return emptyFallback;
  }

  if (isNaN(date.getTime())) return emptyFallback;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Parse flexible input (DD-MM-YYYY or YYYY-MM-DD or Date) and return ISO YYYY-MM-DD or null
export function parseToISO(dateValue: any): string | null {
  if (!dateValue && dateValue !== 0) return null;

  if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) return null;
    return formatDateToISO(dateValue, null as any) as string;
  }

  const s = String(dateValue).trim();
  if (!s) return null;

  // DD-MM-YYYY
  const ddmmyyyy = /^\s*(\d{2})-(\d{2})-(\d{4})\s*$/;
  const iso = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/;
  let m = s.match(ddmmyyyy);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return null;
    return formatDateToISO(d, null as any) as string;
  }

  m = s.match(iso);
  if (m) {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return formatDateToISO(d, null as any) as string;
  }

  // Try Date parse
  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) return null;
  return formatDateToISO(parsed, null as any) as string;
}
