<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue';
import { userHistory } from '../hook/useHistoryRoutePath'; 
import { useMainStore } from '@/stores/main';
import { ArrowBackIosSharp, ArrowForwardIosRound } from '@vicons/material'
import { useAsyncState, onClickOutside } from '@vueuse/core'
import { getDefaultSearchKeyword, getHotSearchList, getSuggestSearchList, getAlbumDetail } from '@/service'
import { useRouter } from 'vue-router';
import { Search, List } from '@vicons/ionicons5';
import { Delete, Music } from '@vicons/carbon';
import { mapSongs } from '@/utils/arr-map';
import { markSearchKeyword } from '@/utils/markSearhKeyword';
import { nanoid } from 'nanoid';
import { debounce } from 'lodash';

const mainStore = useMainStore()

// 处理历史记录
const { backPath, forwardPath } = userHistory()
const arrowIconClass = (value: string) => {
  return value
    ? 'opacity-100 cursor-pointer'
    : 'opacity-50';
};
const handleArrowClick = (type: 'back' | 'forward') => {
  if (type === 'back' && backPath.value) {
    history.back();
    mainStore.setShowMusicDetail(false);
  }
  if (type === 'forward' && forwardPath.value) {
    history.forward();
    mainStore.setShowMusicDetail(false);
  }
};
// 点击取消
const container = ref()
onClickOutside(container, () => {
  showPopover.value = false
})
// 回车事件
const handleKeyDown = (e:KeyboardEvent) => {
  if ((showPopover.value || document.hasFocus()) && e.code === 'Enter') {
    toSearchResult();
  }
}
onMounted(() => {
  document.body.addEventListener('keydown', handleKeyDown)
})
onUnmounted(() => {
  document.body.removeEventListener('keydown', handleKeyDown)
})
// 处理输入框（搜索）默认
const inputRef = ref()
const target = ref()
const showPopover = ref(false)
const { state: defaultSearchKeyWord } = useAsyncState(getDefaultSearchKeyword().then(res => res.data.data), {})
const router = useRouter()
const toSearchResult = (val?:string) => {
  // 处理历史数据跳转来的
  if (!mainStore.searchKeyword && defaultSearchKeyWord.value?.realkeyword){
    mainStore.searchKeyword = defaultSearchKeyWord.value.realkeyword
  }
  if (val) {
    mainStore.searchKeyword = val
  }
  mainStore.addSearchHistory(mainStore.searchKeyword);
  showPopover.value = false;
  mainStore.setShowMusicDetail(false);
  router.push({
    path: '/searchResult',
    query: {
      keyword: mainStore.searchKeyword
    }
  })
}

// 搜索框相关
const searchWrapContainerRef = ref();
const historyListRef = ref<HTMLElement>()
const containerStyle = computed(() => {
  let hasLen = mainStore.searchKeyword.length > 0;
  let style:CSSProperties = {
    background: 'white', zIndex: 1000, width: hasLen
      ? '420px '
      : '384px'
  };
  if (hasLen) {
    style = {
      ...style,
      transition: 'width ease-in-out 0.3s'
    };
  }
  return style;
})

// 处理搜索建议
const fetchId = ref(0)
const { state: suggestResult, isLoading: suggestLoading, execute } = useAsyncState(
  (val) => getSuggestSearchList(val).then(async res => {
    // 采取忽略的方法实现顺序得到结果
    // console.log(id, fetchId.value)
    // if (id !== fetchId.value) return {}

    let result = res.data.result;
    // let primaryColor = themeVars.value.primaryColor;
    res.data.result.songs = mapSongs(res.data.result.songs);
    res.data.result.songs = markSearchKeyword(
      result.songs, ['name', 'formatAuthor', 'alias'], mainStore.searchKeyword, 'pink'
    );
    res.data.result.playlists = markSearchKeyword(
      result.playlists || [], ['name'], mainStore.searchKeyword, 'pink'
    );
    return res.data.result;
  }), {}, { resetOnExecute: false, immediate: false }
);
const getSearchSuggest = (val:string, oldVal:string) => {
  if (val === oldVal) return
  suggestResult.value = {}
  // fetchId.value += 1
  // const id = fetchId.value
  execute(0, val)
}
// 使用防抖减少关键字请求频率
watch(() => mainStore.searchKeyword, debounce(getSearchSuggest, 500))
const handleSearchSongClick = async(song:any) => {
  if (!song.al.picUrl) {
    const detail = await getAlbumDetail(song.al.id);
    song.al.picUrl = detail.data.album.picUrl;
  }
  song.like = mainStore.hasLikeSong(song.id);
  if (mainStore.playList.length) {
    mainStore.insertPlay(song);
  } else {
    mainStore.initPlayList(
      [song], 0, nanoid()
    );
  }
  showPopover.value = false;
}
const handleSearchPlayListClick = (id:string) => {
  router.push(`/songList/${id}`)
  showPopover.value = false
}


// 历史数据
const defaultHeight = ref('100%')
const historyListStyle = computed<CSSProperties>(() => {
  return {
    height: defaultHeight.value
      ? parseInt(defaultHeight.value) >= 62
        ? '62px'
        : '100%'
      :'100%', overflow: 'visible' 
  }
})
const handleClearClick = (e:MouseEvent, index:number) => {
  e.stopPropagation()
  mainStore.removeSearchHistory(index)
}
// watch(showPopover, async (val) => {
//   if (val && defaultHeight.value === '100%') {
//     await nextTick();
//     if (!historyListRef.value?.children[0]) return;
//     defaultHeight.value = historyListRef!.value!.children[0]!.clientHeight + 'px';
//   }
// })

