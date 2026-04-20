// Parse one CSV line into array of fields (handles quoted fields + embedded commas).
export function csvSplitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { cur += c; }
    } else {
      if (c === '"') { inQ = true; }
      else if (c === ',') { out.push(cur); cur = ''; }
      else { cur += c; }
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

// Normalize a date string to YYYY-MM-DD.
// Accepts ISO, M/D/YYYY, M/D/YY, "Mar 6", "March 6, 2026".
export function parseLooseDate(s: string): string | null {
  if (!s) return null;
  s = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (m) {
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    return y + '-' + String(m[1]).padStart(2, '0') + '-' + String(m[2]).padStart(2, '0');
  }

  const monthIdx: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  m = s.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?$/);
  if (m) {
    const mi = monthIdx[m[1].toLowerCase()];
    if (mi == null) return null;
    const y = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
    return y + '-' + String(mi + 1).padStart(2, '0') + '-' + String(m[2]).padStart(2, '0');
  }

  const d = new Date(s);
  if (!isNaN(d.valueOf())) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  return null;
}

// Normalize a time string to HH:MM (24h). Accepts "3:30 PM", "15:30", "7pm", "TBD".
export function parseLooseTime(s: string): string | null {
  if (!s) return null;
  s = s.trim().toUpperCase();
  if (s === 'TBD' || s === '') return null;
  let m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2];
    const ap = m[3];
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return String(h).padStart(2, '0') + ':' + min;
  }
  m = s.match(/^(\d{1,2})\s*(AM|PM)$/);
  if (m) {
    let h = parseInt(m[1], 10);
    const ap = m[2];
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return String(h).padStart(2, '0') + ':00';
  }
  return null;
}

export function fmtDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d.valueOf())) return iso;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return MONTHS[d.getMonth()] + ' ' + d.getDate();
}

export function fmtDisplayDay(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d.valueOf())) return '';
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return DAYS[d.getDay()];
}

export function fmtDisplayTime(t: string | null | undefined): string {
  if (!t) return 'TBD';
  const parts = t.split(':');
  if (parts.length < 2) return t;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return t;
  return (h > 12 ? h - 12 : h || 12) + ':' + m + ' ' + (h >= 12 ? 'PM' : 'AM');
}
