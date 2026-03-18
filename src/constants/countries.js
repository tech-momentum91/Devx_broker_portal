import apiClient from '@/api/axios';

// Default country code
export const DEFAULT_COUNTRY_CODE = '+91';

// Cache for country data
let countriesCache = null;
let countriesPromise = null;

/**
 * Fetches country information from Frappe API
 * @returns {Promise<Array>} Array of country objects with { value, label, flag, code }
 */
export const fetchCountries = async () => {
  // Return cached data if available
  if (countriesCache) {
    return countriesCache;
  }

  // Return existing promise if fetch is in progress
  if (countriesPromise) {
    return countriesPromise;
  }

  // Fetch from API
  countriesPromise = apiClient
    .post('/method/frappe.geo.country_info.get_country_timezone_info')
    .then((response) => {
      const countryInfo = response.data?.message?.country_info || response.data?.country_info || {};

      // Transform Frappe country data to our format
      // Frappe structure: { "India": { code: "in", isd: "+91", ... }, "United States": { code: "us", isd: "+1", ... } }
      const countriesList = [];
      let keyIndex = 0;

      Object.entries(countryInfo).forEach(([countryName, info]) => {
        // Skip countries without ISD (International Subscriber Dialing) code
        if (!info.isd) return;

        // info.code is lowercase country code (e.g., "in", "us") - used for flag URL
        // info.isd is the phone code (e.g., "+91", "+1")
        const countryCode = (info.code || '').toLowerCase(); // lowercase code for flag
        const phoneCode = info.isd || ''; // phone code like "+91"

        // Create unique key with index to ensure absolute uniqueness
        const uniqueKey = `${phoneCode}-${countryCode || countryName.toLowerCase().replaceAll(/\s+/g, '-')}-${keyIndex++}`;

        const countryData = {
          value: phoneCode, // Phone code like "+91", "+1"
          label: countryName, // Full country name like "India", "United States"
          flagCode: countryCode, // Lowercase code for flag URL (e.g., "in", "us")
          flag: countryCode ? `https://flagcdn.com/${countryCode}.svg` : null, // Flag image URL
          code: countryCode, // Country code
          name: countryName, // Country name
          uniqueKey, // Unique key for React (includes index for absolute uniqueness)
        };

        countriesList.push(countryData);
      });

      // Keep ALL countries - no deduplication
      // Sort alphabetically by country name, with India first
      const countries = countriesList.sort((a, b) => {
        // India (+91) always first
        if (a.value === '+91' && a.name === 'India') return -1;
        if (b.value === '+91' && b.name === 'India') return 1;

        // Sort alphabetically by country name
        return a.name.localeCompare(b.name);
      });

      countriesCache = countries;
      return countries;
    })
    .catch((error) => {
      console.error('Failed to fetch countries:', error);
      // Return empty array on error
      return [];
    })
    .finally(() => {
      countriesPromise = null;
    });

  return countriesPromise;
};

/**
 * Helper function to parse contact number and extract country code
 * @param {string} contactNumber - Phone number in format "countryCode-number" or just number
 * @param {Array} countries - Array of country objects (optional, will fetch if not provided)
 */
export const parseContactNumber = async (contactNumber, countries = null) => {
  if (!contactNumber) return { countryCode: DEFAULT_COUNTRY_CODE, number: '' };

  // Get countries if not provided
  if (!countries) {
    countries = await fetchCountries();
  }

  // Remove all non-numeric characters except + and -
  const cleanedNumber = contactNumber.replaceAll(/[^\d+-]/g, '');

  // Try to find a matching country code at the start
  // Sort by length (longest first) to match longer codes first (e.g., +971 before +9)
  const sortedCountries = [...countries].sort((a, b) => b.value.length - a.value.length);
  const matchedCountry = sortedCountries.find((country) => cleanedNumber.startsWith(country.value));

  if (matchedCountry) {
    const number = cleanedNumber.replace(matchedCountry.value, '').replace(/^[\s-]+/, '');
    return {
      countryCode: matchedCountry.value,
      number,
    };
  }

  // Default to India if no match found
  return { countryCode: DEFAULT_COUNTRY_CODE, number: cleanedNumber };
};

/**
 * Helper function to format phone number with country code
 */
export const formatPhoneNumber = (countryCode, number) => {
  if (!number) return '';
  return `${countryCode}-${number}`;
};

/**
 * Clear the countries cache (useful for testing or refreshing data)
 */
export const clearCountriesCache = () => {
  countriesCache = null;
  countriesPromise = null;
};
