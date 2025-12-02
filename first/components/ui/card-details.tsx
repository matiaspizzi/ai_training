
import { ImageError, NbaCardGrade } from '@/app/api/use-object/schema';
import Image from 'next/image';
import { CopyButton } from '@/components/ui/copy-button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from "motion/react";

interface CardDetailsProps {
  card: NbaCardGrade | ImageError;
  img: string;
}

export function CardDetails({ card, img }: CardDetailsProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!card) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        "relative w-full border border-slate-800 rounded-lg overflow-hidden bg-background z-10",
        isHovered ? "shadow-xl" : ""
      )}
      initial={false}
      animate={{ height: isHovered ? "auto" : 60 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center p-4 gap-4 h-[60px]">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
          <Image
            src={img}
            alt="Card Thumbnail"
            fill
            className="object-cover"
          />
        </div>
        <h2 className="text-lg font-semibold truncate flex-1">
          {card.type === 'grade' ? card.cardName : 'Error Grading Image'}
        </h2>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-4"
          >
            <div className="flex gap-4">
              <div className="relative w-[150px] h-[220px] shrink-0 rounded-md overflow-hidden">
                <Image
                  src={img}
                  alt="Card Image"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 space-y-2">
                <CopyButton string={JSON.stringify(card, null, 2)} description='Copy JSON' />

                {card.type === 'grade' && (
                  <div className='flex flex-col gap-1 text-sm text-muted-foreground'>
                    <p><span className="font-medium text-foreground">Year:</span> {card.year}</p>
                    <p><span className="font-medium text-foreground">Brand:</span> {card.brand}</p>
                    <p><span className="font-medium text-foreground">Number:</span> {card.number}</p>
                    <p><span className="font-medium text-foreground">Condition:</span> {card.condition} - {card.grade}</p>
                    <p><span className="font-medium text-foreground">Player:</span> {card.player}</p>
                    <p><span className="font-medium text-foreground">Serial:</span> {card.serialNumber}</p>
                  </div>
                )}
                {card.type === 'error' && (
                  <div className='flex flex-col'>
                    <p className="text-red-500 font-medium">Reason:</p>
                    <p className="text-slate-400">{card.reason}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}