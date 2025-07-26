import { Metadata } from 'next';

// Base SEO configuration
export const baseSEO = {
  siteName: 'Aba Directory - Aba Traders',
  siteUrl: 'https://aba-directory.vercel.app',
  defaultTitle: 'Aba Directory - Discover Aba Markets & Businesses',
  defaultDescription: 'Discover Aba, Eastern Nigeria\'s commercial hub. Founded by Prince Chukwuemeka and Princess Ibekwe Johnson. Explore markets, businesses, and services in Aba.',
  defaultKeywords: [
    'Aba',
    'Aba Markets',
    'Aba Businesses',
    'Aba Traders',
    'Nigeria Business Directory',
    'Eastern Nigeria Commerce',
    'Ariaria Market',
    'Aba Commercial Hub',
    'Prince Chukwuemeka',
    'Princess Ibekwe Johnson',
    'Aba Directory',
    'Nigerian Markets',
    'Abia State Business',
    'Made in Aba',
    'Aba Manufacturers'
  ],
  founders: 'Prince Chukwuemeka (Founder), Princess Ibekwe Johnson (Co-Founder)',
  twitterHandle: '@abadirectory',
  defaultImage: '/images/aba-directory-og.png',
};

// Generate comprehensive metadata
export function generateMetadata({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website' as const,
  author,
  publishedTime,
  modifiedTime,
}: {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'book' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
} = {}): Metadata {
  const fullTitle = title 
    ? `${title} | ${baseSEO.siteName}` 
    : baseSEO.defaultTitle;
  
  const fullDescription = description || baseSEO.defaultDescription;
  const fullImage = image || baseSEO.defaultImage;
  const fullUrl = url ? `${baseSEO.siteUrl}${url}` : baseSEO.siteUrl;
  const allKeywords = [...baseSEO.defaultKeywords, ...keywords];

  return {
    metadataBase: new URL(baseSEO.siteUrl),
    title: fullTitle,
    description: fullDescription,
    keywords: allKeywords.join(', '),
    authors: [
      { name: 'Prince Chukwuemeka', url: baseSEO.siteUrl },
      { name: 'Princess Ibekwe Johnson', url: baseSEO.siteUrl }
    ],
    creator: baseSEO.founders,
    publisher: baseSEO.siteName,
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type,
      siteName: baseSEO.siteName,
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        }
      ],
      locale: 'en_NG',
      countryName: 'Nigeria',
    },
    twitter: {
      card: 'summary_large_image',
      site: baseSEO.twitterHandle,
      creator: baseSEO.twitterHandle,
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
    },
    alternates: {
      canonical: fullUrl,
    },
    other: {
      'founder': 'Prince Chukwuemeka',
      'co-founder': 'Princess Ibekwe Johnson',
      'location': 'Aba, Abia State, Nigeria',
      'industry': 'Business Directory, E-commerce, Local Commerce',
      'target-audience': 'Businesses in Aba, Traders, Shoppers, Tourists',
      'geo.region': 'NG-AB',
      'geo.placename': 'Aba',
      'geo.position': '5.1066;7.3509',
      'ICBM': '5.1066, 7.3509',
    },
    ...(publishedTime && { 
      other: { 
        ...((publishedTime || modifiedTime) && {
          'article:published_time': publishedTime,
          'article:modified_time': modifiedTime || publishedTime,
          'article:author': author || baseSEO.founders,
        })
      }
    }),
  };
}

// Schema.org structured data
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: baseSEO.siteName,
  url: baseSEO.siteUrl,
  logo: `${baseSEO.siteUrl}/images/logo.png`,
  description: baseSEO.defaultDescription,
  founder: [
    {
      '@type': 'Person',
      name: 'Prince Chukwuemeka',
      jobTitle: 'Founder',
    },
    {
      '@type': 'Person',
      name: 'Princess Ibekwe Johnson',
      jobTitle: 'Co-Founder',
    }
  ],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Aba',
    addressRegion: 'Abia State',
    addressCountry: 'Nigeria',
  },
  areaServed: [
    {
      '@type': 'City',
      name: 'Aba',
    },
    {
      '@type': 'State',
      name: 'Abia State',
    },
    {
      '@type': 'Country',
      name: 'Nigeria',
    }
  ],
  knowsAbout: [
    'Aba Markets',
    'Nigerian Commerce',
    'Business Directory',
    'Ariaria Market',
    'Local Businesses',
  ],
  sameAs: [
    // Add social media links when available
  ]
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: baseSEO.siteName,
  url: baseSEO.siteUrl,
  description: baseSEO.defaultDescription,
  inLanguage: 'en-NG',
  isPartOf: {
    '@type': 'WebSite',
    name: baseSEO.siteName,
  },
  about: {
    '@type': 'Thing',
    name: 'Aba Business Directory',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${baseSEO.siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

// Market-specific schema
export const localBusinessSchema = (business: any) => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: business.name,
  description: business.description,
  url: `${baseSEO.siteUrl}/search/${business.id}`,
  ...(business.logo_url && { logo: business.logo_url }),
  ...(business.address && {
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: 'Aba',
      addressRegion: 'Abia State',
      addressCountry: 'Nigeria',
    }
  }),
  ...(business.contact_phone && { telephone: business.contact_phone }),
  ...(business.contact_email && { email: business.contact_email }),
  ...(business.website && { url: business.website }),
  isPartOf: {
    '@type': 'Organization',
    name: baseSEO.siteName,
  },
});
