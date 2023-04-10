import service from './request'
import qs from 'qs'
// 我喜欢的音乐列表
export function getLikeList(uid: number) {
  const query = qs.stringify({
    uid,
    timestamp: Date.now()
  })
  return service.get(`/likelist?${query}`)
}
// toggle喜欢音乐
export function likeMusic(id:number, like:boolean) {
  return service.get(`/like?id=${id}&like=${like}`)
}
// 推荐新音乐
export function getNewSong() {
  return service.get('/personalized/newsong?limit=40');
}
// 获取音乐url
export function getMusicUrl(id:string) {
  const query = qs.stringify({
    timestamp: Date.now(),
    id
  });
  return service.get('/song/url?'+query);
}
// 获取歌词
export function getLyric(id:string) {
  return service.get('/lyric?id='+id);
}
// 检查音乐是否可用
export function checkMusic(id:string) {
  return service.get('/check/music?id='+id);
}