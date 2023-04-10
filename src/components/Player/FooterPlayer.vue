<script lang="ts" setup>
import RandomIcon from '@/components/icon/RandomIcon.vue'
import {
  PauseCircleOutlineOutlined, LoopSharp, KeyboardDoubleArrowRightRound,
  SkipPreviousSharp, SkipNextSharp,
  PlayArrowSharp, VolumeUpRound,
  KeyboardArrowDownOutlined,
  VolumeOffRound, KeyboardArrowUpOutlined, AddBoxOutlined
} from '@vicons/material' 
import { List } from '@vicons/ionicons5'
import { formateSongsAuthor } from '@/utils'
import { useThemeVars } from 'naive-ui'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useMainStore } from '@/stores/main'
import type { PlayListExpose } from './PlayList.vue'
import { useElementHover } from '@vueuse/core';
import observer from '@/utils/observer';
import type { HeartIconExpose } from '../common/HeartIcon.vue';
import {useAudioLoadProgress} from '@/components/Player/hook/useAudioLoadProgress'
import dayjs from 'dayjs'


const mainStore = useMainStore()
const primaryColor = useThemeVars().value.primaryColor
const height = '50px'
const audioRef = ref<HTMLAudioElement>()
// 处理左侧上拉下拉逻辑
const triggerRef = ref()
const isHover = useElementHover(triggerRef)
const activeStyle = computed(() => {
  let style
  if (mainStore.showMusicDetail) {
    style = `translateY(-${height})`
  } else {
    style = 'translateY(0)'
  }
  return { transform: style }
})
// 点击箭头打开歌曲详情
const handleArrowClick = () => {
  // mainStore.toggleShowMusicDetail();
};

// 喜欢
const heardLikeRef = ref<HeartIconExpose>()
const handleLikeHeartClick = () => {
  heardLikeRef.value?.triggerLike();
}
const likeSuccess = (like:boolean) => {
  mainStore.updatePlayListLike(like);
};

// 处理音量
const volume = computed(() => mainStore.volume)
const handleVolumeChange = (val:number) => {
  mainStore.setVolume(val)
  audioRef.value!.volume = volume.value / 100
}
// 点击音量选择,切换静音
const handleVolumeClick = () => {
  if (volume.value === 0) {
    mainStore.setVolume(mainStore.lastVolume)
  } else {
    mainStore.setLastVolume()
    mainStore.setVolume(0)
  }
  audioRef.value!.volume = volume.value / 100
}
// 初始化音量
onMounted(() => {
  audioRef.value!.volume = volume.value / 100
})

// 播放列表
const playListRef = ref<PlayListExpose>()

// 处理上一首下一首
let isLoad = false;
// 点击切换上一首
const handlePrevClick = async () => {
  if (isLoad) return;
  isLoad = true;
  await mainStore.togglePrev();
  isLoad = false;
};
// 点击切换下一首
const handleNextClick = async () => {
  if (isLoad) return;
  isLoad = true;
  await mainStore.toggleNext();
  isLoad = false;
};
watch(() => mainStore.currentPlaySong, (val, oldVal) => {
  // mainStore.loadCurrentPrevAndNext(val)
  // 重新加载媒体资源
  // console.log('变化')
  if (oldVal && val && val.id !== oldVal.id) {
    audioRef.value?.load();
    resetState();
    tryPlay();    
  }
})
// onMounted(() => {
//   mainStore.loadCurrentPrevAndNext(mainStore.currentPlaySong)
// })

// 播放与暂停
const tryPlay = () => {
  if (audioRef.value && audioRef.value!.readyState >= 2 && audioRef.value?.paused) {
    audioRef.value?.play();
  }
  mainStore.changePlaying(true);
};
// 切换播放状态
const togglePlayStatus = async () => {
  if (audioRef.value?.paused) {
    tryPlay();
  } else {
    audioRef.value?.pause();
    mainStore.changePlaying(false);
  }
};
watch(() => mainStore.playing, (val) => {
  if (val) {
    tryPlay()
  } else {
    audioRef.value?.pause()
  }
})
// 媒体的第一帧加载完成 逻辑播放但事实暂停的情况下立即播放
const handleLoadeddata = () => {
  if (mainStore.playing && audioRef.value?.paused) {
    audioRef.value?.play();
  }
};
//处理数据还未加载完成时,播放暂停
const handleWaiting = () => {
  mainStore.playWaiting = true;
};
// 因为缺少数据而暂停或延迟的状态结束，播放准备开始
const handlePlaying = () => {
  mainStore.playWaiting = false;
};
// 点击空格播放
const handlePressSpace = (event: KeyboardEvent) => {
  event.preventDefault()
  if (mainStore.currentPlaySong && event.code === 'Space') {
    togglePlayStatus()
  }
}
onMounted(() => {
  document.body.addEventListener('keypress', handlePressSpace)
})
onUnmounted(() => {
  document.body.removeEventListener('keypress', handlePressSpace)
})

