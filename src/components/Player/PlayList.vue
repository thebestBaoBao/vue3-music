<script lang="ts" setup>
import { useDbClickPlay } from '@/hook/useDbClickPlay';
import { useMainStore } from '@/stores/main';
import { formateSongsAuthor } from '@/utils';
import { VolumeMuteFilled, VolumeUpFilled } from '@vicons/material';
import { ref } from 'vue';

export interface PlayListExpose{
  show: () => void
}

const mainStore = useMainStore()

const active = ref(false)
defineExpose({
  show() {
    active.value = true
  }
})

const handleDoubleClick = useDbClickPlay()

// 清空播放列表
const handleResetClick = () => {
  mainStore.resetPlayList()
}
</script>

<template>
  <n-drawer
    v-model:show="active"
    :width="500"
    placement="right"
    :auto-focus="false"
  >
    <n-drawer-content>
      <!-- 头 -->
      <template #header>
        <div class="flex justify-between items-center" style="width: 440px" >
          <span class="text-sm opacity-80">共 {{ mainStore.playList.length }} 首</span>
          <n-button type="primary" text @click="handleResetClick">清空列表</n-button>
        </div>
      </template>
      <n-empty v-if="mainStore.playList.length === 0" class="mt-20" description="当前播放列表为空"/>
      <n-space vertical v-else>
        <n-table striped>
          <tbody>
            <tr 
              v-for="(item, index) in mainStore.playList"
              :key="item.id"
              class="flex justify-between text-sm item"
              @dblclick="handleDoubleClick(mainStore.playList, mainStore.currentPlayListId, item, index)"
            >
              <td class="flex flex-1 items-center pr-2">
                <n-icon
                  v-if="mainStore.currentPlayIndex === index"
                  class="pr-1"
                  :color="mainStore.playing ? 'pink' : 'black'"
                  :component="mainStore.playing ? VolumeUpFilled : VolumeMuteFilled"
                />
                <n-ellipsis style="max-width: 160px">
                  {{ item.name }}
                </n-ellipsis>
                <n-tag
                  v-if="item.mv !== 0"
                  size="small" style="color: pink;" class="ml-2"
                >
                  MV
                </n-tag>
                <n-tag
                  v-if="item.fee === 1"
                  size="small" style="color: pink;" class="ml-2"
                >
                  VIP
                </n-tag>
              </td>
              <td class="w-24 truncate">
                {{ formateSongsAuthor(item?.ar || []) }}
              </td>
              <td>
                <n-time 
                  format="mm:ss" :time="item?.dt"
                  class="pl-4 opacity-60"
                />
              </td>
            </tr>
          </tbody>
        </n-table>
      </n-space>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped>
  
</style>