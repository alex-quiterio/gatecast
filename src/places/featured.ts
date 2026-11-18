/** A curated place merged in at build time when GeoNames lacks it. */
export interface FeaturedPlace {
  name: string;
  admin?: string;
  countryCode: string;
  timeZone: string;
  population: number;
  alternates?: string[];
}

/** Safety net: places that must always be findable. Normally all already in GeoNames. */
export const FEATURED: readonly FeaturedPlace[] = [
  {
    name: 'Amsterdam',
    admin: 'North Holland',
    countryCode: 'NL',
    timeZone: 'Europe/Amsterdam',
    population: 872000,
  },
  {
    name: 'Venice',
    admin: 'Veneto',
    countryCode: 'IT',
    timeZone: 'Europe/Rome',
    population: 260000,
    alternates: ['Venezia'],
  },
  {
    name: 'Forlì',
    admin: 'Emilia-Romagna',
    countryCode: 'IT',
    timeZone: 'Europe/Rome',
    population: 117000,
  },
];

/**
 * Well-known local names (endonyms and exonyms) for big cities, keyed by
 * `GeoNames name|country code`. Merged ahead of the noisy GeoNames alternates.
 */
export const FEATURED_ALTERNATES: Readonly<Record<string, readonly string[]>> = {
  'Venice|IT': ['Venezia'],
  'Florence|IT': ['Firenze'],
  'Rome|IT': ['Roma'],
  'Milan|IT': ['Milano'],
  'Naples|IT': ['Napoli'],
  'Turin|IT': ['Torino'],
  'Genoa|IT': ['Genova'],
  'Padua|IT': ['Padova'],
  'Mantua|IT': ['Mantova'],
  'Syracuse|IT': ['Siracusa'],
  'Cologne|DE': ['Köln'],
  'Munich|DE': ['München'],
  'Nuremberg|DE': ['Nürnberg'],
  'Vienna|AT': ['Wien'],
  'Prague|CZ': ['Praha'],
  'Warsaw|PL': ['Warszawa'],
  'Cracow|PL': ['Kraków'],
  'Lisbon|PT': ['Lisboa'],
  'Moscow|RU': ['Moskva'],
  'Copenhagen|DK': ['København'],
  'Gothenburg|SE': ['Göteborg'],
  'Athens|GR': ['Athína', 'Athina'],
  'Brussels|BE': ['Bruxelles', 'Brussel'],
  'Seville|ES': ['Sevilla'],
  'Saint Petersburg|RU': ['Sankt-Peterburg'],
  'The Hague|NL': ['Den Haag', "'s-Gravenhage"],
  'Geneva|CH': ['Genève', 'Genf', 'Ginevra'],
  'Basel|CH': ['Basle', 'Bâle'],
  'Beijing|CN': ['Peking'],
  'Mumbai|IN': ['Bombay'],
  'Kolkata|IN': ['Calcutta'],
  'Chennai|IN': ['Madras'],
  'Bengaluru|IN': ['Bangalore'],
  'Ho Chi Minh City|VN': ['Saigon'],
  'Yangon|MM': ['Rangoon'],
  'Istanbul|TR': ['Constantinople'],
  'Kyiv|UA': ['Kiev'],
};
