import type { SharePrefs } from './types';

/** What a card reveals, for the privacy note next to the toggles. */
export interface PrivacyNote {
  level: 'private' | 'birth' | 'link';
  message: string;
}

/**
 * Describe what the image gives away. A QR code (and the copied link) always
 * carries the birth date, time and place, whatever the image shows.
 */
export function cardPrivacy(prefs: SharePrefs): PrivacyNote {
  if (prefs.showQr) {
    return {
      level: 'link',
      message:
        'The QR code opens this chart in Gatecast. The link it carries contains the birth date, time and place, so anyone with the image can read them. Share it only with people who may know them.',
    };
  }
  if (prefs.showBirth) {
    return {
      level: 'birth',
      message: 'The birth date, time and place are printed on the image.',
    };
  }
  return {
    level: 'private',
    message: 'The image shows no birth details and carries no link.',
  };
}

/** Same, for the report. */
export function reportPrivacy(prefs: SharePrefs): PrivacyNote {
  if (prefs.showQr) {
    return {
      level: 'link',
      message:
        'The QR code on the last page opens this chart and carries the birth date, time and place.',
    };
  }
  if (prefs.showBirth) {
    return { level: 'birth', message: 'The birth date, time and place are printed in the report.' };
  }
  return { level: 'private', message: 'The report shows no birth details and carries no link.' };
}
