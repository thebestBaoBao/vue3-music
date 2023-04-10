import qs from 'qs';
import service from './request';
// 获取歌单详情
export function getPlaylistDetail(id: string) {
  const query = qs.stringify({
    id,
    timestamp: Date.now()
  });
  return service.get('/playlist/detail?'+query);
}
// 获取歌单所有数据
export function getPlaylistAllDetail(data:{
  id: string,
  limit?: number,
  offset?: number,
}) {
  const query = qs.stringify({
    ...data,
    timestamp: Date.now()
  });
  return service.get('/playlist/track/all?'+query);
}
// 收藏/取消收藏歌单
export function updatePlayListSubscribe(data:{
  id:string;
  t:number;// 1:收藏，2:取消收藏
}) {
  const query = qs.stringify({
    id: data.id,
    t: data.t,
    timestamp: Date.now()
  });
  return service.get('/playlist/subscribe?'+query);
}
// 更新歌单标签
export function updatePlaylistTags(data: {
  id: string,
  tags: string
}) {
  const query = qs.stringify({
    ...data,
    timestamp: Date.now()
  });
  return service.get('/playlist/tags/update?'+query);
}
// 推荐歌单
export function getPersonalized() {
  return service.get('/personalized?limit=15');
}
// 获取精品歌单
export function getTopPlayList({ cat = '全部', limit = 10, before = '' }) {
  return service.get(`/top/playlist/highquality?cat=${cat}&limit=${limit}&before=${before}`);
}
// 精品歌单标签列表
export function getTopPlayListTags() {
  return service.get('/playlist/highquality/tags');
}