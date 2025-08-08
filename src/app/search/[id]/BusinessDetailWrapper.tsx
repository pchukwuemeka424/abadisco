import { generateMetadata } from '@/config/seo';
import { Metadata } from 'next';
import { supabase } from '../../../supabaseClient';
import BusinessDetailContent from './BusinessDetailContent';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Fetch business data for dynamic metadata
  const { data: business } = await supabase
    .from('businesses')
    .select(`
      *,
      business_categories(title),
      markets(name, location)
    `)
    .eq('id', params.id)
    .single();

  if (!business) {
    return generateMetadata({
      title: 'Business Not Found - Aba Directory',
      description: 'The requested business could not be found in our directory.',
      url: `/search/${params.id}`,
    });
  }

  const businessTitle = business.name || 'Business';
  const categoryName = business.business_categories?.title || 'Business';
  const marketInfo = business.markets ? `${business.markets.name}, ${business.markets.location}` : 'Aba, Nigeria';
  
  return generateMetadata({
    title: `${businessTitle} - ${categoryName} in Aba`,
    description: business.description 
      ? `${business.description.substring(0, 150)}... Located in ${marketInfo}. Contact: ${business.contact_phone || 'Visit for details'}.`
      : `${businessTitle} is a ${categoryName.toLowerCase()} business located in ${marketInfo}. Founded by Prince Chukwuemeka and Princess Ibekwe Johnson platform.`,
    keywords: [
      businessTitle,
      categoryName,
      'Aba business',
      'Nigeria business',
      marketInfo,
      business.contact_phone ? 'contact business' : '',
      business.website ? 'business website' : '',
      'Eastern Nigeria',
      'Aba directory',
      'local business'
    ].filter(Boolean),
    image: business.logo_url || undefined,
    url: `/search/${params.id}`,
  });
}

export default function BusinessDetailPage({ params }: Props) {
  return <BusinessDetailContent params={params} />;
}
