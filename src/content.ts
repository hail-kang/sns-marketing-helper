console.log("콘텐츠 스크립트가 로드되었습니다")
import moment from "moment"
import Chart from "chart.js/auto"
import { downloadUrls } from "@/module/file"
import {
  TableName,
  StorageKey,
  addMonitoredMedia,
  insertLog,
  existsMonitoredMedia,
  getMediaLogs,
  removeMonitoredMedia,
} from "@/module/storage"
import { MediaLog, MonitoredMedia, ShortcodeMedia } from "@/types/mediaData"
import { fetchInstagramData } from "@/module/crawl/instagram"

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "crawling") {
    const shortcode: string = request.shortcode
    const mediaLogs = await getMediaLogs(shortcode)
    const now = Date.now()
    const date = moment(now).format("YYYY-MM-DD")
    if (date in mediaLogs.logs) {
      sendResponse({ state: "skip" })
    } else {
      const media = await fetchInstagramData(shortcode)
      const mediaLog: MediaLog = {
        comments: media.comments,
        likes: media.likes,
        views: media.views,
        crawledAt: now,
      }
      await insertLog(mediaLogs, mediaLog)
      sendResponse({ state: "success" })
    }
  }
})

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
    const existingData = await existsMonitoredMedia(shortcode)

    if (existingData) {
      // 데이터가 존재하면 제거
      await removeMonitoredMedia(shortcode)
      console.log("미디어 추적 데이터가 제거되었습니다.")
    } else {
      // 데이터가 없으면 추가
      await addMonitoredMedia(shortcode)
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

  const exists = await existsMonitoredMedia(shortcode)
  await updateSvgContent(exists)

  chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log(changes)
    console.log(namespace)
    if (
      namespace === "local" &&
      changes[StorageKey.MONITORED_MEDIA(shortcode)]
    ) {
      const newExists = changes[StorageKey.MONITORED_MEDIA(shortcode)].newValue
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

          // const seidebar = element.querySelector(
          //   "html > body > div:nth-of-type(2) > div > div > div > div:nth-of-type(2) > div > div > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div > div > div:nth-of-type(2)",
          // )
          // if (seidebar != null && !seidebar.matches(".aGhJkLmN")) {
          //   const newDiv = document.createElement("div")
          //   newDiv.className = "aGhJkLmN"
          //   newDiv.textContent = "hello"
          //   seidebar.prepend(newDiv)
          // }
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

const targetElement = document.querySelector(
  "html > body > div:nth-of-type(2) > div > div > div > div:nth-of-type(2) > div > div > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div > div > div:nth-of-type(2)",
)
if (targetElement && targetElement.firstElementChild) {
  const firstElement = targetElement.firstElementChild.cloneNode(
    true,
  ) as Element
  const buttonElement = firstElement.querySelector("div > span > div > a")
  if (buttonElement) {
    buttonElement.setAttribute("href", "#")
    buttonElement.addEventListener("click", () => {
      console.log("hello world")
      const statisticModal = document.querySelector(
        "#sns-helper-statistics",
      ) as HTMLElement
      statisticModal.style.display = "block"
    })
  }

  const svgContainer = buttonElement?.querySelector("svg")?.parentElement
  if (svgContainer) {
    const bodyBackgroundColor = window.getComputedStyle(
      document.body,
    ).backgroundColor
    const isBlackBackground = bodyBackgroundColor === "rgb(0, 0, 0)"
    const strokeColor = isBlackBackground ? "#FFFFFF" : "#000000"
    svgContainer.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M4.5 20.25C4.30189 20.2474 4.11263 20.1676 3.97253 20.0275C3.83244 19.8874 3.75259 19.6981 3.75 19.5V4.5C3.75 4.30109 3.82902 4.11032 3.96967 3.96967C4.11032 3.82902 4.30109 3.75 4.5 3.75C4.69891 3.75 4.88968 3.82902 5.03033 3.96967C5.17098 4.11032 5.25 4.30109 5.25 4.5V19.5C5.24741 19.6981 5.16756 19.8874 5.02747 20.0275C4.88737 20.1676 4.69811 20.2474 4.5 20.25Z" />
      <path d="M19.5 20.25H4.5C4.30109 20.25 4.11032 20.171 3.96967 20.0303C3.82902 19.8897 3.75 19.6989 3.75 19.5C3.75 19.3011 3.82902 19.1103 3.96967 18.9697C4.11032 18.829 4.30109 18.75 4.5 18.75H19.5C19.6989 18.75 19.8897 18.829 20.0303 18.9697C20.171 19.1103 20.25 19.3011 20.25 19.5C20.25 19.6989 20.171 19.8897 20.0303 20.0303C19.8897 20.171 19.6989 20.25 19.5 20.25Z" />
      <path d="M8 16.75C7.80189 16.7474 7.61263 16.6676 7.47253 16.5275C7.33244 16.3874 7.25259 16.1981 7.25 16V12C7.25 11.8011 7.32902 11.6103 7.46967 11.4697C7.61032 11.329 7.80109 11.25 8 11.25C8.19891 11.25 8.38968 11.329 8.53033 11.4697C8.67098 11.6103 8.75 11.8011 8.75 12V16C8.74741 16.1981 8.66756 16.3874 8.52747 16.5275C8.38737 16.6676 8.19811 16.7474 8 16.75Z" />
      <path d="M11.5 16.75C11.3019 16.7474 11.1126 16.6676 10.9725 16.5275C10.8324 16.3874 10.7526 16.1981 10.75 16V8C10.75 7.80109 10.829 7.61032 10.9697 7.46967C11.1103 7.329 11.3011 7.25 11.5 7.25C11.6989 7.25 11.8897 7.329 12.0303 7.46967C12.171 7.61032 12.25 7.80109 12.25 8V16C12.2474 16.1981 12.1676 16.3874 12.0275 16.5275C11.8874 16.6676 11.6981 16.7474 11.5 16.75Z" />
      <path d="M15 16.75C14.8019 16.7474 14.6126 16.6676 14.4725 16.5275C14.3324 16.3874 14.2526 16.1981 14.25 16V12C14.25 11.8011 14.329 11.6103 14.4697 11.4697C14.6103 11.329 14.8011 11.25 15 11.25C15.1989 11.25 15.3897 11.329 15.5303 11.4697C15.671 11.6103 15.75 11.8011 15.75 12V16C15.7474 16.1981 15.6676 16.3874 15.5275 16.5275C15.3874 16.6676 15.1981 16.7474 15 16.75Z" />
      <path d="M18.5 16.75C18.3019 16.7474 18.1126 16.6676 17.9725 16.5275C17.8324 16.3874 17.7526 16.1981 17.75 16V8C17.75 7.80109 17.829 7.61032 17.9697 7.46967C18.1103 7.32902 18.3011 7.25 18.5 7.25C18.6989 7.25 18.8897 7.32902 19.0303 7.46967C19.171 7.61032 19.25 7.80109 19.25 8V16C19.2474 16.1981 19.1676 16.3874 19.0275 16.5275C18.8874 16.6676 18.6981 16.7474 18.5 16.75Z" fill="${strokeColor}"/>
    </svg>`
  }

  const textElement = buttonElement?.querySelector(
    "div > div:nth-of-type(2) > div > div > span > span",
  ) as HTMLElement // 타입 단언 추가
  if (textElement) {
    textElement.textContent = "통계"
    textElement.style.fontWeight = "400"
  }

  targetElement.prepend(firstElement)
}

const sectionContainer = document.querySelector(
  "html > body > div:nth-of-type(2) > div > div > div > div:nth-of-type(2) > div > div > div:first-of-type > div:first-of-type > div:first-of-type",
) as HTMLElement
const sectionElement = sectionContainer?.querySelector("section")
if (sectionContainer && sectionElement) {
  const statisticModal = document.createElement("div")
  statisticModal.id = "sns-helper-statistics"
  statisticModal.style.position = "fixed"
  statisticModal.style.top = "0"
  statisticModal.style.left = sectionContainer.style.marginLeft
  statisticModal.style.background = "black"
  statisticModal.style.width = `${sectionElement.offsetWidth}px`
  statisticModal.style.height = "100%" // 높이를 100%로 설정
  statisticModal.style.display = "none"
  sectionContainer.appendChild(statisticModal)

  const bodyBackgroundColor = window.getComputedStyle(
    document.body,
  ).backgroundColor
  const isBlackBackground = bodyBackgroundColor === "rgb(0, 0, 0)"
  const strokeColor = isBlackBackground ? "#FFFFFF" : "#000000"

  const closeButton = document.createElement("div")
  closeButton.innerHTML = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M13.06 12L17.48 7.57996C17.5537 7.5113 17.6128 7.4285 17.6538 7.3365C17.6948 7.2445 17.7168 7.14518 17.7186 7.04448C17.7204 6.94378 17.7018 6.84375 17.6641 6.75036C17.6264 6.65697 17.5703 6.57214 17.499 6.50092C17.4278 6.4297 17.343 6.37356 17.2496 6.33584C17.1562 6.29811 17.0562 6.27959 16.9555 6.28137C16.8548 6.28314 16.7555 6.30519 16.6635 6.34618C16.5715 6.38717 16.4887 6.44627 16.42 6.51996L12 10.94L7.58 6.51996C7.43782 6.38748 7.24978 6.31535 7.05548 6.31878C6.86118 6.32221 6.67579 6.40092 6.53838 6.53834C6.40096 6.67575 6.32225 6.86113 6.31882 7.05544C6.3154 7.24974 6.38752 7.43778 6.52 7.57996L10.94 12L6.52 16.42C6.37955 16.5606 6.30066 16.7512 6.30066 16.95C6.30066 17.1487 6.37955 17.3393 6.52 17.48C6.66062 17.6204 6.85125 17.6993 7.05 17.6993C7.24875 17.6993 7.43937 17.6204 7.58 17.48L12 13.06L16.42 17.48C16.5606 17.6204 16.7512 17.6993 16.95 17.6993C17.1488 17.6993 17.3394 17.6204 17.48 17.48C17.6204 17.3393 17.6993 17.1487 17.6993 16.95C17.6993 16.7512 17.6204 16.5606 17.48 16.42L13.06 12Z" fill="${strokeColor}"/>
  </svg>`
  closeButton.style.position = "absolute"
  closeButton.style.top = "10px"
  closeButton.style.right = "10px"
  closeButton.style.cursor = "pointer"
  closeButton.addEventListener("click", () => {
    statisticModal.style.display = "none"
  })
  statisticModal.appendChild(closeButton)

  const canvas = document.createElement("canvas")
  canvas.width = 400
  canvas.height = 400
  canvas.id = "sns-helper-canvas"
  statisticModal.appendChild(canvas)

  const ctx = canvas.getContext("2d")
  if (ctx) {
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
        datasets: [
          {
            label: "# of Votes",
            data: [12, 19, 3, 5, 2, 3],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    })
  } else {
    console.error("Canvas context를 가져올 수 없습니다.")
  }
}
