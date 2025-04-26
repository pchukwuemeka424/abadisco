import { SearchBar } from '@/components/SearchBar';
import { Navbar } from '@/components/Navbar';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/ariaria-market.png"
          alt="Ariaria Market Aerial View"
          fill
          priority
          className="object-cover"
          quality={100}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/60 to-black/60 z-10" />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          
          <h1 className="text-3xl md:text-6xl  text-white mb-2" style={{ fontFamily: 'var(--font-pacifico), cursive', letterSpacing: '0.04em', fontStyle: 'normal', textShadow: '2px 4px 16px rgba(0,0,0,0.28)' }}>
            Discover City of Aba
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-4">
            Experience the vibrant heart of commerce, craftsmanship, and culture
          </p>
          
          <div className="w-full max-w-2xl mx-auto">
            <SearchBar />
          </div>
        
        </div>
      </div>
    </main>
  );
}
