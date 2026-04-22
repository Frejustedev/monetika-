// Monétika — 10 marchés de lancement.

import type { CountryCode, SupportedCurrency } from '@/lib/money/currency';

export type Country = {
  code: CountryCode;
  name: string;
  nameEn: string;
  currency: SupportedCurrency;
  dialCode: string;
  timezone: string;
  defaultLocale: 'fr' | 'en';
  // Institutions financières courantes — pré-remplit le selector à la création de compte.
  institutions: {
    banks: string[];
    momo: string[];
    sgi: string[];
  };
};

export const COUNTRIES: Country[] = [
  {
    code: 'BJ',
    name: 'Bénin',
    nameEn: 'Benin',
    currency: 'XOF',
    dialCode: '+229',
    timezone: 'Africa/Porto-Novo',
    defaultLocale: 'fr',
    institutions: {
      banks: ['Bank of Africa', 'Ecobank', 'BGFIBank', 'NSIA Banque', 'UBA', 'Société Générale'],
      momo: ['MTN MoMo', 'Moov Money', 'Celtiis Cash'],
      sgi: ['SGI Bénin', 'BOA Capital Securities'],
    },
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    nameEn: 'Burkina Faso',
    currency: 'XOF',
    dialCode: '+226',
    timezone: 'Africa/Ouagadougou',
    defaultLocale: 'fr',
    institutions: {
      banks: ['Bank of Africa', 'Ecobank', 'Coris Bank', 'Orabank', 'UBA'],
      momo: ['Orange Money', 'Moov Money', 'Telecel Money'],
      sgi: ['CORIS Bourse', 'SGI Burkina'],
    },
  },
  {
    code: 'CI',
    name: "Côte d\u2019Ivoire",
    nameEn: "Côte d'Ivoire",
    currency: 'XOF',
    dialCode: '+225',
    timezone: 'Africa/Abidjan',
    defaultLocale: 'fr',
    institutions: {
      banks: ['SGCI', 'Ecobank', 'BOA', 'NSIA Banque', 'BNI', 'UBA', 'BICICI'],
      momo: ['Orange Money', 'MTN MoMo', 'Moov Money', 'Wave'],
      sgi: ['SGI Atlantique', 'Bridge Securities', 'NSIA Finance'],
    },
  },
  {
    code: 'GW',
    name: 'Guinée-Bissau',
    nameEn: 'Guinea-Bissau',
    currency: 'XOF',
    dialCode: '+245',
    timezone: 'Africa/Bissau',
    defaultLocale: 'fr',
    institutions: {
      banks: ['BAO', 'Ecobank', 'Orabank'],
      momo: ['Orange Money', 'MTN MoMo'],
      sgi: [],
    },
  },
  {
    code: 'ML',
    name: 'Mali',
    nameEn: 'Mali',
    currency: 'XOF',
    dialCode: '+223',
    timezone: 'Africa/Bamako',
    defaultLocale: 'fr',
    institutions: {
      banks: ['BDM', 'Ecobank', 'BOA', 'BIM', 'Orabank'],
      momo: ['Orange Money', 'Moov Money'],
      sgi: ['SGI Mali'],
    },
  },
  {
    code: 'NE',
    name: 'Niger',
    nameEn: 'Niger',
    currency: 'XOF',
    dialCode: '+227',
    timezone: 'Africa/Niamey',
    defaultLocale: 'fr',
    institutions: {
      banks: ['BIA Niger', 'Ecobank', 'BOA', 'Orabank'],
      momo: ['Airtel Money', 'Moov Money', 'NITA'],
      sgi: [],
    },
  },
  {
    code: 'SN',
    name: 'Sénégal',
    nameEn: 'Senegal',
    currency: 'XOF',
    dialCode: '+221',
    timezone: 'Africa/Dakar',
    defaultLocale: 'fr',
    institutions: {
      banks: ['CBAO', 'SGBS', 'Ecobank', 'BOA', 'UBA', 'BICIS'],
      momo: ['Orange Money', 'Free Money', 'Wave', 'Wizall'],
      sgi: ['CGF Bourse', 'Impaxis Securities'],
    },
  },
  {
    code: 'TG',
    name: 'Togo',
    nameEn: 'Togo',
    currency: 'XOF',
    dialCode: '+228',
    timezone: 'Africa/Lome',
    defaultLocale: 'fr',
    institutions: {
      banks: ['Ecobank', 'BTCI', 'BOA', 'Orabank', 'UBA'],
      momo: ['T-Money', 'Flooz'],
      sgi: ['SGI Togo'],
    },
  },
  {
    code: 'NG',
    name: 'Nigeria',
    nameEn: 'Nigeria',
    currency: 'NGN',
    dialCode: '+234',
    timezone: 'Africa/Lagos',
    defaultLocale: 'en',
    institutions: {
      banks: ['GTBank', 'Access Bank', 'Zenith Bank', 'UBA', 'First Bank', 'Stanbic IBTC', 'Fidelity'],
      momo: ['Opay', 'PalmPay', 'Kuda', 'Moniepoint'],
      sgi: ['Chapel Hill Denham', 'Stanbic IBTC Stockbrokers', 'CSL Stockbrokers'],
    },
  },
  {
    code: 'GH',
    name: 'Ghana',
    nameEn: 'Ghana',
    currency: 'GHS',
    dialCode: '+233',
    timezone: 'Africa/Accra',
    defaultLocale: 'en',
    institutions: {
      banks: ['GCB Bank', 'Ecobank', 'Stanbic', 'Absa', 'Fidelity', 'Zenith'],
      momo: ['MTN MoMo', 'Telecel Cash', 'AirtelTigo Money'],
      sgi: ['Databank', 'IC Securities', 'CAL Brokers'],
    },
  },
];

export function getCountry(code: CountryCode): Country {
  const c = COUNTRIES.find((x) => x.code === code);
  if (!c) throw new Error(`Pays inconnu : ${code}`);
  return c;
}

export function isCountryCode(value: string): value is CountryCode {
  return COUNTRIES.some((c) => c.code === value);
}
