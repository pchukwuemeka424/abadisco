import Link from 'next/link';
import Image from 'next/image';

const markets = [
  {
    name: 'Ariaria Market',
    image: '/images/ariaria-market.png',
  },
  {
    name: 'Ahia Ohuru (New Market)',
    image: '/images/Ahia Ohuru (New Market).webp',
  },
  {
    name: 'Cemetery Market',
    image: '/images/Cemetery Market.jpeg',
  },
  {
    name: 'Eziukwu Market',
    image: '/images/Eziukwu Market.jpg',
  },


  {
    name: 'Uratta Market',
    image: '/images/Uratta Market.jpeg',
  },
  {
    name: 'Railway Market',
    image: '/images/RAILWAY .jpeg',
  },
];

export default function MarketsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner with full-width image and overlay */}
      <div className="relative w-full h-96 mb-10"> {/* Increased height from h-64 to h-96 */}
        <Image
          src="/images/ariaria-market.png"
          alt="Markets Banner"
          fill
          className="object-cover w-full h-full"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-blue-900/50 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-6">
            Discover Aba’s Markets
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto font-medium mb-2">
            Step into the vibrant heart of Aba, where tradition meets innovation in bustling marketplaces.
          </p>
       
        </div>
      </div>

      {/* Grid of Markets */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4">
        {markets.map((market, idx) => (
          <Link href={`#`} key={idx} className="group">
            <div
              className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col items-center transition-transform hover:scale-105 hover:shadow-lg duration-200"
            >
              <div className="w-full h-56 relative">
                <Image
                  src={market.image}
                  alt={market.name}
                  fill
                  className="object-cover w-full h-full"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={idx === 0}
                />
              </div>
              <div className="w-full p-4 flex flex-col items-center">
                <span className="mt-2 text-lg font-semibold text-center text-gray-800 group-hover:text-blue-600">
                  {market.name}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
