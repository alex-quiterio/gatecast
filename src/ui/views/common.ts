import type { Activation, CenterName, ChannelInfo, ChartType } from '@/types';

/** `SolarPlexus` becomes `Solar Plexus`. */
export function centerLabel(center: CenterName): string {
  return center === 'SolarPlexus' ? 'Solar Plexus' : center;
}

/** `[20, 34]` becomes `20-34`. */
export function channelId(channel: Pick<ChannelInfo, 'gates'>): string {
  return `${channel.gates[0]}-${channel.gates[1]}`;
}

/** `gate.line.color.tone`, e.g. `20.3.2.5`. */
export function activationLabel(a: Activation): string {
  return `${a.gate}.${a.line}.${a.color}.${a.tone}`;
}

/** Signature colour class for a type badge. */
export function typeClass(type: ChartType): string {
  return `type-${type.toLowerCase().replace(/\s+/g, '-')}`;
}

/** Trigger a file download from text content. */
export function downloadText(filename: string, text: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Copy text; falls back to a hidden textarea. Resolves to success. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.setAttribute('aria-hidden', 'true');
    area.className = 'sr-only';
    area.value = text;
    document.body.appendChild(area);
    area.select();
    let ok: boolean;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

/** Format a birth input for display. */
export function describeBirth(input: {
  place?: string | undefined;
  date: string;
  time: string;
  utcOffset: number;
  timeZone?: string | undefined;
}): string {
  const sign = input.utcOffset < 0 ? '-' : '+';
  const abs = Math.abs(input.utcOffset);
  const hours = Math.floor(abs);
  const minutes = Math.round((abs - hours) * 60);
  const offset = `UTC${sign}${hours}${minutes ? ':' + String(minutes).padStart(2, '0') : ''}`;
  const moment = `${input.date} ${input.time} (${input.timeZone ? input.timeZone + ', ' : ''}${offset})`;
  return input.place ? `${input.place} · ${moment}` : moment;
}
