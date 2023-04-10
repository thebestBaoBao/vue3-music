<script lang="ts" setup>
import { mapSongs } from '@/utils/arr-map'
import { useMainStore } from '@/stores/main'
import { useDbClickPlay } from '@/hook/useDbClickPlay';
import { nanoid } from 'nanoid'
import { computed, ref } from 'vue'
import { useAsyncState, useElementHover } from '@vueuse/core'
import { formateSongsAuthor } from '@/utils'
import {
  getBanner,
  getNewSong,
  getPersonalized,
} from '@/service'
import { useMemoryScrollTop } from '@/hook/useMemoryScrollTop'
import LoadImg from '@/components/common/LoadImg.vue';

const mainStore = useMainStore()

// 处理轮播图相关
const hoverRef = ref()
const isHover = useElementHover(hoverRef)
// const currentIndex = ref(0)
const {
  state: banners,
  isLoading
} = useAsyncState(getBanner().then(res => res.data.banners), [])

// 推荐歌单
const {
  state: SongsList,
  isLoading: SongsListIsLoading 
} = useAsyncState(getPersonalized().then(res => res.data.result), [])

// 最新音乐
const {
  state: newSongList,
  isLoading: newSongListIsLoading 
} = useAsyncState(getNewSong().then(res => {
  return mainStore.mapSongListAddLike(mapSongs(res.data.result));
}), [])
const handleDbClick = useDbClickPlay()
const onlyId = nanoid()

// 处理滚动高度
useMemoryScrollTop('.n-layout-sider+.n-layout-content>.n-layout-scroll-container', 'discovery')
</script>

<template>
  <div class="p-6">
    <!-- banner -->
    <div v-if="isLoading" class="flex items-center mb-4">
      <n-skeleton width="20%" height="156px" :sharp="false"/>
      <n-skeleton width="60%" height="250px" :sharp="false"/>
      <n-skeleton width="20%" height="156px" :sharp="false"/>
    </div>
    <div v-else ref="hoverRef" class="mb-4">
      <n-carousel
        effect="card"
        :show-arrow="false"
        draggable
        :autoplay="!isHover"
        style="height: 250px"
        prev-slide-style="transform: translateX(-150%) translateZ(-600px); opacity:0.7"
        next-slide-style="transform: translateX(50%) translateZ(-600px); opacity:0.7"
      >
        <n-carousel-item
          v-for="item in banners"
          :key="item.imageUrl"
          :style="{ width: '60%'}"
        >
          <LoadImg
            loading-height="250px"
            :src="item.imageUrl"
            class-name="w-full h-full rounded cursor-pointer cover-banner"
          />
        </n-carousel-item>
      </n-carousel>
    </div>
    <!-- 推荐歌单 -->
    <p class="pb-4 text-xl">
      推荐歌单
    </p>
    <SongListSkeleton v-if="SongsListIsLoading"/>
    <SongList v-else :songs="SongsList"/>
    <!-- 最新音乐 -->
    <p class="py-4 text-xl">
      最新音乐
    </p>
    <n-grid
      v-if="newSongListIsLoading"
      cols="3 s:3 m:4 l:4 xl:4 2xl:5"
      responsive="screen"
      :x-gap="20"
      :y-gap="20"
    >
      <n-grid-item
        v-for="(item, index) in 40"
        :key="index"
      >
        <div class="flex justify-between h-16">
          <n-skeleton
            height="64px"
            width="64px"
            :sharp="false"
          />
          <div class="flex-1 ml-2">
            <n-skeleton
              text
              class="mt-2"
              :repeat="2"
              :sharp="false"
            />
          </div>
        </div>
      </n-grid-item>
    </n-grid>
    <n-grid
      v-else
      :x-gap="20"
      :y-gap="20"
      cols="3 s:3 m:4 l:4 xl:4 2xl:5"
      responsive="screen"
    >
      <n-grid-item
        v-for="(item, index) in newSongList"
        :key="item.id"
        class="hover:bg-zinc-300/60 rounded-md transition-colors cursor-pointer"
        @dblclick="handleDbClick(newSongList, onlyId, item, index)"
      >
        <div class="flex justify-between h-16">
          <div class="relative">
            <LoadImg
              loading-height="64px"
              class-name="w-16 h-16 rounded-md"
              :src="item.picUrl"
            />
            <PlayIcon
              :size="15"
              class="cursor-pointer position-center"
              style="opacity: 1;width: 25px;height: 25px;"
            />
          </div>
          <div class="flex-1 ml-2 truncate">
            <p class="mt-1 text-base">
              <n-ellipsis>{{ item.name }}</n-ellipsis>
            </p>
            <p class="mt-2 w-full text-sm opacity-60">
              <n-ellipsis>{{ formateSongsAuthor(item.song.artists) }}</n-ellipsis>
            </p>
          </div>
        </div>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<style scoped>
  
</style>