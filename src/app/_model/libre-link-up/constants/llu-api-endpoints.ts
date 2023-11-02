interface LluApiEndpoints {
  [key: string]: string;
}

export const LLU_API_ENDPOINTS: LluApiEndpoints = {
  AE: 'https://api-ae.libreview.io',
  AP: 'https://api-ap.libreview.io',
  AU: 'https://api-au.libreview.io',
  CA: 'https://api-ca.libreview.io',
  DE: 'https://api-de.libreview.io',
  EU: 'https://api-eu.libreview.io',
  EU2: 'https://api-eu2.libreview.io',
  FR: 'https://api-fr.libreview.io',
  JP: 'https://api-jp.libreview.io',
  US: 'https://api-us.libreview.io'
} as const;
