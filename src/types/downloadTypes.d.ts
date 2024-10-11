export interface DownloadOptions {
  url: string
  filename: string
  saveAs?: boolean
}

export interface UrlToZipOptions {
  urls: string[]
  zipFileSuffix: string
}
