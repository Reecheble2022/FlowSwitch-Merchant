import { parsePhoneNumber, CountryCode, isValidPhoneNumber } from 'libphonenumber-js';

export function formatPhoneNumber(phoneNumber: string, country: CountryCode = 'ZA'): string {
  try {
    const parsed = parsePhoneNumber(phoneNumber, country);
    return parsed ? parsed.formatInternational() : phoneNumber;
  } catch {
    return phoneNumber;
  }
}

export function validatePhoneNumber(phoneNumber: string, country: CountryCode = 'ZA'): boolean {
  try {
    return isValidPhoneNumber(phoneNumber, country);
  } catch {
    return false;
  }
}

export function getPhoneExample(country: CountryCode): string {
  const examples: Record<string, string> = {
    ZA: '+27 82 123 4567',
    UG: '+256 712 345 678',
    US: '+1 (555) 123-4567',
    GB: '+44 7700 900000',
  };
  return examples[country] || '+XX XXX XXX XXXX';
}

export function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    ZA: '🇿🇦',
    UG: '🇺🇬',
    US: '🇺🇸',
    GB: '🇬🇧',
    KE: '🇰🇪',
    NG: '🇳🇬',
  };
  return flags[countryCode] || '🌍';
}

export function normalizePhoneNumber(phoneNumber: string, country: CountryCode = 'ZA'): string {
  try {
    const parsed = parsePhoneNumber(phoneNumber, country);
    return parsed ? parsed.format('E.164') : phoneNumber;
  } catch {
    return phoneNumber;
  }
}