// 切换播放模式
const handlePlayModeClick = () => {
  const playMode = mainStore.playMode
  if (playMode === 'order') {
    mainStore.changePlayMode('singleLoop');
    window.$message.info('单曲循环');
  } else if (playMode === 'singleLoop') {
    mainStore.changePlayMode('random');
    window.$message.info('随机播放');    
  } else {
    mainStore.changePlayMode('order');
    window.$message.info('顺序播放');
  }
}
const currentPlayModeIcon = computed(() => {
  if (mainStore.playMode === 'order') {
    return KeyboardDoubleArrowRightRound
  } else if (mainStore.playMode === 'singleLoop') {
    return LoopSharp
  } else {
    return RandomIcon
  }
})

// 进度条相关
const progressWidth = 500;
// 进度条百分比
const percentage = ref(0);
// 当前播放时间
const currentPlayTime = ref('00 : 00');
// 缓冲
const { updateBuffer, progressValue } = useAudioLoadProgress(audioRef)
let triggerOriginalAudioTimeUpdate = true
// let slideValueChange = false

// 播放进度变化
const handleTimeupdate = (event:Event) => {
  if (triggerOriginalAudioTimeUpdate) {
    const target = event.target as HTMLAudioElement;
    updatePlayTime(target.currentTime);
  }
};
const updatePlayTime = async (time:number, triggerPlay=false) => {

  currentPlayTime.value = dayjs(time * 1000).format('mm : ss')
  if (audioRef.value?.duration) {
    percentage.value = Math.round(100 * time / audioRef.value.duration)
  }
  if (triggerPlay) {
    tryPlay()
    // ?
    // await nextTick();
    // if (audioRef.value) {
    //   audioRef.value!.currentTime = time;
    // }
  }
  // observer.emit('timeUpdate', Math.round(time))
}
const handleSliderChange = () => {
  // triggerOriginalAudioTimeUpdate = false;
  let currentTime = (mainStore.currentPlaySong?.dt * percentage.value) / 100;
  currentPlayTime.value = dayjs(currentTime).format('mm : ss');
  audioRef.value!.currentTime = currentTime / 1000;
}
watch(() => mainStore.playList, (val) => {
  if (val.length === 0) {
    percentage.value = 0
  }
})

// 重置
const resetState = () => {
  currentPlayTime.value = '00 : 00'
  percentage.value = 0
  progressValue.value = 0
  audioRef.value!.currentTime = 0
}

// 播放结束
const handleEnded = () => {
  if (mainStore.playMode === 'singleLoop') {
    audioRef.value!.currentTime = 0
    tryPlay()
  } else {
    mainStore.toggleNext()
  }
  // observer.emit('ended')
}

// 错误处理
const handleError = async () => {
  // 媒体资源过期,重新获取数据
  if (audioRef.value?.error!.code === 4 || audioRef.value?.error!.code === 2) {
    window.$message.warning('歌曲资源过期,准备尝试重新获取');
    if (isLoad) return;
    isLoad = true;
    const res = await mainStore.setMusicData({ data: mainStore.playList, id: mainStore.currentPlaySong.id, index: mainStore.currentPlayIndex });
    localStorage.playList = JSON.stringify(mainStore.playList);
    isLoad = false;
    // 重新加载资源
    if (res.success) {
      audioRef.value?.load();
      resetState();
      if (mainStore.playing) {
        audioRef.value?.play();
      }
    }
  }
};

// 处理显示
const isShow = computed(() => !!mainStore.playList.length)
const currentSong = computed(() => mainStore.currentPlaySong)

// 
</script>

