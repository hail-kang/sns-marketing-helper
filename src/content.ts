console.log("콘텐츠 스크립트가 로드되었습니다")

import { v4 as uuidv4 } from "uuid"
import { downloadUrls } from "./module/file"
import { storageManager } from "./module/storage"
import { WatchingMediaData, ShortcodeMedia } from "./types/mediaData"

const getMediaUrls = (media: any): Array<string> | null => {
  const mediaType = media["media_type"]
  if (mediaType === 1) {
    return [media["image_versions2"]["candidates"][0]["url"]]
  } else if (mediaType === 2) {
    return [media["video_versions"][0]["url"]]
  } else if (mediaType === 8) {
    return media["carousel_media"].flatMap(getMediaUrls)
  }
  return null
}

// 네트워크 요청 함수
const fetchInstagramData = async (
  shortcode: string,
): Promise<ShortcodeMedia> => {
  const endpoint = "https://www.instagram.com/graphql/query"
  const variables = JSON.stringify({
    shortcode,
    __relay_internal__pv__PolarisFeedShareMenurelayprovider: false,
    __relay_internal__pv__PolarisIsLoggedInrelayprovider: false,
  })
  const body = `av=17841451189947950&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisPostRootQuery&variables=${encodeURIComponent(variables)}&server_timestamps=true&doc_id=9496392173716084`

  try {
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
      comments: media["comment_count"],
      likes: media["like_count"],
      views: media["view_count"],
      mediaUrls,
    }
  } catch (error) {
    console.error("데이터 가져오기 오류:", error)
    throw error
  }
}

const setVideoControls = (videoElement: HTMLVideoElement | null) => {
  if (videoElement) {
    videoElement.setAttribute("controls", "")
    videoElement.style.position = "relative"
    videoElement.style.zIndex = "999"
  } else {
    console.log("videoElement를 찾을 수 없습니다.")
  }
}

