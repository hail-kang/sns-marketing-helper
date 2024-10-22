import { MediaLog, ShortcodeMedia } from "@/types/mediaData"

export const getMediaUrls = (media: any): string[] => {
  const mediaType = media["media_type"]
  if (mediaType === 1) {
    return [media["image_versions2"]["candidates"][0]["url"]]
  } else if (mediaType === 2) {
    return [media["video_versions"][0]["url"]]
  } else if (mediaType === 8) {
    return media["carousel_media"].flatMap(getMediaUrls)
  }
  throw Error("확인되지 않는 미디어 타입")
}

// 네트워크 요청 함수
export const fetchInstagramData = async (
  shortcode: string,
): Promise<ShortcodeMedia> => {
  const endpoint = "https://www.instagram.com/graphql/query"
  const variables = JSON.stringify({
    shortcode,
    __relay_internal__pv__PolarisFeedShareMenurelayprovider: false,
    __relay_internal__pv__PolarisIsLoggedInrelayprovider: false,
  })
  const body = `av=17841451189947950&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisPostRootQuery&variables=${encodeURIComponent(variables)}&server_timestamps=true&doc_id=9496392173716084`

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      accept: "*/*",
      "content-type": "application/x-www-form-urlencoded",
      priority: "u=1, i",
      "x-asbd-id": "129477",
      "x-fb-friendly-name": "PolarisPostRootQuery",
      "x-ig-app-id": "936619743392459",
    },
    referrer: "https://www.instagram.com/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body,
  })
  if (!response.ok) {
    throw new Error(`HTTP 오류! 상태: ${response.status}`)
  }
  const data = await response.json()
  console.log("인스타그램 데이터:", data)
  const media =
    data["data"]["xdt_api__v1__media__shortcode__web_info"]["items"][0]
  const mediaUrls = getMediaUrls(media)
  return {
    shortcode: media["code"],
    comments: media["comment_count"],
    likes: media["like_count"],
    views: media["view_count"],
    mediaUrls,
  }
}
