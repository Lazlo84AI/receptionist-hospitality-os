import hotelCrestImage from '@/assets/hotel-crest.jpg';

interface HotelCrestProps {
  className?: string;
}

export function HotelCrest({ className = "w-8 h-10" }: HotelCrestProps) {
  return (
    <div className={className}>
      <img 
        src="/BLASON_DECOEUR_EPAIS_Gold (1).svg"
        alt="Decceur Hôtels Blason"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
