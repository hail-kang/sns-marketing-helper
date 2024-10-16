import moment from "moment"
import { MonitoredMedia, MediaLogs, MediaLog } from "../types/mediaData"

export enum TableName {
  MONITORED_MEDIA = "monitoredMedia",
  MEDIA_LOG = "mediaLog",
}

export class StorageKey {
  static MONITORED_MEDIA(shortcode: string) {
    return `${TableName.MONITORED_MEDIA}:${shortcode}`
  }

  static MEDIA_LOG(shortcode: string) {
    return `${TableName.MEDIA_LOG}:${shortcode}`
  }
}

export async function getMonitoredMedia(shortcode: string) {
  const key = StorageKey.MONITORED_MEDIA(shortcode)
  const results = await chrome.storage.local.get([key])
  const monitoredMedia: MonitoredMedia | null = results[key]
  if (monitoredMedia == null) {
    throw Error("Not exists MonitoredMedia")
  }
  return monitoredMedia
}

export async function filterMonitoredMediaList(
  func: (item: MonitoredMedia) => boolean,
  limit: number,
) {
  const results = await chrome.storage.local.get(null)
  const keyExp = new RegExp(`${TableName.MONITORED_MEDIA}:.*`)
  const items: MonitoredMedia[] = Object.entries(results)
    .filter(([key]) => keyExp.test(key))
    .map(([key, value]) => value)
  return items
    .filter(func)
    .sort((a, b) => {
      if (a.lastCrawledAt == null && b.lastCrawledAt == null) return 0
      if (a.lastCrawledAt == null) return -1
      if (b.lastCrawledAt == null) return 1
      return b.lastCrawledAt - a.lastCrawledAt
    })
    .slice(0, limit)
}

export const existsMonitoredMedia = async (
  shortcode: string,
): Promise<boolean> => {
  const key = StorageKey.MONITORED_MEDIA(shortcode)
  const result = await chrome.storage.local.get([key])
  return key in result
}

export const addMonitoredMedia = async (shortcode: string): Promise<void> => {
  const monitoredMedia: MonitoredMedia = {
    shortcode,
    createdAt: Date.now(),
    lastCrawledAt: null,
  }
  await chrome.storage.local.set({
    [StorageKey.MONITORED_MEDIA(shortcode)]: monitoredMedia,
  })
}

export async function getMediaLogs(shortcode: string): Promise<MediaLogs> {
  const key = StorageKey.MEDIA_LOG(shortcode)
  const results = await chrome.storage.local.get([key])
  const mediaLogs: MediaLogs | null = results[key]
  if (mediaLogs == null) {
    return {
      shortcode,
      logs: {},
    }
  }
  return mediaLogs
}

export async function insertLog(mediaLogs: MediaLogs, mediaLog: MediaLog) {
  const shortcode = mediaLogs.shortcode
  const date = moment(mediaLog.crawledAt).format("YYYY-MM-DD")
  if (!(date in mediaLogs.logs)) {
    mediaLogs.logs[date] = mediaLog
  }

  const monitoredMedia = await getMonitoredMedia(shortcode)
  monitoredMedia.lastCrawledAt = mediaLog.crawledAt

  const monitorKey = StorageKey.MONITORED_MEDIA(shortcode)
  const logKey = StorageKey.MEDIA_LOG(shortcode)
  await chrome.storage.local.set({
    [logKey]: mediaLogs,
    [monitorKey]: monitoredMedia,
  })
}

export const removeMonitoredMedia = async (shortcode: string) => {
  const key = StorageKey.MONITORED_MEDIA(shortcode)
  await chrome.storage.local.remove(key)
}
