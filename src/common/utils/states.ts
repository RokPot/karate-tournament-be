export const US_STATES = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  district_of_columbia: 'DC',
  florida: 'FL',
  georgia: 'GA',
  guam: 'GU',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  new_hampshire: 'NH',
  new_jersey: 'NJ',
  new_mexico: 'NM',
  new_york: 'NY',
  north_carolina: 'NC',
  north_dakota: 'ND',
  northern_mariana_islands: 'MP',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  puerto_rico: 'PR',
  rhode_island: 'RI',
  south_carolina: 'SC',
  south_dakota: 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  virginia_islands: 'VI',
  washington: 'WA',
  west_virginia: 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
};

export function getStateCodeUtil(state: string | null): string | null {
  if (!state) {
    return null;
  }

  if (state.length === 2) {
    return state;
  }

  return US_STATES[state.toLowerCase() as keyof typeof US_STATES] || null;
}
