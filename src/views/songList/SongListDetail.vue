<script lang="ts" setup>
import type { AnyObject } from 'env';
import { formateNumber, getArrLast } from '@/utils';
import { computed, reactive, ref, toRaw, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router'
import { StarOutline, Star, ShareSocialOutline, Search } from '@vicons/ionicons5'
import { Edit } from '@vicons/carbon'
import { useMainStore } from '@/stores/main'
import { useDialog } from 'naive-ui'
import { useCheckLogin } from '@/hook/useCheckLogin';
import { useMemorizeRequest } from '@/hook/useMemorizeRequest'
import { cloneDeep } from 'lodash';
import { markSearchKeyword } from '@/utils/markSearhKeyword'
import { getPlaylistAllDetail, getPlaylistDetail,  updatePlayListSubscribe, updatePlaylistTags } from '@/service'
import LoadImg from '@/components/common/LoadImg.vue';
import observer from '@/utils/observer';
import type MusicListVue from '@/components/SongList/MusicList.vue';

const router = useRouter();
const route = useRoute();
const mainStore = useMainStore()
// 使用请求缓存
const { wrapRequest: wrapFetchPlayList, requestLoading: isLoading, loadSuccess: loadPlayListSuccess, removeCache } = useMemorizeRequest(getPlaylistDetail, 'getPlaylistDetail');
const songListDetail = ref<AnyObject>()
// 获取歌单详情
const fetchSongListDetail = (id:string=route.params.id as string) => {
  // 本质上是在一个Promise.resolve()上不断添加then方法
  // promise 请求只执行一次 对于结果的处理then 执行多次
  wrapFetchPlayList(id).then((res: {data: {playlist: AnyObject}}) => {
    let creator = res.data.playlist?.creator
    if (res.data.playlist.name === (creator?.nickname +'喜欢的音乐') && creator.userId === mainStore.userProfile?.profile.userId) {
      res.data.playlist.isMyLike = true;
      res.data.playlist.name = '我喜欢的音乐';
    } else {
      res.data.playlist.isMyLike = false;
    }
    songListDetail.value = res.data.playlist;
    loadPlayListSuccess()
  })
}
const { wrapRequest, requestLoading, loadSuccess } = useMemorizeRequest(getPlaylistAllDetail, 'getPlaylistAllDetail')
const songList = ref<any[]>([]);
const rawSongList = ref<any[]>([])
let songListIndexMap = new Map()
// 获取歌曲列表信息
const fetchMusicList = (id:string=route.params.id as string) => {
  wrapRequest({ id }).then((res: { data: { code: number; songs: any[]; }; }) => {
    if (res?.data?.code === 200) {
      let data = mainStore.mapSongListAddLike(res.data.songs);
      rawSongList.value = cloneDeep(data);
      songList.value = data;
      rawSongList.value.forEach((item: any, index: number) => {
        songListIndexMap.set(item.id, index);
      });
      loadSuccess();
    }
  });
}
// 开启监听
const songListId = ref('')
watch(() => route.params, (val) => {
  const id = val.id as string
  songListId.value = id
  fetchSongListDetail(id)
  fetchMusicList(id)
}, {immediate: true})
// ？？
// watch(() => mainStore.likeSongs, (val, oldVal) => {
//   if (val.length !== oldVal.length) {
//     removeCache();
//   }
// })

// 收藏相关
const dialog = useDialog()
const subscribeBtnLoading = ref(false)
const handleSubscribeClick = (subscribed: boolean) => {
  useCheckLogin(() => {
    let params = {
      id: route.params.id as string,
      t: subscribed ? 2 : 1
    }
    if (params.t === 2) {
    dialog.warning({
      title: '警告',
      content: '确定不在收藏该歌单?',
      positiveText: '确定', 
      onPositiveClick: () => {
        subscribeBtnLoading.value = true;
        updatePlayListSubscribe(params).then((res) => {
          if (res.data.code === 200) {
            window.$message.success('取消收藏成功');
            (songListDetail.value as AnyObject).subscribed = false;
            (songListDetail.value as AnyObject).subscribedCount-=1;
            observer.emit('updateCollectPlayList', { subscribed: false, id: route.params.id });
          } else {
            window.$message.error('取消收藏失败');
          }
        })
          .finally(() => subscribeBtnLoading.value = false);
      } 
    });
  } else {
    subscribeBtnLoading.value = true;
    updatePlayListSubscribe(params).then((res) => {
      if (res.data.code === 200) {
        window.$message.success('收藏成功!');
        (songListDetail.value as AnyObject).subscribed = true;
        (songListDetail.value as AnyObject).subscribedCount+=1;
        observer.emit('updateCollectPlayList', { subscribed: true, songListDetail: toRaw(songListDetail.value) });
      } else {
        window.$message.error('收藏失败');
      }
    }) 
      .finally(() => subscribeBtnLoading.value = false);
  }
  })
}
const starButtonDisabled = computed(() => {
  // 当是自己创建的时，禁用收藏功能 
  return songListDetail.value && mainStore.userProfile &&
  songListDetail.value?.userId === mainStore.userProfile?.profile?.userId
})
// 分享
const handleShareClick = () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    window.$message.success('成功复制链接')
  })
}
// 处理喜欢
const handleUpdateMusicListLike = (like:boolean, index:number) => {
  let target = songList.value[index];
  // 更新元数据
  if (target.isSearch) {
    rawSongList.value[target.index].like = like;
  }
  songList.value[index].like = like;
}


