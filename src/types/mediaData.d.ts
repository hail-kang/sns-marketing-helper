export interface MonitoredMedia {
  shortcode: string
  createdAt: Timestamp
  lastCrawledAt: Timestamp
}

interface ShortcodeMedia {
  comments: number
  likes: number
  views: number
  mediaUrls: Array[string] | null
}
