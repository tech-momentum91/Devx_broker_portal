import { State, City } from 'country-state-city';

/** Indian cities for CityCombobox (deduplicated by name). */
export const INDIA_CITY_OPTIONS = (() => {
  const seen = new Set();
  const list = [];
  const states = State.getStatesOfCountry('IN');
  states.forEach((s) => {
    City.getCitiesOfState('IN', s.isoCode).forEach((c) => {
      if (seen.has(c.name)) return;
      seen.add(c.name);
      list.push({ value: c.name, label: c.name });
    });
  });
  return list.sort((a, b) => a.label.localeCompare(b.label));
})();