// 热搜
const { state: hotSearch, isLoading: hotSearchLoading } = useAsyncState(getHotSearchList().then(res => res.data.data), {})


</script>

<template>
  <div class="flex items-center ml-8">
    <div ref="backIconRef" class="text-base" @click="handleArrowClick('back')">
      <n-icon :class="[arrowIconClass(backPath)]" :component="ArrowBackIosSharp" />
    </div>
    <div ref="forwardIconRef" class="ml-2 text-base" @click="handleArrowClick('forward')">
      <n-icon :class="[arrowIconClass(forwardPath)]" :component="ArrowForwardIosRound" />
    </div>
  </div>
  <div class="relative w-50" ref="container">
    <div ref="inputRef" class="wrapInput">
      <n-input
        ref="target" v-model:value="mainStore.searchKeyword" size="small"
        class="ml-5 headerSearchInput" round :placeholder="defaultSearchKeyWord.showKeyword"
        clearable @focus="showPopover = true"
      >
        <template #prefix>
          <n-icon class="cursor-pointer" :component="Search" @click="() => toSearchResult()" />
        </template>
      </n-input>
    </div>
    <transition name="fade-in-scale-up">
      <div 
        v-show="showPopover" 
        ref="searchWrapContainerRef"
        class="absolute top-10 rounded-sm shadow-lg dark:shadow-black/60 origin-top-left searchWrapContainer"
        :style="containerStyle"
      >
        <n-scrollbar style="max-height:500px">
          <!-- 搜索历史 -->
          <div v-show="mainStore.searchHistory.length && !mainStore.searchKeyword.length" class="p-4 pb-0">
            <div class="flex justify-between items-center opacity-70">
              <div>
                <span class="pr-2">搜索历史</span>
                <n-popconfirm :on-positive-click="() => mainStore.clearSearchHistory()" positive-text="确定">
                  <template #trigger>
                    <n-icon class="cursor-pointer" :component="Delete" />
                  </template>
                  确定删除历史记录?
                </n-popconfirm>
              </div>
              <!-- <n-button v-if="parseInt(defaultHeight) > 62" text @click="handleCheckAllClick">
                {{ spread ? '收起' :'查看全部' }}
              </n-button> -->
            </div>
            <div ref="historyListRef" class="mt-2 transition-height" :style="historyListStyle">
              <n-space>
                <n-tag
                  v-for="(item,index) in mainStore.searchHistory"
                  :key="item"
                  closable size="small"
                  round
                  @click="toSearchResult(item)"
                  @close="(e:MouseEvent) => handleClearClick(e,index)"
                >
                  {{ item }}
                </n-tag>
              </n-space>
            </div>
          </div>
          <!-- 热搜榜 -->
          <div v-show="!mainStore.searchKeyword.length">
            <p class="pl-4 mt-4 opacity-70">
              热搜榜
            </p>
            <n-spin :show="hotSearchLoading">
              <template #description>
                努力加载中......
              </template>
              <div v-show="hotSearchLoading" class="h-60" />
              <div 
                v-for="(item,index) in hotSearch" 
                :key="item.searchWord" class="flex items-center p-5 hover:bg-gray-100 dark:hover:bg-gray-100/20 cursor-pointer"
                @click="toSearchResult(item.searchWord)"
              >
                <span
                  class="text-base"
                  :style="{color:index >= 0 && index <= 2 ? 'pink' : 'black'}"
                >
                  {{ index+1 }}
                </span>
                <div class="ml-4">
                  <span :style="{fontWeight:index >= 0 && index <= 2 ?'bold' :'initial'}"> {{ item.searchWord }}</span>
                  <span class="pl-2 text-sm opacity-40">{{ item.score }}</span>
                </div>
              </div>
            </n-spin>
          </div>
          <!-- 搜索建议 -->
          <div v-show="mainStore.searchKeyword.length > 0" class="py-4">
            <n-spin :show="suggestLoading" size="small" description="搜索中...">
              <div v-show="suggestLoading" class="h-80" />
              <div>
                <p v-show="!suggestLoading && suggestResult.songs" class="flex items-center pl-4 text-base opacity-50">
                  <n-icon :component="Music" />
                  <span class="ml-2">单曲</span>
                </p>
                <div
                  v-for="item in suggestResult.songs" 
                  :key="item.id"
                  class="py-2 pl-10 cursor-pointer base-hover-bg"
                  @click="handleSearchSongClick(item)"
                >
                  <span v-html="item.nameRichText" />
                  <span v-if="item.alias[0]" class="opacity-50">
                    （<span v-html="item.alias[0]" />）
                  </span>
                  <span> - </span>
                  <span v-html="item.formatAuthorRichText" />
                </div>
                <p v-show="!suggestLoading && suggestResult.playlists?.length > 0" class="flex items-center pl-4 text-base opacity-50">
                  <n-icon :component="List" />
                  <span class="ml-2">歌单</span>
                </p>
                <div
                  v-for="item in suggestResult.playlists" 
                  :key="item.id"
                  class="py-2 pl-10 cursor-pointer base-hover-bg"
                  @click="handleSearchPlayListClick(item.id)"
                  v-html="item.nameRichText"
                />
                <n-empty v-show="mainStore.searchKeyword.length > 0 && Object.keys(suggestResult).length === 0 && !suggestLoading" description="没有搜索建议" />
              </div>
            </n-spin>
          </div>
        </n-scrollbar>
      </div>
    </transition>
  </div>
</template>

<style scoped>
  
</style>