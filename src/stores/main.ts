import { defineStore } from "pinia";
import state, { type playMode } from './state'
import { checkMusic, getLyric, getMusicUrl } from '@/service'
import type { AnyObject } from 'env'
import { formateSongsAuthor, getNextIndex, getPrevIndex } from '@/utils'
import { cloneDeep, shuffle } from 'lodash'

export const useMainStore = defineStore({
  id: 'main',
  state: () => state,
  getters: {
    currentPlaySong(state) {
      return state.playList[state.currentPlayIndex]
    },
    likeSongsIndexMap(state) {
      const map:{[key:number] : number} = {}
      state.likeSongs.forEach((item:number, index:number) => {
        map[item] = index
      })
      return map
    },
  },
  actions: {
    removeAllLikeList() {
      this.likeSongs = []
      localStorage.lickSongs = JSON.stringify(this.likeSongs)
    },
    setShowMusicDetail(value:boolean) {
      this.showMusicDetail = value;
    },
    addSearchHistory(value:string) {
      if(this.searchHistory.includes(value)) {
        return
      }
      this.searchHistory.push(value)
      localStorage.searchHistory = JSON.stringify(this.searchHistory)
    },
    clearSearchHistory() {
      this.searchHistory = [];
      localStorage.searchHistory = JSON.stringify([]);
    }, 
    removeSearchHistory(index:number) {
      this.searchHistory.splice(index, 1);
      localStorage.searchHistory = JSON.stringify(this.searchHistory);
    },   
    setMySubscribeSongList(list:any[]) {
      this.mySubscribeSongList = list;
      localStorage.mySubscribeSongList = JSON.stringify(list);
    },
    setLikeList(data:number[]) {
      this.likeSongs = data;
      localStorage.likeSongs = JSON.stringify(data);
    },
    addLikeList(id:number) {
      this.likeSongs.push(id);
      localStorage.likeSongs = JSON.stringify(this.likeSongs);
    }, 
    removeLikeList(id:number) {
      this.likeSongs = this.likeSongs.filter((item: number) => item !== id);
      localStorage.likeSongs = JSON.stringify(this.likeSongs);
    },   
    // 初始化 播放列表
    async initPlayList(data: any[], index=0, playListId:string, message='亲爱的, 暂无版权') {
      // 没有URL则获取
      if (!data[index].url) {
        const res = await this.setMusicData({ data, id: data[index].id, index})
        if (!res.success) return
      }
      this.playList = data
      this.initPlayListPrevAndNextIndex()
      localStorage.rawPlayList = JSON.stringify(cloneDeep(this.playList))

      this.currentPlayIndex = index
      this.playListIdList = [playListId]
      this.currentPlayListId = playListId
      localStorage.currentPlayIndex = index;
      localStorage.playListIdList = JSON.stringify(this.playListIdList);
      localStorage.playList = JSON.stringify(data);
      localStorage.currentPlayListId = playListId;      

      if (this.playMode === 'random') {
        this.shufflePlayList()
      }

      this.changePlaying(true)
    },
    // 切换 播放的音乐
    async changePlayIndex(index: number, message="亲爱的, 暂无版权") {
      // 如果没有获取url, 则获取歌曲url
      if (!this.playList[index].url) {
        const res = await this.setMusicData({ data: this.playList, id: this.playList[index].id, index, message });
        if (!res.success) return
      }

      this.currentPlayIndex = index;
      localStorage.currentPlayIndex = index;
      localStorage.playList = JSON.stringify(this.playList);

      this.changePlaying(true);      
    },
    hasLikeSong(id:number) {
      if (this.likeSongsIndexMap[id]) return true
      return false
    },
    mapSongListAddLike(data:any[]) {
      return data.map((item, index) => {
        if (this.likeSongs) {
          const hasLike = this.hasLikeSong(item.id);
          item.like = hasLike;
        } else {
          item.like = false;
        }
        item.formatAuthor = formateSongsAuthor(item.ar);
        item.key = index;
        return item;
      });
    },
    setVolume(val:number) {
      this.volume = val
      localStorage.volume = JSON.stringify(this.volume)
    },
    setLastVolume() {
      this.lastVolume = this.volume
      localStorage.lastVolume = JSON.stringify(this.lastVolume)
    },
    // 请求设置 歌曲数据信息 rul 歌词
    async setMusicData(options:{
      data: any[], id:string, index:number, message?:string, showMessage?:boolean
    }):Promise<any> {
      const { data, id, index, message='暂无版权', showMessage=true } = options
      const result:AnyObject = {}
      showMessage && window.$message.loading('获取歌曲数据中...', { duration: 0 })
      
      try {
        // 检查歌曲是否可用
        const checkRes = await checkMusic(id) as any;
        if (!checkRes.musicSuccess && !checkRes?.data?.success) {
          window.$message.destroyAll();
          showMessage && window.$message.info(message);
          return { success: false };
        }
      } catch (error) {
        window.$message.destroyAll();
        showMessage && window.$message.info('暂无版权');
        return { success: false };
      }
      // 获取音乐URL
      const res = await getMusicUrl(id)
      if (res.data.code === 200) {
        result.url = res.data.data[0].url + '?id=' + id
      } else {
        showMessage && window.$message.error('获取歌曲播放地址失败');
        return { success: false };        
      }
      // 获取歌曲歌词
      const lyricRes = await getLyric(id);
      if (lyricRes.data.code === 200) {
        result.lyric = lyricRes.data?.lrc?.lyric;
        if (result.lyric.includes('纯音乐，请欣赏') || !result.lyric) {
          result.isNotLyric = true;
        } else {
          result.isNotLyric = false;
        }
        result.tlyric = lyricRes.data?.tlyric?.lyric;
      } else {
        showMessage && window.$message.error('获取歌词失败');
        return { success: false }
      }
      result.isLoading = false;
      window.$message.destroyAll();
      showMessage && window.$message.success('获取成功');
      data[index] = {
        ...data[index],
        ...result
      };
      return { success: true };
    },
    async loadCurrentPrevAndNext(val:any) {
      // 加载上一首和下一首的歌曲url
      // let next = this.playList[val.nextIndex];
      // let prev = this.playList[val.prevIndex];
      // let prevRes = true, nextRes = true
      // while(nextRes) {
      //   if (next.url) {
      //     nextRes = false
      //   } else {
      //     const res = await this.setMusicData({ data: this.playList, id: next.id, index: val.nextIndex, showMessage: false })
      //     if (!res.success) {
      //       next = this.playList[next.nextIndex]
      //     }          
      //   }
      // }
      // while(prevRes) {
      //   if (prev.url) {
      //     prevRes = false
      //   } else {
      //     const res = await this.setMusicData({ data: this.playList, id: prev.id, index: val.nextIndex, showMessage: false })
      //     if (!res.success) {
      //       prev = this.playList[prev.nextIndex]
      //     }          
      //   }
      // }
      // if (!next.url) {
      //   const res = await this.setMusicData({ data: this.playList, id: next.id, index: val.nextIndex, showMessage: false });
      //   if (!res.success) {
      //     nextRes = false
      //   }
      // }
      // if (!prev.url) {
      //   const res = await this.setMusicData({ data: this.playList, id: next.id, index: val.prevIndex, showMessage: false });
      //   if (!res.success) {
      //     prevRes = false
      //   }
      // }
      localStorage.playList = JSON.stringify(this.playList);
      this.changePlaying(true)
      return { success: true }
    },
    // 切换下一首
    async toggleNext(index?:number) {
      const resultIndex = this.getNextPlayIndex(index);
      // console.log(this.playList[resultIndex].url);
      if (!this.playList[resultIndex].url) {
        const res = await this.setMusicData({ data: this.playList, id: this.playList[resultIndex].id, index: resultIndex });
        // 如果获取失败说明无版权,则获取下一首
        if (!res.success) {
          // const nextIndex = getNextIndex(this.currentPlayIndex, this.playListCount - 1);
          this.toggleNext(resultIndex);
          return; 
        }
      }
      this.currentPlayIndex = resultIndex;
      localStorage.currentPlayIndex = resultIndex;
      localStorage.playList = JSON.stringify(this.playList);
      this.changePlaying(true);
      return { success: true };
    },
    // 切换上一首
    async togglePrev(index?:number) {
      const resultIndex = this.getPrevPlayIndex(index);
      if (!this.playList[resultIndex].url) {
        const res = await this.setMusicData({ data: this.playList, id: this.playList[resultIndex].id, index: resultIndex });
        if (!res.success) {
          // const prevIndex = getPrevIndex(this.currentPlayIndex, this.playListCount - 1);
          this.togglePrev(resultIndex);
          return;
        }
      }
      this.currentPlayIndex = resultIndex;
      localStorage.currentPlayIndex = resultIndex;
      localStorage.playList = JSON.stringify(this.playList);
      this.changePlaying(true);
      return { success: true };
    },    
    getNextPlayIndex(index?:number) {
      const currentPlayIndex = index
        ? +index
        : +this.currentPlayIndex;
      return this.playList[currentPlayIndex].nextIndex;
    },
    getPrevPlayIndex(index?:number) {
      const currentPlayIndex = index
        ? +index
        : +this.currentPlayIndex;
      return this.playList[currentPlayIndex].prevIndex;
    },
    // 切换播放状态
    changePlaying(playing:boolean) {
      this.playing = playing;
    },
    // 初始化播放列表prev 和 next
    initPlayListPrevAndNextIndex() {
      const max = this.playList.length - 1;
      this.playList.forEach((item, index) => {
        const nextIndex = getNextIndex(index, max);
        const prevIndex = getPrevIndex(index, max);
        item.nextIndex = nextIndex;
        item.prevIndex = prevIndex;
      });
    },
    // 切换播放模式
    changePlayMode(mode:playMode) {
      this.playMode = mode;
      localStorage.playMode = mode;
      if (mode === 'random') {
        this.shufflePlayList();
      } else {
        const currentPlaySong = cloneDeep(this.currentPlaySong);
        const rawPlayList = JSON.parse(localStorage.rawPlayList) as any[];
        const newCurrentPlayIndex = rawPlayList.findIndex(item => item.id === currentPlaySong.id);
        rawPlayList[newCurrentPlayIndex] = currentPlaySong;
        this.playList = rawPlayList;
        this.initPlayListPrevAndNextIndex();
        this.currentPlayIndex = newCurrentPlayIndex;
        localStorage.currentPlayIndex = this.currentPlayIndex;
        localStorage.playList = JSON.stringify(rawPlayList);
      }
    },
    shufflePlayList() {
      const currentPlaySong = cloneDeep(this.currentPlaySong);
      const shufflePlayList = shuffle(cloneDeep(this.playList));
      const newCurrentPlayIndex = shufflePlayList.findIndex(item => item.id === currentPlaySong.id);
      shufflePlayList.splice(newCurrentPlayIndex, 1);
      shufflePlayList.unshift(currentPlaySong);
      this.playList = shufflePlayList;
      this.initPlayListPrevAndNextIndex();
      this.currentPlayIndex = 0;
      localStorage.currentPlayIndex = 0;
      localStorage.playList = JSON.stringify(shufflePlayList);
    },
    // 更新播放列表 喜欢
    updatePlayListLike(like:boolean, index?:number) {
      const resultIndex = index
        ? index
        : this.currentPlayIndex;
      this.playList[resultIndex].like = like;
      localStorage.playList = JSON.stringify(this.playList);
    },
    resetPlayList() {
      this.playList = []
      this.playListIdList = []
      this.currentPlayIndex = 0
      this.currentPlayListId = ''
      localStorage.playList = JSON.stringify(this.playList)
      localStorage.playListIdList = JSON.stringify(this.playList)
      localStorage.currentPlayIndex = 0
      localStorage.currentPlayListId = ''

      this.playing = false
    },
    // 插入播放
    async insertPlay(value:any) {
      const index = this.playList.findIndex(item => item.id === value.id);
      value.like = this.hasLikeSong(value.id);
      // 未添加则插入
      if (index === -1) {
        this.playList.splice(
          this.currentPlayIndex+1, 0, value
        );
        const insertIndex = this.playList.findIndex((item:any) => item.id === value.id);
        localStorage.playList = JSON.stringify(this.playList);
        this.changePlayIndex(insertIndex);
      } else {
        this.changePlayIndex(index);
      }
    },
  }
})