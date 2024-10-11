import JSZip from "jszip"
import { v4 as uuidv4 } from "uuid"
import { DownloadOptions, UrlToZipOptions } from "../types/downloadTypes"

const createBlob = async (urls: string[]): Promise<Blob> => {
  if (urls.length === 1) {
    const response = await fetch(urls[0])
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.blob()
  } else {
    const zip = new JSZip()
    for (const url of urls) {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const blob = await response.blob()
      const filename = getFilenameFromUrl(url)
      zip.file(filename, blob)
    }
    return await zip.generateAsync({ type: "blob" })
  }
}

const getFilenameFromUrl = (url: string): string => {
  const urlWithoutQuery = url.split("?")[0]
  return urlWithoutQuery.split("/").pop() || uuidv4()
}

const createZipFilename = (suffix: string): string => {
  const currentDateTime = new Date()
    .toISOString()
    .replace(/:/g, "")
    .replace(/\D/g, "")
  return `${currentDateTime}_${suffix}.zip`
}

const downloadFile = (downloadOptions: DownloadOptions): void => {
  if (chrome.downloads) {
    chrome.downloads.download(downloadOptions, () => {
      URL.revokeObjectURL(downloadOptions.url)
    })
  } else {
    const a = document.createElement("a")
    a.href = downloadOptions.url
    a.download = downloadOptions.filename
    a.click()
  }
}

export const downloadUrls = async ({
  urls,
  zipFileSuffix,
}: UrlToZipOptions): Promise<void> => {
  const blob = await createBlob(urls)
  const url = URL.createObjectURL(blob)
  const filename =
    urls.length === 1
      ? getFilenameFromUrl(urls[0])
      : createZipFilename(zipFileSuffix)
  const downloadOptions: DownloadOptions = {
    url: url,
    filename: filename,
    saveAs: true,
  }
  downloadFile(downloadOptions)
}

// 사용 예시:
// const downloadOptions: UrlToZipOptions = {
//   urls: ['https://example.com/file1.txt', 'https://example.com/file2.jpg'],
//   zipFilename: 'downloaded_files.zip'
// };
// downloadUrls(downloadOptions);
