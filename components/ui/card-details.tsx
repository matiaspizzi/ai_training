
import { ImageError, NbaCardGrade } from '@/app/api/use-object/schema';
import Image from 'next/image';
import { CopyButton } from '@/components/ui/copy-button';

interface CardDetailsProps {
  card: NbaCardGrade | ImageError;
  img: string;
}

export function CardDetails({ card, img }: CardDetailsProps) {
  if (!card) {
    return null;
  }

  return (
    <div className="mb-4 flex h-[260px]">
      <Image className="object-cover min-w-[170px]" width={170} height={260} src={img} alt="Card Image" />
      <div className="border border-slate-800 rounded-r-lg p-4 text-left w-full">
        <CopyButton string={JSON.stringify(card, null, 2)} description='Copy JSON'/>
        
        {card.type === 'grade' && (
          <>
            <p className="text-slate-300">Grade: {card.estimatedGrade}</p>
            <h2 className="text-xl font-semibold">{card.cardName}</h2>
            <p className="text-slate-400">{card.year} - {card.brand}</p>
            <p className="text-slate-400">Player: {card.player}</p>
            <p className="mt-2">{card.notes}</p>
          </>
        )}
        {card.type === 'error' && (
          <div className='flex flex-col align-center justify-center'>
            <h2 className="text-xl font-semibold text-red-500">Error Grading Image</h2>
            <p className="text-slate-400">Reason: {card.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}