<script lang="ts" setup>
import { search } from '@/service'
import { useMainStore } from '@/stores/main'
import { useAsyncState } from '@vueuse/core'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'
import { watch, reactive, ref, type CSSProperties, nextTick } from 'vue'
import { markSearchKeyword } from '@/utils/markSearhKeyword'
import { useNanoid } from '@/hook/useNanoid'
import MusicList from '@/components/SongList/MusicList.vue'
import { PlayCircleOutlined } from '@vicons/antd'
import { formateNumber } from '@/utils'

const mainStore = useMainStore()
const route = useRoute()
const router = useRouter()
const { set, currentId } = useNanoid()

const songListPageParams = reactive({
  pageCount: 0,
  page: 1,
  pageSize: 50
})
const playListPageParams = reactive({
  pageCount: 0,
  page: 1,
  pageSize: 30
})

let fetchSongId = 0
// 单曲
const { state: songsSearchResult, isLoading: songListIsLoading, execute: getSearchSongList } = useAsyncState(
  (val, id) => search(val).then(res => {
    // console.log(1, route.query.keyword)
    if (fetchSongId !== id) return

    let result = res.data.result
    res.data.result.songs = mainStore.mapSongListAddLike(result.songs);
    res.data.result.songs = markSearchKeyword(
      result.songs, ['name', 'formatAuthor', ['al', 'name']], route.query.keyword as string, 'pink'
    );
    songListPageParams.pageCount = Math.ceil(result.songCount / songListPageParams.pageSize) || 1;
    // console.log(2,res.data.result)
    return res.data.result    
  }), {}, { resetOnExecute: true, immediate: false }
)
let fetchListId = 0
// 歌单
const { state: playListSearchResult, isLoading: playListIsLoading, execute: getSearchPlayList } = useAsyncState(
  (val, id) => search(val).then(res => {
    if (fetchListId !== id) return

    let result = res.data.result;
    let keyword = route.query.keyword as string;
    res.data.result.playlists = markSearchKeyword(
      result.playlists, ['name', ['creator', 'nickname']], keyword, 'pink'
    );
    playListPageParams.pageCount = Math.ceil(result.playlistCount / playListPageParams.pageSize) || 1;
    return result;
  }), {}, { resetOnExecute: true, immediate: false }
)

const currentTabIndex = ref(0)
// 切换样式
const activeTabStyle:(index:number) => CSSProperties = (index:number) => {
  if (index === currentTabIndex.value) {
    return {
      color: 'pink',
      borderBottom: `2px solid pink`
    };
  } 
  return {};
}
// 处理喜欢emit事件
const handleUpdateMusicListLike = (like:boolean, index:number) => {
  songsSearchResult.value.songs[index].like = like;
}
// 监听---请求
// let immediateCall = false
watch([
  () => route.query, 
  () => songListPageParams.page, () => songListPageParams.pageSize,
  () => playListPageParams.page, () => playListPageParams.pageSize
], (newVal, oldVal) => {
  let songParams = {
    limit: songListPageParams.pageSize,
    keywords: route.query.keyword as string,
    type: '1',
    offset: (songListPageParams.page - 1) * songListPageParams.pageSize
  }
  let playListParams = {
    limit: playListPageParams.pageSize,
    keywords: route.query.keyword as string,
    type: '1000',
    offset: (playListPageParams.page - 1) * playListPageParams.pageSize
  }
  // console.log(newVal, oldVal)
  // 如果是路由跳转引起的变化则全部请求 (非空断言 !.)
  if (!oldVal[0] || oldVal[0]!.keyword !== newVal[0].keyword) {
    // console.log('--')
    getSearchSongList(0, songParams, ++fetchSongId)
    getSearchPlayList(0, playListParams, ++fetchListId)
    // 缓存？设置nanoidId --- 请求参数为key
    set(JSON.stringify(songParams))
  } else {
    if (currentTabIndex.value === 0) {
      getSearchSongList(0, songParams, ++fetchSongId)
      set(JSON.stringify(songParams))
    } else {
      getSearchPlayList(0, playListParams, ++fetchListId)
    }
  }
}, { immediate:true })
// 主动调用backtop
watch([playListPageParams, songListPageParams], () => {
  let backTopEle = document.querySelector('.n-back-top') as HTMLElement
  backTopEle && backTopEle.click()
})

