import { WatchingMediaData } from "../types/mediaData"

class StorageTransaction {
  private tableName: string
  private lock: boolean

  constructor(tableName: string) {
    this.tableName = tableName
    this.lock = false
  }

  // 데이터를 저장하는 함수
  async setItem(key: string, data: any): Promise<void> {
    while (this.lock) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    this.lock = true

    try {
      const result = await chrome.storage.local.get([this.tableName])
      const table = result[this.tableName] || {}
      table[key] = JSON.stringify(data)

      await chrome.storage.local.set({ [this.tableName]: table })
      console.log(`데이터가 저장되었습니다. 키: ${key}`)
    } catch (error) {
      console.error(`데이터 저장 중 오류 발생: ${error}`)
    } finally {
      this.lock = false
    }
  }

  // 데이터를 가져오는 함수
  async getItem(key: string): Promise<any | null> {
    while (this.lock) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    this.lock = true

    try {
      const result = await chrome.storage.local.get([this.tableName])
      const table = result[this.tableName] || {}
      const dataString = table[key]

      if (dataString) {
        const data = JSON.parse(dataString)
        return data
      } else {
        console.log(`키 ${key}에 대한 데이터를 찾을 수 없습니다.`)
        return null
      }
    } catch (error) {
      console.error(`데이터 가져오는 중 오류 발생: ${error}`)
      return null
    } finally {
      this.lock = false
    }
  }

  // 데이터를 삭제하는 함수
  async removeItem(key: string): Promise<void> {
    while (this.lock) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    this.lock = true

    try {
      const result = await chrome.storage.local.get([this.tableName])
      const table = result[this.tableName] || {}

      if (key in table) {
        delete table[key]
        await chrome.storage.local.set({ [this.tableName]: table })
        console.log(`키 ${key}에 대한 데이터가 삭제되었습니다.`)
      } else {
        console.log(`키 ${key}에 대한 데이터를 찾을 수 없습니다.`)
      }
    } catch (error) {
      console.error(`데이터 삭제 중 오류 발생: ${error}`)
    } finally {
      this.lock = false
    }
  }

  // 데이터가 존재하는지 확인하는 함수
  async existsItem(key: string): Promise<boolean> {
    while (this.lock) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    this.lock = true

    try {
      const result = await chrome.storage.local.get([this.tableName])
      const table = result[this.tableName] || {}
      return key in table
    } catch (error) {
      console.error(`데이터 존재 여부 확인 중 오류 발생: ${error}`)
      return false
    } finally {
      this.lock = false
    }
  }

  // 데이터를 필터링하는 함수
  async filter(
    func: (data: WatchingMediaData) => boolean,
  ): Promise<WatchingMediaData[]> {
    while (this.lock) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    this.lock = true

    try {
      const result = await chrome.storage.local.get([this.tableName])
      const table = result[this.tableName] || {}
      const filteredData: WatchingMediaData[] = []

      for (const key in table) {
        if (table.hasOwnProperty(key)) {
          const dataString = table[key]
          const data: WatchingMediaData = JSON.parse(dataString)
          if (func(data)) {
            filteredData.push(data)
          }
        }
      }

      return filteredData
    } catch (error) {
      console.error(`데이터 필터링 중 오류 발생: ${error}`)
      return []
    } finally {
      this.lock = false
    }
  }
}

class StorageManager {
  private static instance: StorageManager
  private transactions: { [key: string]: StorageTransaction } = {}

  private constructor() {}

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  public getTable(tableName: string): StorageTransaction {
    if (!this.transactions[tableName]) {
      this.transactions[tableName] = new StorageTransaction(tableName)
    }
    return this.transactions[tableName]
  }
}

export const storageManager = StorageManager.getInstance()
