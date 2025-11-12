'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { useState } from 'react';
import { ArrowUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { arrayToFileList, fileListToArray } from '@/lib/functions';
import { cardGradeSchema } from './api/use-object/schema';
import { CardDetails } from '@/components/ui/card-details';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { Header } from '@/components/ui/header';
import { CopyButton } from '@/components/ui/copy-button';

export default function Chat() {
  const { object, isLoading, error, submit } = useObject({
    api: '/api/use-object',
    schema: cardGradeSchema,
  });
  const [files, setFiles] = useState<FileList | undefined>();
  const [sentFiles, setSentFiles] = useState<string[]>([]);

  const handleDrop = (uploadedFiles: File[] | null) => {
    if (!uploadedFiles) return;
    const existingFiles = files ? fileListToArray(files) : [];
    const newFiles = uploadedFiles;
    const allFiles = [...existingFiles, ...newFiles];
    setFiles(arrayToFileList(allFiles));
  };

  const handleRemoveFile = (index: number) => {
    if (!files) return;
    const filesArray = fileListToArray(files);
    filesArray.splice(index, 1);
    setFiles(filesArray.length > 0 ? arrayToFileList(filesArray) : undefined);
  };

  const handleSubmit = async () => {
    if (files && files.length > 0) {
      const base64Images = await Promise.all(
        Array.from(files).map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          return {
            name: file.name,
            type: file.type,
            data: `data:${file.type};base64,${buffer.toString("base64")}`,
          };
        })
      );
      setSentFiles(base64Images.map(img => img.data));

      await submit({ images: base64Images });
      setFiles(undefined);
    }
  };


  return (
    <div className="flex min-h-screen flex-col w-3xl mx-auto justify-between items-center gap-20 border border-slate-800 rounded-xl" >
      
      <Header />
      
      <div className='max-w-[90%] text-center'>
        
        <div className="mt-4">
          {!isLoading && !error && !object && <p className="text-slate-400">Upload images of NBA cards to receive professional grades.</p>}

          {isLoading && !object &&
            <div className="flex w-full max-w-xs flex-col gap-4 [--radius:1rem]">
              <Item variant="muted">
                <ItemMedia>
                  <Spinner />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="line-clamp-1">Uploading images...</ItemTitle>
                </ItemContent>
              </Item>
            </div>}
          
          {error && <p className="text-red-500">Error: {error.message}</p>}
          
          {object && object.map((obj, index) => {
            if (obj) {
              return (
                <CardDetails
                  key={index}
                  card={obj as Extract<typeof obj, { type: "grade" }>}
                  img={sentFiles[index] ?? ""}
                />
              );
            }
            return null;
          })}
        </div>
      </div>

      <div className='bottom-0'>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
          className='flex w-full gap-2 items-end'
        >
          <Dropzone
            accept={{
              'image/*': [],
              'application/pdf': []
            }}
            className='w-[500px] ml-11 mb-4'
            maxFiles={5}
            onDrop={handleDrop}
            onError={console.error}
            onRemoveFile={handleRemoveFile}
            src={files ? fileListToArray(files) : []}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>

          <div className='flex flex-col gap-2 mb-4'>
            <Button variant="outline" size="icon" aria-label="Submit" disabled={isLoading || !files || files.length === 0}>
              <ArrowUpIcon />
            </Button>
            <CopyButton string={JSON.stringify(object, null, 2)} description='Copy received JSON' disabled={!object || object.length === 0} />
          </div>

        </form>
      </div>
    </div>
  );
}