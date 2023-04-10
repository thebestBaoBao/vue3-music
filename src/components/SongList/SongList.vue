<script setup lang="ts">
import { formateNumber } from '@/utils';
import { Play } from '@vicons/carbon';
import { useRouter } from 'vue-router';

const router = useRouter();
defineProps<{
  songs?: any[]
}>();

</script>
<template>
  <div class="mb-4">
    <n-grid
      cols="2 s:3 m:5 l:5 xl:5 2xl:7"
      responsive="screen"
      :x-gap="12"
      :y-gap="8"
    >
      <n-grid-item
        v-for="(item) in songs"
        :key="item.id"
        class="group cursor-pointer"
      >
        <n-card
          footer-style="padding: 5px 10px"
          size="small"
        >
          <template #cover>
            <div class="relative" @click="router.push(`/songList/${item.id}`);">
              <LoadImg
                loading-height="12vw"
                class-name="w-full h-full"
                :src="item.picUrl || item.coverImgUrl"
              />
              <div
                class="flex absolute top-0 right-0 justify-end items-center p-1 w-full text-white card-mask"
              >
                <n-icon :component="Play" />
                <span class="pl-1">{{ formateNumber(item.playCount) }}</span>
              </div>
              <PlayIcon />
            </div>
          </template>
          <template #footer>
            <n-ellipsis>{{ item.name }}</n-ellipsis>
          </template>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<style scoped>
</style>