<template>
  <div class="flex z-30 items-center p-2 footer-player">
    <div v-if="isShow" class="overflow-hidden w-60 h-full">
      <div :style="activeStyle" class="open-detail-control-wrap">
        <div class="flex items-center w-40 h-full">
          <div ref="triggerRef" class="relative" @click="handleArrowClick">
            <n-image
              class="w-12 h-12"
              :src="currentSong?.al?.picUrl"
              :preview-disabled="true"
              :style="{filter:isHover ? 'blur(1px)' : 'none'}"
            />
            <transition v-show="isHover" name="fade">
              <div class="absolute top-0 left-0 z-10 w-12  h-12 bg-black/60 flex-items-justify-center">
                <n-icon :component="KeyboardArrowUpOutlined" size="35" color="white" />
              </div>
            </transition>
          </div>
          <div class="ml-4">
            <p class="flex items-center text-base">
              <n-ellipsis style="max-width: 150px">
                {{ currentSong?.name }}
              </n-ellipsis>
              <HeartIcon
                :id="mainStore.currentPlaySong.id" class="ml-2" :like="mainStore.currentPlaySong.like"
                @like-success="likeSuccess"
              /> 
            </p>
            <n-ellipsis>
              <p>{{ formateSongsAuthor(currentSong?.ar || []) }}</p>
            </n-ellipsis>
          </div>
        </div>
        <div class="flex items-center h-full">
          <n-icon
            size="35" :component="KeyboardArrowDownOutlined" class="ml-4"
            @click="mainStore.setShowMusicDetail(false)"
          />
          <div class="ml-4">
            <div class="circleContainer" @click="handleLikeHeartClick">
              <HeartIcon
                :id="mainStore.currentPlaySong.id"
                ref="heardLikeRef" :like="mainStore.currentPlaySong.like"
                :size="25" :trigger-click="true" @like-success="likeSuccess"
              /> 
            </div>
          </div>
        </div>
      </div>
    </div>
    <div :style="{opacity:isShow ? '1' : '0.6'}" class="flex flex-col flex-1 items-center control">
      <!-- 遮盖 -->
      <div v-if="!isShow" class="absolute z-50 w-full footer-player" />
      <div style="width:300px" class="flex justify-between items-center">
        <n-icon
          class="custom-icon" :size="22" :component="currentPlayModeIcon"
          @click="handlePlayModeClick"
        />
        <n-icon
          class="prev custom-icon" :size="22" :component="SkipPreviousSharp"
          @click="handlePrevClick"
        />
        <div class="flex justify-center items-center w-8 h-8  bg-neutral-200/60 hover:bg-neutral-200 dark:bg-slate-100/20 dark:hover:bg-slate-100/40 rounded-full" @click="togglePlayStatus">
          <n-icon :size="mainStore.playing ? 14 : 20" :component="mainStore.playing ? PauseCircleOutlineOutlined :PlayArrowSharp" />
        </div>
        <n-icon
          class="next custom-icon" :size="22" :component="SkipNextSharp"
          @click="handleNextClick"
        />
      </div>
      <div class="flex items-center mt-1">
        <span v-if="isShow" class="mr-2 text-xs opacity-50">{{ currentPlayTime }}</span>
        <div class="flex flex-1 items-center" :style="{width:progressWidth+'px'}">
          <!-- <slider-bar
            v-model="percentage"
            :load-value="progressValue"
            @on-done="handleSliderDone"
            @change="handleSliderChange"
          /> -->
          <n-slider
            v-model:value="percentage"
            @update:value="handleSliderChange"
          />
        </div>
        <span v-if="isShow" class="ml-2 text-xs opacity-50">
          <n-time format="mm : ss" :time="currentSong?.dt" />
        </span>
      </div>
    </div>
    <div v-if="isShow" class="flex justify-end items-center w-60">
      <n-popover
        placement="bottom"
        trigger="hover"
      >
        <template #trigger>
          <n-icon
            :component="volume === 0 ? VolumeOffRound : VolumeUpRound" :size="25" class="mr-2 custom-icon"
            @click="handleVolumeClick"
          />
        </template>
        <n-slider
          :value="volume" vertical style="height:100px"
          @update-value="handleVolumeChange"
        />
      </n-popover>
      <n-icon
        :component="List" :size="25" class="mr-2 custom-icon"
        @click="playListRef?.show()"
      />
    </div>
    <audio
      ref="audioRef"
      :src="currentSong?.url"
      preload="auto" @timeupdate="handleTimeupdate" @ended="handleEnded"
      @playing="handlePlaying" @progress="updateBuffer" @loadeddata="handleLoadeddata"
      @error="handleError" @waiting="handleWaiting" 
    />
    <PlayList ref="playListRef" />
    <!-- <music-detail v-if="mainStore.currentPlaySong?.id" ref="musicDetailRef" /> -->
    <!-- <subscribe-play-list-modal v-if="mainStore.currentPlaySong?.id" ref="subscribeModalRef" :tracks="mainStore.currentPlaySong?.id" /> -->
  </div>
</template>

<style scoped>
.footer-player{
  height: 62px;
  box-sizing: border-box;
}  
:deep(.n-icon){
  cursor: pointer;
}
:deep(.custom-icon:hover){
  color: v-bind(primaryColor);
}
.open-detail-control-wrap{
  transition: transform .6s ease;
}
</style>