export function arrayToFileList(filesArray: File[]): FileList {
  const dataTransfer = new DataTransfer();
  filesArray.forEach((file) => {
    dataTransfer.items.add(file);
  });
  return dataTransfer.files;
}

export function fileListToArray(fileList: FileList): File[] {
  return Array.from(fileList);
}

export function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    return false;
  }
}