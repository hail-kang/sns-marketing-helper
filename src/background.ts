import { filterMonitoredMediaList } from "@/module/storage"

chrome.alarms.create("crawling-schedule", {
  periodInMinutes: 1,
  when: Date.now() + 60 * 1000,
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "crawling-schedule") {
    const monitoredMediaList = await filterMonitoredMediaList((item) => {
      return (
        item.lastCrawledAt == null ||
        Date.now() - item.lastCrawledAt > 3 * 60 * 1000
      )
    }, 3)

    monitoredMediaList.forEach(async (item) => {
      try {
        const result = await sendMessageToFirstInstagramTab({
          action: "crawling",
          shortcode: item.shortcode,
        })
        console.log(item.shortcode, result)
      } catch (error) {
        console.log("크롤링 에러", error)
      }
    })
  }
})

async function sendMessageToFirstInstagramTab(message: any) {
  const tabs = await chrome.tabs.query({
    url: "*://www.instagram.com/*",
  })

  if (tabs.length > 0 && tabs[0].id != null) {
    const result = await chrome.tabs.sendMessage(tabs[0].id, message)
    return result
  }
}
