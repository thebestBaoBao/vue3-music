import service from './request'

// 获取轮播
export function getBanner() {
  return service.get('/banner');
}
// 批量请求接口
export function batchRequest(data: {
  [key: string]: any
}) {
  return service.post('/batch', data);
}

export * from './login'
export * from './playlist'
export * from './search'
export * from './songs'
export * from './user'
export * from './album'
