import hotelCrestImage from '@/assets/hotel-crest.jpg';

interface HotelCrestProps {
  className?: string;
}

export function HotelCrest({ className = "w-8 h-10" }: HotelCrestProps) {
  return (
    <div className={className}>
      <img 
        src="/decoeur-crest.svg"
        alt="Decoeur Hotels' crest"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
