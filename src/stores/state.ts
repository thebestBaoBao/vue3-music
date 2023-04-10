import type { AnyObject } from "env";
export interface StoreState {
  backTopLeft: string,
  isLogin: boolean,
  likeSongs: Array<number>,
  playList: any[],
  userProfile: AnyObject,
  currentPlayIndex: number,
  playMode: playMode,
  playWaiting: boolean;
  currentPlayListId: string,
  playing: boolean,
  mySubscribeSongList: any[],
  playListIdList: Array<string>,
  searchHistory: Array<string>,
  showMusicDetail: boolean,
  searchKeyword: string,
  currentPlayLyric: string,
  volume: number
  lastVolume: number
}
export type playMode = 'order' | 'random' | 'singleLoop'
const initState = (
  key: string, defaultVal: any, parse = true
) => {
  return localStorage[key]
    ? parse
      ? JSON.parse(localStorage[key])
      : localStorage[key]
    : defaultVal
}
const state : StoreState = {
  backTopLeft: initState('backTopLeft', '8vw', false),
  isLogin: initState('isLogin', false),
  userProfile: initState('userProfile', {}),
  likeSongs: initState('likeSongs', []),
  playList: initState('playList', []),
  currentPlayIndex: initState('currentPlayIndex', 0),
  playMode: initState('playMode', 'order', false),
  currentPlayListId: initState('currentPlayListId', '', false),
  mySubscribeSongList: initState('mySubscribeSongList', []),
  playListIdList: initState('playListIdList', []),
  searchHistory: initState('searchHistory', []),
  volume: initState('volume', 100),
  lastVolume: initState('lastVolume', 100),
  searchKeyword: '',
  playWaiting: true,
  playing: false,
  showMusicDetail: false,
  currentPlayLyric: '',
  
}

export default state  