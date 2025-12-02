import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { arrayToFileList, fileListToArray } from '@/lib/functions';
import { cardGradeSchema } from '../../app/api/use-object/schema';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { useState } from 'react';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { CardDetails } from './card-details';
import { ArrowUpIcon } from "lucide-react"
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { CopyButton } from '@/components/ui/copy-button';
import { CheckIcon } from "lucide-react";
import { AlertCircleIcon } from "lucide-react";
import { z } from 'zod';
import { NbaCardSchemaDTO } from '../../app/api/save-card/schema';

export function UploadCardModal({
  children,
  maxFiles,
  onContinueLabel,
}: {
  children: React.ReactNode;
  maxFiles?: number;
  onContinueLabel: string;
}) {
  const { object, isLoading, error, submit, clear } = useObject({
    api: '/api/use-object',
    schema: cardGradeSchema,
  });

  const [files, setFiles] = useState<FileList | undefined>();
  const [sentFiles, setSentFiles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorUpload, setErrorUpload] = useState("");
  const [errorSave, setErrorSave] = useState<string[]>([]);

  const handleDrop = (uploadedFiles: File[] | null) => {
    if (!uploadedFiles) return;

    const limit = maxFiles ?? 1;

    if (limit === 1) {
      setFiles(arrayToFileList(uploadedFiles.slice(0, 1)));
    } else {
      const existingFiles = files ? fileListToArray(files) : [];
      const newFiles = uploadedFiles;
      const allFiles = [...existingFiles, ...newFiles].slice(0, limit);
      setFiles(arrayToFileList(allFiles));
    }

    clear();
    setSentFiles([]);
    setErrorUpload("");
    setIsSaving(false);
    setIsSaved(false);
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
      setIsSaving(false);
      setErrorUpload("");
      setErrorSave([]);
      setSentFiles(base64Images.map(img => img.data));
      setFiles(undefined);

      await submit({ images: base64Images });
    }
  };

  const handleSubmitSave = async () => {
    setErrorUpload("");
    setIsSaved(false);
    setIsSaving(true);
    if (object && object.length > 0) {
      const dataToSaveArray = object
        .map((obj, index) => {
          if (obj?.type === "grade") {
            const cardData = {
              grade: obj.grade ? obj.grade : 0,
              ...obj,
              base64image: sentFiles[index],
            };
            const parsed = NbaCardSchemaDTO.safeParse(cardData);
            return parsed.success ? parsed.data : null;
          }
          return null;
        })
        .filter((data): data is z.infer<typeof NbaCardSchemaDTO> => data !== null);

      if (dataToSaveArray.length === 0) {
        setErrorUpload("No valid cards to send.");
        return;
      }

      const response = await fetch('/api/save-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { cards: dataToSaveArray } }),
      }).then((response) => { return response.json() });

      if (response.errors) {
        setErrorSave(response.errors);
      }
      setIsSaved(true);
      setIsSaving(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl min-h-[80vh]">
        <DialogTitle>Scan NBA Cards</DialogTitle>

        <div className="px-4 min-h-[20vh] overflow-y-auto scrollbar gap-4 flex flex-col min-w-full items-center justify-center">
          {!isLoading && !error && !object && <p className="text-slate-400">Upload images of NBA cards graded by PSA.</p>}
          {isLoading && !object &&
            <div className="flex w-full max-w-xs flex-col gap-4 [--radius:1rem]">
              <Item variant="muted">
                <ItemMedia>
                  <Spinner />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="line-clamp-1">Sending data...</ItemTitle>
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


        <DialogFooter className="items-center justify-center max-h-fit self-end">
          <div className='flex flex-col gap-2'>
            <div className='bottom-0 w-full'>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className='flex w-full gap-2 p-4 items-end'
              >
                <Dropzone
                  accept={{
                    'image/*': [],
                    'application/pdf': []
                  }}
                  className='w-[500px] ml-11'
                  maxFiles={maxFiles}
                  onDrop={handleDrop}
                  onError={console.error}
                  onRemoveFile={handleRemoveFile}
                  src={files ? fileListToArray(files) : []}
                >
                  <DropzoneEmptyState />
                  <DropzoneContent />
                </Dropzone>

                <div className='flex flex-col gap-2'>
                  <Button variant="outline" size="icon" aria-label="Submit" disabled={isLoading || !files || files.length === 0}>
                    <ArrowUpIcon />
                  </Button>
                  <CopyButton string={JSON.stringify(object, null, 2)} description='Copy received JSON' disabled={!object || object.length === 0} />
                </div>
              </form>
            </div>
            {errorSave?.length > 0 && <p className="text-red-500">Error saving cards: {JSON.stringify(errorSave)}</p>}
            {errorUpload && <p className="text-red-500">Error saving cards. Please try again. {errorUpload}</p>}
            {object && object.length > 0 && (<Button disabled={isLoading || isSaved} className="w-[100px] flex items-center justify-center self-end" onClick={handleSubmitSave}>{isSaving ? <Spinner /> : errorUpload ? <AlertCircleIcon /> : isSaved ? <CheckIcon /> : onContinueLabel}</Button>)}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}