</script>

<template>
  <div class="w-full">
    <h3 class="pl-8">
      搜索 {{ route.query.keyword }}
    </h3>
    <div class="flex px-8">
      <div
        :style="activeTabStyle(0)" 
        class="px-4  pb-2 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
        @click="currentTabIndex = 0"
      >
        单曲
      </div>
      <div
        :style="activeTabStyle(1)"
        class="px-4 pb-2 ml-4 hover:opacity-100 transition-opacity cursor-pointer" 
        @click="currentTabIndex = 1"
      >
        歌单
      </div>
      <div v-show="currentTabIndex === 0" class="ml-8 opacity-80">
        共找到<strong>{{ songsSearchResult.songCount }}</strong>首单曲
      </div>
      <div v-show="currentTabIndex === 1" class="ml-8 opacity-80">
        共找到<strong>{{ playListSearchResult.playlistCount }}</strong>个歌单
      </div>
    </div>
    <transition name="fade">
      <div v-show="currentTabIndex === 0" class="mx-8 my-4">
        <div class="flex item-center">
          <!-- <play-all-button v-show="songsSearchResult?.songs?.length" :song-list="songsSearchResult?.songs" :song-list-id="currentId" /> -->
          <!-- <p v-if="songsSearchResult.songCount" class="my-2 ml-4 opacity-50">
            共找到{{ songsSearchResult.songCount }}首单曲
          </p> -->
        </div>
        <div class="h-4" />
        <MusicList
          :song-list="songsSearchResult.songs" 
          :loading="songListIsLoading" :play-list-id="currentId" 
          @update-music-list-like="handleUpdateMusicListLike"
        />
        <!-- 分页 -->
        <div v-if="songListPageParams.pageCount > 1" class="flex justify-center mt-6">
          <n-pagination
            v-model:page="songListPageParams.page" 
            v-model:page-size="songListPageParams.pageSize" 
            :page-count="songListPageParams.pageCount" 
            show-size-picker
            :page-sizes="[10, 30, 50]"
          />
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-show="currentTabIndex === 1" style="margin-right:-5px">
        <n-spin :show="playListIsLoading" description="搜索中">
          <div v-show="playListIsLoading" class="h-80" />
          <!-- <p v-if="playListSearchResult.playlistCount" class="pl-8 mt-4 mb-2 opacity-50">
            共找到{{ playListSearchResult.playlistCount }}个歌单
          </p> -->
          <div
            v-for="(item) in playListSearchResult.playlists"
            :key="item.id" :class="'flex items-center py-4 px-8 cursor-pointer '" 
            @click="router.push(`/songList/${item.id}`)"
          >
            <LoadImg
              loading-height="64px"
              class-name="w-16 h-16 rounded-md"
              :src="item.coverImgUrl"
            />
            <n-ellipsis :tooltip="false" class="pl-2" style="width:400px">
              <p v-html="item.nameRichText" />
            </n-ellipsis>
            <p class="w-20 opacity-50">
              {{ item.trackCount }}首
            </p>
            <p class="w-80">
              <span class="opacity-50">by </span> 
              <span class="pl-2" v-html="item.creator.nicknameRichText" />
            </p>
            <p class="flex items-center w-80 opacity-50">
              <n-icon :component="PlayCircleOutlined" />
              <span class="pl-2"> {{ formateNumber(item.playCount) }}</span>
            </p>
          </div>
          <!-- 分页 -->
          <div v-if="playListPageParams.pageCount > 1" class="flex justify-center mt-6">
            <n-pagination
              v-model:page="playListPageParams.page" 
              v-model:page-size="playListPageParams.pageSize" 
              :page-count="playListPageParams.pageCount" 
              show-size-picker
              :page-sizes="[10, 30, 50]"
            />
          </div>
        </n-spin>
      </div>
    </transition>
  </div>
</template>

<style scoped>
  
</style>