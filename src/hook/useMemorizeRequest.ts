import { computed, onUnmounted, reactive, ref } from 'vue';
import type { AxiosResponse } from 'axios';
import { cloneDeep } from 'lodash';

export const useMemorizeRequest = (
  requestFn:(params:any) => Promise<AxiosResponse<any, any>>,
  requestKey:string,
  cacheTime = 180000
) => {
  const cacheResponseMap = new Map();
  const requestLoadingMaps = ref({ [requestKey]: true });
  // 记录缓存时间 默认三分钟 1000 * 60 * 3 = 180000
  const cacheTimeMap = new Map();  
  const requestLoading = computed(() => {
    return requestLoadingMaps.value[requestKey]
  })
  const getKey = (params?:any) => {
    const cloneParams = cloneDeep(params || 'key')
    const key = requestKey + JSON.stringify(cloneParams)
    return key
  }
  const wrapRequest = (params?:any) => {
    const key = getKey(params)
    const request = () => {
      requestLoadingMaps.value[requestKey] = true
      const requestData = requestFn(params)
      cacheResponseMap.set(key, requestData)
      cacheTimeMap.set(key, Date.now())
      return requestData
    }

    if (!cacheResponseMap.has(key)) {
      return request()
    } else {
      // 判断是否超时 超时则重新请求
      if (Date.now() - cacheTimeMap.get(key) > cacheTime) {
        return request()
      }
      return cacheResponseMap.get(key)
    }
  }
  // 删除指定缓存  
  const removeCache = (params?:any) => {
    const key = getKey(params);
    if (cacheResponseMap.has(key)) {
      cacheResponseMap.delete(key);
    }
  }
  // 加载成功回调 将loading设置为false
  const loadSuccess = () => {
    requestLoadingMaps.value[requestKey] = false;
  }

  // 清空缓存
  onUnmounted(() => {
    cacheResponseMap.clear()
  })

  return {
    wrapRequest,
    loadSuccess,
    removeCache,
    requestLoading
  }
}