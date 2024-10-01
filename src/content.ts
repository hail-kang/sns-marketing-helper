console.log("콘텐츠 스크립트가 로드되었습니다")

import { storageManager } from "./module/storage"
import { WatchingMediaData } from "./types/mediaData"

// 네트워크 요청 함수
const fetchInstagramData = async (shortcode: string) => {
  const endpoint = "https://www.instagram.com/graphql/query/"
  const queryHash = "55a3c4bad29e4e20c20ff4cdfd80f5b4"
  const variables = JSON.stringify({ shortcode })
  const url = `${endpoint}?query_hash=${queryHash}&variables=${encodeURIComponent(variables)}`

  try {
    const response = await fetch(url, { method: "GET" })
    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태: ${response.status}`)
    }
    const data = await response.json()
    console.log("인스타그램 데이터:", data)
    return data
  } catch (error) {
    console.error("데이터 가져오기 오류:", error)
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

const handleSvgClick = async (element: Element, isReel: boolean = false) => {
  if (isReel) {
    const match = window.location.href.match(/\/reels\/([^/]+)\//)
    const shortcode = match ? match[1] : null
    if (shortcode) {
      console.log("릴스 다운로드 로직 실행")
      console.log("추출된 릴스 shortcode:", shortcode)
      if (shortcode) {
        await fetchInstagramData(shortcode)
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
        await fetchInstagramData(shortcode)
      }
    } else {
      console.log("포스트 링크를 찾을 수 없습니다.")
    }
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
    svgContainer.style.opacity = "0.7"
  })

  svgContainer.addEventListener("mouseout", () => {
    svgContainer.style.opacity = "1"
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
  svgContainer.addEventListener("click", () => handleSvgClick(element, isReel))

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
