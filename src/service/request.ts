import axios from 'axios'

const request = axios.create({
  baseURL: 'https://www.lghb.top/',
  method: 'get',
  // 该项目跨域需要开启
  withCredentials: true
})

request.interceptors.request.use((config) => {
  return config
}, err => {
  return Promise.reject(err)
})

request.interceptors.response.use((data) => {
  return data
}, err => {
  window.$message.error('网络错误')
  return Promise.reject(err)
  
})

export default request