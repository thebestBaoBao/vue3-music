import { nanoid } from 'nanoid'
import { ref } from 'vue'
export function useNanoid() {
  const idMap = new Map()
  const currentId = ref('')
  return {
    set(key: any) {
      if (!idMap.has(key)) {
        const id = nanoid()
        idMap.set(key, id)
        currentId.value = id
      } else {
        currentId.value = idMap.get(key)
      }
    },
    currentId
  }
}