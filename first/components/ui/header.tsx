'use client';

import Image from 'next/image';

export function Header() {

  return (
      <div className='mt-5 flex self-left w-full'>
        <Image alt="Logo" src="/logo.png" width={100} height={150} />
        <h1 className="text-3xl font-bold mt-10">NBA Card Grader</h1>
      </div>
  );
}