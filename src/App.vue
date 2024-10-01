<template>
  <div>
    {{ getChromeMessage("helloMessage") }}
    <button @click="testNotification">
      {{ getChromeMessage("testButton") }}
    </button>
    <button @click="saveData">저장</button>
    <button @click="deleteData">삭제</button>
    <button @click="serviceBackground">백그라운드실행</button>
    <button @click="downloadFile">파일다운로드</button>
    <button @click="printLocalStorage">데이터확인</button>
    <button @click="clearStorage">스토리지비우기</button>
    <button @click="logTest">테스트</button>
    <p>값: {{ testCount }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue"

const getChromeMessage = (key: string): string => {
  return chrome.i18n.getMessage(key)
}

const testCount = ref<number>(-1)

const fetchTestCount = () => {
  chrome.storage.local.get(["testCount"], (result) => {
    testCount.value =
      result.testCount === null || result.testCount === undefined
        ? -1
        : result.testCount
  })
}

const watchTestCount = () => {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.testCount) {
      testCount.value =
        changes.testCount.newValue === null ||
        changes.testCount.newValue === undefined
          ? -1
          : changes.testCount.newValue
    }
  })
}

onMounted(() => {
  fetchTestCount()
  watchTestCount()
})

const testNotification = () => {
  chrome.runtime.sendMessage({ action: "sendNotification" }, (response) => {
    if (response && response.success) {
      console.log("알림이 성공적으로 전송되었습니다.")
    } else {
      console.error(
        "알림 전송 실패:",
        response ? response.error : "알 수 없는 오류",
      )
    }
  })
}

const saveData = () => {
  chrome.runtime.sendMessage({ action: "saveData" }, (response) => {
    if (response && response.success) {
      console.log("데이터가 성공적으로 저장되었습니다.")
    } else {
      console.error(
        "데이터 저장 실패:",
        response ? response.error : "알 수 없는 오류",
      )
    }
  })
}

const deleteData = () => {
  chrome.runtime.sendMessage({ action: "deleteData" }, (response) => {
    if (response && response.success) {
      console.log("데이터가 성공적으로 삭제되었습니다.")
    } else {
      console.error(
        "데이터 삭제 실패:",
        response ? response.error : "알 수 없는 오류",
      )
    }
  })
}

const serviceBackground = () => {
  chrome.runtime.sendMessage({ action: "serviceBackground" }, (response) => {
    if (response && response.success) {
      console.log("백그라운드 서비스가 성공적으로 실행되었습니다.")
    } else {
      console.error(
        "백그라운드 서비스 실행 실패:",
        response ? response.error : "알 수 없는 오류",
      )
    }
  })
}

const downloadFile = () => {
  chrome.runtime.sendMessage({ action: "downloadFile" }, (response) => {
    if (response && response.success) {
      console.log("파일 다운로드가 성공적으로 시작되었습니다.")
    } else {
      console.error(
        "파일 다운로드 실패:",
        response ? response.error : "알 수 없는 오류",
      )
    }
  })
}

const printLocalStorage = () => {
  chrome.storage.local.get(null, (result) => {
    console.log("localStorage:", result)
  })
}

const clearStorage = () => {
  chrome.storage.local.clear(() => {
    if (chrome.runtime.lastError) {
      console.error("local 스토리지 비우기 실패:", chrome.runtime.lastError)
    } else {
      console.log("local 스토리지가 성공적으로 비워졌습니다.")
    }
  })
}

const logTest = () => {
  console.log("테스트")
}
</script>

<style>
/* 스타일 */
</style>
