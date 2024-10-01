chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed")
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendNotification") {
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: "/icons/instagram-512.png",
        title: "테스트 알림",
        message: "이것은 테스트 알림입니다.",
      },
      (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error("알림 생성 오류:", chrome.runtime.lastError)
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          })
        } else {
          console.log("알림이 성공적으로 생성되었습니다. ID:", notificationId)
          sendResponse({ success: true })
        }
      },
    )
    return true // 비동기 응답을 위해 true 반환
  } else if (request.action === "saveData") {
    chrome.storage.local.get(["testCount"], (result) => {
      const currentCount = result.testCount
      const newCount =
        currentCount === null || currentCount === undefined
          ? 0
          : currentCount + 1
      chrome.storage.local.set({ testCount: newCount }, () => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          })
        } else {
          sendResponse({ success: true })
        }
      })
    })
    return true // 비동기 응답을 위해 true 반환
  } else if (request.action === "deleteData") {
    chrome.storage.local.remove("testCount", () => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        })
      } else {
        sendResponse({ success: true })
      }
    })
    return true // 비동기 응답을 위해 true 반환
  } else if (request.action === "serviceBackground") {
    setTimeout(() => {
      chrome.storage.local.get(["testCount"], (result) => {
        const currentCount = result.testCount || 0
        const newCount = currentCount + 100
        chrome.storage.local.set({ testCount: newCount }, () => {
          if (chrome.runtime.lastError) {
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            })
          } else {
            chrome.notifications.create({
              type: "basic",
              iconUrl: "/icons/instagram-512.png",
              title: "백그라운드 완료",
              message: "백그라운드 작업이 완료되었습니다.",
            })
            sendResponse({ success: true })
          }
        })
      })
    }, 5000)
    return true // 비동기 응답을 위해 true 반환
  } else if (request.action === "downloadFile") {
    const content = "hello world"
    const blob = new Blob([content], { type: "text/plain" })
    const reader = new FileReader()
    reader.onload = function (event) {
      if (event.target && event.target.result) {
        const dataUrl = event.target.result.toString()
        const now = new Date()
        const fileName = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}.txt`

        chrome.downloads.download(
          {
            url: dataUrl,
            filename: fileName,
            saveAs: false,
          },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              console.error("파일 다운로드 오류:", chrome.runtime.lastError)
              sendResponse({
                success: false,
                error: chrome.runtime.lastError.message,
              })
            } else {
              console.log(
                "파일이 성공적으로 다운로드되었습니다. ID:",
                downloadId,
              )
              sendResponse({ success: true })
            }
          },
        )
      } else {
        sendResponse({
          success: false,
          error: "파일 데이터 URL 생성 실패",
        })
      }
    }
    reader.readAsDataURL(blob)
    return true // 비동기 응답을 위해 true 반환
  }
})

// chrome.webRequest.onCompleted.addListener(
//   (details) => {
//     if (
//       details.type === "xmlhttprequest" &&
//       details.url.includes("instagram.com/graphql/query")
//     ) {
//       // 여기서 응답 데이터를 처리합니다
//       console.log("GraphQL 쿼리 응답:", details)
//     }
//   },
//   { urls: ["*://*.instagram.com/*"] },
// )

// console.log("background script")
// chrome.tabs.query({ url: "https://*.instagram.com/*" }, (tabs) => {
//   console.log("tabs", tabs)
//   const tab = tabs[0]
//   if (tab.id) {
//     chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       func: () => {
//         console.log("interceptInstagramFetch")
//         const originalFetch = window.fetch
//         window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
//           if (init && init.method === "POST") {
//             console.log("POST body:", init.body)
//           }
//           return originalFetch.call(this, input, init)
//         }
//       },
//     })
//   }
// })

// // Instagram 도메인에서 fetch 요청을 가로채는 함수
// function interceptInstagramFetch() {
//   const originalFetch = window.fetch
//   console.log("interceptInstagramFetch")
//   window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
//     if (init && init.method === "POST") {
//       console.log("POST body:", init.body)
//     }
//     return originalFetch.call(this, input, init)
//   }
// }

// // Execute script in active tab
// chrome.tabs.query({ url: "*://*.instagram.com/*" }, (tabs) => {
//   tabs.forEach((tab) => {
//     if (tab.id) {
//       chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         func: interceptInstagramFetch,
//       })
//     }
//   })
// })

// // Instagram 도메인에서 XMLHttpRequest 요청을 가로채는 함수
// interface XMLHttpRequest {
//   _method?: string
//   _url?: string | URL
// }

// function interceptInstagramXHR() {
//   const originalXHROpen = XMLHttpRequest.prototype.open
//   const originalXHRSend = XMLHttpRequest.prototype.send

//   XMLHttpRequest.prototype.open = function (
//     method: string,
//     url: string | URL,
//     async: boolean = true,
//     username?: string | null,
//     password?: string | null,
//   ) {
//     this._method = method
//     this._url = url
//     return originalXHROpen.call(this, method, url, async, username, password)
//   }

//   XMLHttpRequest.prototype.send = function (
//     body?: Document | XMLHttpRequestBodyInit | null,
//   ) {
//     if (this._method === "POST") {
//       console.log("XHR POST body:", body)
//     }
//     return originalXHRSend.call(this, body)
//   }
// }

// // XMLHttpRequest 인터셉터를 실행하는 스크립트
// chrome.tabs.query({ url: "*://*.instagram.com/*" }, (tabs) => {
//   tabs.forEach((tab) => {
//     if (tab.id) {
//       chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         func: interceptInstagramXHR,
//       })
//     }
//   })
// })

// /ajax/bootloader-endpoint/ 요청이 완료되면 content 스크립트로 메시지 전송
// chrome.webRequest.onCompleted.addListener(
//   (details) => {
//     if (details.url.includes("/ajax/bootloader-endpoint/")) {
//       console.log("인스타그램 요청이 완료되었습니다.")
//       chrome.tabs.query({ url: "*://*.instagram.com/*" }, (tabs) => {
//         tabs.forEach((tab) => {
//           if (tab.id) {
//             console.log("인스타그램 탭이 존재합니다.")
//             chrome.scripting.executeScript({
//               target: { tabId: tab.id },
//               func: () => {
//                 ;(function () {
//                   console.log("인스타그램 스크립트 실행")
//                   const originalSend = XMLHttpRequest.prototype.send

//                   XMLHttpRequest.prototype.send = function (body) {
//                     const originalOnload = this.onload

//                     this.onload = function () {
//                       console.log("Response intercepted:", this.responseText)

//                       if (originalOnload) {
//                         originalOnload.apply(this, arguments)
//                       }
//                     }

//                     return originalSend.apply(this, arguments)
//                   }
//                 })()
//               },
//             })
//           }
//         })
//       })
//     }
//   },
//   { urls: ["*://*.instagram.com/*"] },
// )