const handleSvgClick = async (
  element: Element,
  isReel: boolean = false,
  svgContainer: HTMLDivElement,
) => {
  if (svgContainer.querySelector(".helper-spinner")) {
    return
  }
  const bodyBackgroundColor = window.getComputedStyle(
    document.body,
  ).backgroundColor
  const isBlackBackground = bodyBackgroundColor === "rgb(0, 0, 0)"
  const strokeColor = isBlackBackground ? "#FFFFFF" : "#000000"

  const originalSvgContent = svgContainer.innerHTML

  const svgContent = `
  <svg class="helper-spinner" width="24" height="24" style="${isReel ? "margin-top: -6px;" : ""}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 21C10.5316 20.9987 9.08574 20.6382 7.78865 19.9498C6.49156 19.2614 5.38261 18.2661 4.55853 17.0507C3.73446 15.8353 3.22029 14.4368 3.06088 12.977C2.90147 11.5172 3.10167 10.0407 3.644 8.67604C4.18634 7.31142 5.05434 6.10024 6.17229 5.14813C7.29024 4.19603 8.62417 3.53194 10.0577 3.21378C11.4913 2.89563 12.9809 2.93307 14.3967 3.32286C15.8124 3.71264 17.1113 4.44292 18.18 5.45C18.3205 5.59062 18.3993 5.78125 18.3993 5.98C18.3993 6.17875 18.3205 6.36937 18.18 6.51C18.1111 6.58075 18.0286 6.63699 17.9376 6.67539C17.8466 6.71378 17.7488 6.73357 17.65 6.73357C17.5512 6.73357 17.4534 6.71378 17.3624 6.67539C17.2714 6.63699 17.189 6.58075 17.12 6.51C15.8591 5.33065 14.2303 4.62177 12.508 4.5027C10.7856 4.38362 9.07478 4.86163 7.66357 5.85624C6.25237 6.85085 5.22695 8.30132 4.75995 9.96345C4.29296 11.6256 4.41292 13.3979 5.09962 14.9819C5.78633 16.5659 6.99785 17.865 8.53021 18.6604C10.0626 19.4558 11.8222 19.6989 13.5128 19.3488C15.2034 18.9987 16.7218 18.0768 17.8123 16.7383C18.9028 15.3998 19.4988 13.7265 19.5 12C19.5 11.8011 19.579 11.6103 19.7197 11.4697C19.8603 11.329 20.0511 11.25 20.25 11.25C20.4489 11.25 20.6397 11.329 20.7803 11.4697C20.921 11.6103 21 11.8011 21 12C21 14.3869 20.0518 16.6761 18.364 18.364C16.6761 20.0518 14.387 21 12 21Z" fill="${strokeColor}"/>
  </svg>
  `

  svgContainer.innerHTML = svgContent
  svgContainer.style.cursor = "default"
  svgContainer.style.opacity = "0.7"

  try {
    if (isReel) {
      const match = window.location.href.match(/\/reels\/([^/]+)\//)
      const shortcode = match ? match[1] : null
      if (shortcode) {
        console.log("릴스 다운로드 로직 실행")
        console.log("추출된 릴스 shortcode:", shortcode)
        if (shortcode) {
          const media = await fetchInstagramData(shortcode)
          console.log("Media Data:", media)
          await downloadUrls({
            urls: media.mediaUrls,
            zipFileSuffix: "instagram",
          })
        }
      } else {
        console.log("릴스 shortcode를 찾을 수 없습니다.")
      }
    } else {
      const linkElement = element.querySelector(
        'a[href^="/p/"][href$="/liked_by/"]',
      )
      if (linkElement) {
        const href = linkElement.getAttribute("href")
        const shortcode = extractShortcode(href)
        console.log("추출된 포스트 shortcode:", shortcode)
        if (shortcode) {
          const media = await fetchInstagramData(shortcode)
          console.log("Media Data:", media)
          await downloadUrls({
            urls: media.mediaUrls,
            zipFileSuffix: "instagram",
          })
        }
      } else {
        console.log("포스트 링크를 찾을 수 없습니다.")
      }
    }
  } catch (error) {
    console.error("데이터 다운로드 오류:", error)
    throw error
  } finally {
    svgContainer.innerHTML = originalSvgContent
    svgContainer.style.cursor = "pointer"
    svgContainer.style.opacity = "1"
  }
}

const handleMediaWatchingButtonClick = async (shortcode: string | null) => {
  console.log("미디어 추적 버튼이 클릭되었습니다.")
  if (shortcode) {
    const watchingMediaTransaction = storageManager.getTable("watchingMedia")
    const existingData = await watchingMediaTransaction.getItem(shortcode)

    if (existingData) {
      // 데이터가 존재하면 제거
      await watchingMediaTransaction.removeItem(shortcode)
      console.log("미디어 추적 데이터가 제거되었습니다.")
    } else {
      // 데이터가 없으면 추가
      const mediaData: WatchingMediaData = {
        shortcode,
        createdAt: new Date(),
        lastCrawledAt: new Date(),
      }
      await watchingMediaTransaction.setItem(shortcode, mediaData)
      console.log("미디어 추적 데이터가 추가되었습니다.")
    }
  } else {
    console.log("shortcode를 추출할 수 없습니다.")
  }
}

// SVG 컨테이너 생성 함수
const createSvgContainer = (isReel: boolean = false) => {
  const svgContainer = document.createElement("div")
  svgContainer.className = "qWeRtYuIoP"
  svgContainer.style.width = isReel ? "24px" : "26px"
  svgContainer.style.height = isReel ? "24px" : "26px"
  svgContainer.style.padding = "6px"
  svgContainer.style.cursor = "pointer"
  if (isReel) {
    svgContainer.style.marginTop = "-10px"
    svgContainer.style.marginBottom = "15px"
  }

  const bodyBackgroundColor = window.getComputedStyle(
    document.body,
  ).backgroundColor
  const isBlackBackground = bodyBackgroundColor === "rgb(0, 0, 0)"
  const strokeColor = isBlackBackground ? "#FFFFFF" : "#000000"

  const svgContent = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="${isReel ? "margin-top: -6px;" : ""}">
      <g id="Complete">
        <g id="download">
          <g>
            <path d="M3,12.3v7a2,2,0,0,0,2,2H19a2,2,0,0,0,2-2v-7" fill="none" stroke="${strokeColor}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            <g>
              <polyline data-name="Right" fill="none" id="Right-2" points="7.9 12.3 12 16.3 16.1 12.3" stroke="${strokeColor}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
              <line fill="none" stroke="${strokeColor}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="2.7" y2="14.2"/>
            </g>
          </g>
        </g>
      </g>
    </svg>
  `

  svgContainer.innerHTML = svgContent

  svgContainer.addEventListener("mouseover", () => {
    if (!svgContainer.querySelector(".helper-spinner")) {
      svgContainer.style.opacity = "0.7"
    }
  })

  svgContainer.addEventListener("mouseout", () => {
    if (!svgContainer.querySelector(".helper-spinner")) {
      svgContainer.style.opacity = "1"
    }
  })

  return svgContainer
}

// 통계 버튼 생성 함수
const createMediaWatchingButton = async (
  isReel: boolean = false,
  shortcode: string | null,
) => {
  if (!shortcode) return null

  const mediaWatchingButton = document.createElement("div")
  mediaWatchingButton.className = "aZxCvBnM"
  mediaWatchingButton.style.width = isReel ? "24px" : "26px"
  mediaWatchingButton.style.height = isReel ? "24px" : "26px"
  mediaWatchingButton.style.padding = "6px"
  mediaWatchingButton.style.cursor = "pointer"
  if (isReel) {
    mediaWatchingButton.style.marginTop = "-10px"
    mediaWatchingButton.style.marginBottom = "15px"
  }

  const bodyBackgroundColor = window.getComputedStyle(
    document.body,
  ).backgroundColor
  const isBlackBackground = bodyBackgroundColor === "rgb(0, 0, 0)"
  const strokeColor = isBlackBackground ? "#FFFFFF" : "#000000"

  const updateSvgContent = async (exists: boolean) => {
    const svgContent = exists
      ? `
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="${isReel ? "margin-top: -6px;" : ""}">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="${strokeColor}"/>
        </svg>
      `
      : `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="${isReel ? "margin-top: -6px;" : ""}">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" stroke="${strokeColor}" stroke-width="1.5"/>
        </svg>
      `
    mediaWatchingButton.innerHTML = svgContent
  }

  const table = storageManager.getTable("watchingMedia")
  const exists = await table.existsItem(shortcode)
  await updateSvgContent(exists)

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.watchingMedia) {
      const newWatchingMedia = changes.watchingMedia.newValue
      const newExists = newWatchingMedia && newWatchingMedia[shortcode]
      updateSvgContent(newExists)
    }
  })

  mediaWatchingButton.addEventListener("mouseover", () => {
    mediaWatchingButton.style.opacity = "0.7"
  })

  mediaWatchingButton.addEventListener("mouseout", () => {
    mediaWatchingButton.style.opacity = "1"
  })

  mediaWatchingButton.addEventListener("click", () =>
    handleMediaWatchingButtonClick(shortcode),
  )

  return mediaWatchingButton
}

// shortcode 추출 함수
const extractShortcode = (href: string | null): string | null => {
  if (!href) return null
  const match = href.match(/\/p\/([^/]+)/)
  return match ? match[1] : null
}

// 요소에 SVG 추가하는 함수
const addSvgToElement = async (element: Element, isReel: boolean = false) => {
  let buttonContainer: Element | null = null
  let shortcode: string | null = null

  if (isReel) {
    buttonContainer = element.children[1] as HTMLElement
    if (buttonContainer && buttonContainer.tagName.toLowerCase() !== "div") {
      buttonContainer = null
    }
    const match = window.location.href.match(/\/reels\/([^/]+)\//)
    shortcode = match ? match[1] : null
  } else if (element.tagName.toLowerCase() === "article") {
    buttonContainer =
      element.querySelector(
        "div > div > section:nth-child(1) > section > div:nth-child(1)",
      ) ||
      element.querySelector(
        "div > div:nth-child(1) > section:nth-child(1) > div:nth-child(1)",
      ) ||
      element.querySelector(
        "div > div > div:nth-child(2) > section:nth-child(1)",
      ) ||
      element.querySelector("div > div > section:nth-child(1)")
    const linkElement = element.querySelector(
      'a[href^="/p/"][href$="/liked_by/"]',
    )
    if (linkElement) {
      const href = linkElement.getAttribute("href")
      shortcode = extractShortcode(href)
    }
  } else if (element.getAttribute("role") === "dialog") {
    buttonContainer = element.querySelector(
      "div > div > div:nth-child(2) > section:nth-child(1)",
    )
    const linkElement = element.querySelector(
      'a[href^="/p/"][href$="/liked_by/"]',
    )
    if (linkElement) {
      const href = linkElement.getAttribute("href")
      shortcode = extractShortcode(href)
    }
  } else {
    buttonContainer = element.querySelector(
      "section:nth-child(1) > div:nth-child(1)",
    )
    const linkElement = element.querySelector(
      'a[href^="/p/"][href$="/liked_by/"]',
    )
    if (linkElement) {
      const href = linkElement.getAttribute("href")
      shortcode = extractShortcode(href)
    }
  }

  if (!buttonContainer) return

  if (!isReel) {
    const videoElement = element.querySelector("video") as HTMLVideoElement
    setVideoControls(videoElement)
  }

  const svgContainer = createSvgContainer(isReel)
  svgContainer.addEventListener("click", () =>
    handleSvgClick(element, isReel, svgContainer),
  )

  const mediaWatchingButton = await createMediaWatchingButton(isReel, shortcode)

  const children = Array.from(buttonContainer.children)
  if (children.length >= 3) {
    buttonContainer.insertBefore(svgContainer, children[3])
    if (mediaWatchingButton) {
      buttonContainer.insertBefore(mediaWatchingButton, children[4])
    }
  } else {
    buttonContainer.appendChild(svgContainer)
    if (mediaWatchingButton) {
      buttonContainer.appendChild(mediaWatchingButton)
    }
  }
}

// 릴스 페이지인지 확인하는 함수
const isReelsPage = (url: string): boolean => {
  const reelsRegex = /^https:\/\/www\.instagram\.com\/reels\/[^/]+\/?$/
  return reelsRegex.test(url)
}

// MutationObserver를 사용하여 DOM 변경 감지
const observer = new MutationObserver((mutations) => {
  mutations.forEach(async (mutation) => {
    if (mutation.type === "childList") {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element
          const links = element.matches('a[href^="/p/"][href$="/liked_by/"]')
            ? [element]
            : [
                ...element.querySelectorAll(
                  'a[href^="/p/"][href$="/liked_by/"]',
                ),
                element.querySelector('a[href^="/p/"][href$="/liked_by/"]'),
              ].filter(Boolean)
          for (const link of links) {
            if (link) {
              const parentElement =
                link.closest("article") ||
                link.closest('div[role="dialog"]') ||
                link.closest("section > main > div > div:nth-child(1) > div")
              if (
                parentElement &&
                !parentElement.querySelector(".qWeRtYuIoP") &&
                !parentElement.querySelector(".aZxCvBnM")
              ) {
                await addSvgToElement(parentElement)
              }
            }
          }

          const currentUrl = window.location.href
          if (isReelsPage(currentUrl)) {
            const reels = element.querySelectorAll(
              "div > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > section > main > div > div > div",
            )
            for (const reel of reels) {
              if (
                !reel.querySelector(".qWeRtYuIoP") &&
                !reel.querySelector(".aZxCvBnM")
              ) {
                await addSvgToElement(reel, true)
              }
            }
          }
        }
      }
    }
  })
})

// 초기 요소들에 대해 SVG 추가
const initialLinks = document.querySelectorAll(
  'a[href^="/p/"][href$="/liked_by/"]',
)
initialLinks.forEach(async (link) => {
  const parentElement =
    link.closest("article") ||
    link.closest('div[role="dialog"]') ||
    link.closest("section > main > div > div:nth-child(1) > div")
  if (
    parentElement &&
    !parentElement.querySelector(".qWeRtYuIoP") &&
    !parentElement.querySelector(".aZxCvBnM")
  ) {
    await addSvgToElement(parentElement)
  }
})

// 초기 릴스에 대해 SVG 추가
const currentUrl = window.location.href
if (isReelsPage(currentUrl)) {
  const initialReels = document.querySelectorAll(
    "div > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > section > main > div > div > div",
  )
  initialReels.forEach(async (reel) => {
    if (
      !reel.querySelector(".qWeRtYuIoP") &&
      !reel.querySelector(".aZxCvBnM")
    ) {
      await addSvgToElement(reel, true)
    }
  })
}

observer.observe(document.body, { childList: true, subtree: true })

console.log("DOM 변경 관찰이 시작되었습니다.")
