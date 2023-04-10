<script lang="ts" setup>
import { useMemoryScrollTop } from '@/hook/useMemoryScrollTop';
import { getTopPlayList, getTopPlayListTags } from '@/service';
import { getArrLast } from '@/utils';
import { useAsyncState } from '@vueuse/core'; 
import { computed, nextTick, onBeforeMount, ref, watch } from 'vue';

const {
  state: songsTags,
  isLoading: songsTagsIsLoading
} = useAsyncState(getTopPlayListTags().then(res => {
  // 初始化歌单
  songList.value.length = res.data.tags.length + 1
  // !!! fill 是 浅拷贝
  // songList.value = songList.value.fill({
  //   list: [],
  //   loading: true,
  //   noMore: false
  // })
  for(let i=0; i<songList.value.length; i++) {
    songList.value[i] = {
      list: [],
      loading: true,
      noMore: false
    }
  }
  fetchSongList()
  return [{ name: '全部' }].concat(res.data.tags)
}), []) 
const selectValue = ref('全部')
const selectIndex = ref(0)
type SongList = {
  list: any[]
  loading: boolean
  noMore: boolean
}
const songList = ref<SongList[]>([])
const currentSongList = computed(() => songList.value[selectIndex.value])

// 获取歌单数据
const fetchSongList = (successCallback?: (() => any)) => {
  getTopPlayList({ cat: selectValue.value, limit: 30 }).then(res => {
    const playlists = res.data.playlists;
    // console.log(playlists)
    if (playlists.length !== 0) {
      songList.value[selectIndex.value].list = res.data.playlists;
    }
    successCallback && successCallback();
    songList.value[selectIndex.value].noMore = !res.data.more;
    songList.value[selectIndex.value].loading = false;    
  })
}
// 加载更多的歌单
const loadMore = (successCallback: any) => {
  const params = {
    cat: selectValue.value,
    limit: 20,
    before: getArrLast(songList.value[selectIndex.value].list).updateTime
  }
  getTopPlayList(params).then(res => {
    const playlists = res.data.playlists;
    if (playlists.length !== 0) {
      songList.value[selectIndex.value].list.push(...playlists);
    }
    songList.value[selectIndex.value].noMore = !res.data.more;
    successCallback && successCallback()
  })
}
// 处理切换事件
const handleTagClick = (event: Event) => {
  const target = event.target as HTMLElement
  if (target.dataset.idx !== undefined) {
    // console.log(target.dataset.idx)
    selectIndex.value = +target.dataset.idx
    if (!currentSongList.value) {
      fetchSongList()
    }
  }
}
// 监听切换
watch(() => selectIndex.value, () => {
  selectValue.value = songsTags.value[selectIndex.value].name
  // console.log(songList.value)
  // console.log(selectIndex.value, selectValue.value, currentSongList.value.list.length, songList.value[selectIndex.value].list.length)
  if (currentSongList.value.list.length === 0) {
      fetchSongList()
  }  
})
// onBeforeMount(() => {
//   // 默认
//   fetchSongList('全部')
// })

// 设置滚动高度
useMemoryScrollTop('.n-layout-sider+.n-layout-content>.n-layout-scroll-container', 'songList')
</script>

<template>
  <div>
    <n-card bordered hoverable size="large" class="my-4" style="margin: 20px; box-sizing: border-box; width: auto;">
      <div v-if="songsTagsIsLoading">
        <n-skeleton height="126px"/>
      </div>
      <div v-else class="flex flex-wrap items-center">
        <!-- <n-space> -->
          <!-- <n-tabs v-modal:value="selectValue">
            <n-tab v-for="(tab) in songsTags" :key="tab.name" :name="tab.name">
              {{ tab.name }}
            </n-tab>
        </n-tabs> -->
          <n-tag v-for="(tab, index) in songsTags" :data-idx="index" :key="tab.name" checkable
            :checked="selectIndex === index" bordered round size="large" strong 
            @click="selectIndex = index" class="mr-2 p-2 mb-2">
            {{ tab.name }}
          </n-tag>
        <!-- </n-space> -->
      </div>
    </n-card>
    <n-card bordered hoverable size="large" class="mx-4" style="margin: 20px; box-sizing: border-box; width: auto;">
      <SongListSkeleton v-if="currentSongList ? currentSongList.loading : true" />
      <div v-else class="mt-4">
        <SongList :songs="currentSongList.list" />
        <ListLoading 
          v-if="currentSongList.list.length > 15" :no-more="currentSongList.noMore" 
          :load-more="loadMore" description="加载中"/>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
:deep(.n-card__content) {
  box-sizing: border-box;
  /* padding: 0; */
}
</style>