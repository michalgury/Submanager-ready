function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function isoToIcsDate(iso: string): string {
  // iso: yyyy-mm-dd
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  return `${y}${pad2(m)}${pad2(d)}`;
}

function esc(text: string): string {
  // iCalendar escaping
  return String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// proste "foldowanie" linii dla kompatybilności (wystarcza w praktyce)
function foldLine(line: string): string {
  const max = 70;
  if (line.length <= max) return line;
  let out = "";
  for (let i = 0; i < line.length; i += max) {
    out += (i === 0 ? "" : "\r\n ") + line.slice(i, i + max);
  }
  return out;
}

export type IcsEvent = {
  uid: string;
  dateISO: string; // yyyy-mm-dd
  summary: string;
  description?: string;
};

export function buildICS(events: IcsEvent[]): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//SubManager//PL//EN");
  lines.push("CALSCALE:GREGORIAN");

  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${esc(e.uid)}`));
    lines.push(`DTSTART;VALUE=DATE:${isoToIcsDate(e.dateISO)}`);
    lines.push(foldLine(`SUMMARY:${esc(e.summary)}`));
    if (e.description) lines.push(foldLine(`DESCRIPTION:${esc(e.description)}`));
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
