'use client';

import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { UploadCardModal } from '@/components/ui/upload-card-modal';

export function Header() {

  return (
      <div className='p-5 flex w-full items-center justify-between'>
        <div className='flex h-full items-center'>
          <Image alt="Logo" src="/logo.webp" width={150} height={200} />
          <h1 className="text-3xl font-bold">Card Grader</h1>
        </div>
        <UploadCardModal maxFiles={5} onContinueLabel="Save Cards">
          <Button>Upload Cards</Button>
        </UploadCardModal>
      </div>
  );
}