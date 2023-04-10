import service from './request'
import qs from 'qs'
// 获取账号信息
export function getUserInfo() {
  return service.get('/user/account')
}
// 获取用户详情
export function getUserDetail(uid:string) {
  return service.get('/user/detail?uid='+uid)
}
// 签到
export function signIn() {
  return service.post('/daily_signin?timestamp=' + Date.now()+'&type=1');
}
// 获取登录状态
export function getLoginStatus() {
  return service.get('/login/status?timestamp='+Date.now());
}
//获取用户歌单
export function getUserPlaylist(uid:number) {
  return service.get('/user/playlist?uid='+uid);
}