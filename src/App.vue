<template>
  <div>
    <div>
      {{ getChromeMessage("helloMessage") }}
    </div>
    <div>
      <textarea
        :value="storageValues"
        rows="30"
        style="width: 300px; font-size: 9px"
      />
    </div>
    <button @click="clearStorage">로컬 스토리지를 비워주세요</button>
    <button @click="sendMessageToInstagram">
      인스타그램 첫번째 탭에 메시지 보내기
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue"

const getChromeMessage = (key: string): string => {
  return chrome.i18n.getMessage(key)
}

const storageValues = ref<any>({})

const fetchStorageValues = () => {
  chrome.storage.local.get(null, (result) => {
    storageValues.value = JSON.stringify(result, null, 4)
  })
}

const watchStorageValues = () => {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local") {
      fetchStorageValues()
    }
  })
}

const clearStorage = () => {
  chrome.storage.local.clear(() => {
    console.log("로컬 스토리지를 비웠습니다.")
    fetchStorageValues()
  })
}

const sendMessageToInstagram = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length && tabs[0].id) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "contentMessage" },
        (response) => {
          console.log(response)
        },
      )
    }
  })
}

onMounted(() => {
  fetchStorageValues()
  watchStorageValues()
})
</script>

<style>
/* 스타일 */
</style>