const imageRef = ref()
const tabsValue = ref('musicList')
</script>

<template>
  <div class="p-8 pb-2">
    <n-spin :show="isLoading">
      <div v-if="songListDetail" class="flex justify-between">
        <LoadImg
          ref="imageRef"
          :has-hover-scale="false"
          class-name="w-52 h-52"
          :src="songListDetail.coverImgUrl "
          :preview-disabled="false"
        />
        <div class="flex-1 ml-8">
          <div class="flex items-center">
            <n-tag type="primary">
              歌单
            </n-tag>
            <p class="ml-4 text-2xl font-bold ">
              {{ songListDetail.name }}
            </p>
            <!-- <div class="ml-2" style="line-height:0" @click="toSongListEdit">
              <n-icon v-if="isMySongList" :size="20" :component="Edit" />
            </div> -->
          </div>
          <div class="mt-3 text-sm flex-items-center">
            <n-avatar round :size="30" :src="songListDetail.creator.avatarUrl" />
            <span class="pl-4 text-primary">{{ songListDetail.creator.nickname }}</span>
            <div class="ml-3 text-gray-600">
              <n-time :time="songListDetail.createTime" type="date" />
              <span>创建</span>
            </div>
          </div>
          <div class="mt-3">
            <n-space>
              <!-- <play-all-button :song-list="rawSongList" :song-list-id="songListId" /> -->
              <n-button
                size="medium" round
                :disabled="starButtonDisabled" :loading="subscribeBtnLoading"
                @click="handleSubscribeClick(songListDetail!.subscribed)"
              >
                <template #icon>
                  <n-icon :component="songListDetail.subscribed ? Star : StarOutline" />
                </template>
                {{ songListDetail.subscribed ? '已收藏' :' 收藏' }}
                ({{ formateNumber(songListDetail.subscribedCount) }})
              </n-button>
              <n-button size="medium" round @click="handleShareClick">
                <template #icon>
                  <n-icon :component="ShareSocialOutline" />
                </template>
                分享
                ({{ formateNumber(songListDetail.shareCount) }})
              </n-button>
            </n-space>
          </div>
          <div class="mt-3">
            <div v-if="!songListDetail.isMyLike">
              <span>标签</span>
              <span class="px-1">:</span>
              <span class="cursor-pointer text-primary"> {{ songListDetail.tags.join(' / ') }} </span>
              <span v-if="!songListDetail.tags.length" class="text-primary">无</span>
              <!-- <span
                v-if="isMySongList && !songListDetail.tags.length " 
                class="cursor-pointer text-primary" @click="() => selectSongListTagRef?.show()"
              > 添加标签</span> -->
            </div>
            <div class="flex">
              <div>
                <span>歌曲</span>
                <span class="px-1">:</span>
                {{ songListDetail.trackCount }}
              </div>
              <div class="ml-4">
                <span>热度</span>
                <span class="px-1">:</span>
                {{ formateNumber(songListDetail.playCount) }}
              </div>
            </div>
            <!-- <div v-if="isMySongList && !songListDetail.description && !songListDetail.isMyLike" class="flex">
              <span>简介</span>
              <span class="px-1">:</span>
              <span class="cursor-pointer text-primary" @click="toSongListEdit">添加简介</span>
            </div> -->
            <div v-if="songListDetail.description" class="flex">
              <n-ellipsis
                expand-trigger="click" line-clamp="1"
                :tooltip="false"
              >
                <span>简介</span>
                <span class="px-1">:</span>
                {{ songListDetail.description }}
              </n-ellipsis>
            </div>
          </div>
        </div>
      </div>
      <div v-else style="height:200px" />
      <div :value="tabsValue" class="mt-5">
        <div class="flex justify-between">
          <n-tabs type="line" :value="tabsValue">
            <n-tab name="musicList" @click="tabsValue = 'musicList'">
              歌曲列表
            </n-tab>
            <!-- <n-tab name="comment" @click="tabsValue = 'comment'">
              评论 <span class="pl-1 text-sm">({{ songListComment?.total }})</span>
            </n-tab> -->
          </n-tabs>
          <!-- <div class="w-60">
            <n-input
              v-model:value="searchKeyword"
              clearable
              size="small" placeholder="搜索歌单歌曲"
              round
            >
              <template #prefix>
                <n-icon class="cursor-pointer" :component="Search" />
              </template>
            </n-input>
          </div> -->
        </div>
        <div v-show="tabsValue === 'musicList'" class="my-5">
          <MusicList
            :song-list="songList" :raw-song-list="rawSongList"
            :loading="requestLoading" :play-list-id="songListId" @update-music-list-like="handleUpdateMusicListLike"
          />
        </div>
        <!-- <div v-show="tabsValue === 'comment'" class="mt-8">
          <div>
            <n-input
              v-model:value="commentValue" type="textarea" :maxlength="140"
              :show-count="true"
            />
            <div class="flex justify-end mt-5">
              <n-button round :loading="commentBtnLoading" @click="handleCommentClick">
                评论
              </n-button>
            </div> -->
            <!-- 精彩评论 -->
            <!-- <n-spin :show="isCommentLoading">
              <comment-list
                :type="2"
                :resource-id="+songListId" title="精彩评论" :list="songListComment.hotComments || []"
                @update-comment-list="updateCommentList"
                @update-comment-liked="(data:any) => updateCommentLiked(data,true)"
              /> -->
              <!-- 最新评论 -->
              <!-- <comment-list
                :resource-id="+songListId"
                :type="2"
                :comment-total-num="songListComment.total" title="最新评论" :list="songListComment.comments || []"
                @update-comment-list="updateCommentList"
                @update-comment-liked="(data:any) => updateCommentLiked(data,false)"
              />
            </n-spin>
            <p v-if="!songListComment.comments?.length" class="text-center opacity-50">
              还没有评论, 快来抢沙发~
            </p>
            <div v-if="pageParams.pageCount > 1" class="flex justify-end mt-6">
              <n-pagination
                v-model:page="pageParams.page" 
                v-model:page-size="pageParams.pageSize" 
                :page-count="pageParams.pageCount" 
                show-size-picker
                :page-sizes="[10, 20, 30, 40,50]"
              />
            </div>
          </div>
        </div> -->
      </div>
      <!-- 标签选择弹窗 -->
      <!-- <select-song-list-tag-modal
        ref="selectSongListTagRef"
        :handle-complete-click="handleCompleteClick" 
        :btn-loading="btnLoading"
      /> -->
    </n-spin>
  </div>
</template>

<style scoped>
  
</style>