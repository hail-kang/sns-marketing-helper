export interface ShortcodeMedia {
  shortcode: string
  comments: number | null
  likes: number | null
  views: number | null
  mediaUrls: string[]
}

export interface MonitoredMedia {
  shortcode: string
  createdAt: number
  lastCrawledAt: number | null
}

export interface MediaLog {
  comments: number | null
  likes: number | null
  views: number | null
  crawledAt: number
}

export interface MediaLogs {
  shortcode: string
  logs: { [date: string]: MediaLog }
}
