<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
export interface ListLoadingProps {
  wrapHeight?: string;
  show?:boolean;
  description?:string;
  size?: 'small' | 'medium' | 'large';
  loadMore?:(loadSuccess:() => void) => void;
  noMore:boolean,
}
const props = withDefaults(defineProps<ListLoadingProps>(), {
  wrapHeight: '30px',
  show: true,
  size: 'medium',
  description: '',
  loadMore: () => {}
});
const loadingTarget = ref<HTMLElement | null>(null);
let loadStatus:'pending' | 'loading' | 'done' = 'pending';// 当前加载状态锁
let firstVisible = ref<boolean | undefined>(); // 首次显示的值

let observerCallback = (entries:IntersectionObserverEntry[]) => {
  console.log('-',entries[0].isIntersecting)
  // 没有更多数据加载 打断!
  if (props.noMore) {
    loadingTarget.value && observer.disconnect();
    return; 
  }
  let visible = entries[0].isIntersecting;
  // 开始时自动执行一次
  if (firstVisible.value === undefined) {
    firstVisible.value = visible;
  }

  if (firstVisible.value === false) {
    if (visible) {
      // 当前正在load,打断!
      if (loadStatus === 'loading') return;
      loadStatus = 'loading';
      props.loadMore(() => {
        loadStatus = 'done';
      });
    }
  }
};
const observer = new IntersectionObserver(observerCallback);

onMounted(() => {
  loadingTarget.value && observer.observe(loadingTarget.value);
});
onUnmounted(() => {
  loadingTarget.value && observer.disconnect();
});
</script>
<template>
  <div
    v-if="!noMore" ref="loadingTarget"
    class="wrapLoading"
    :style="{display: firstVisible ? 'none' :'flex',height: wrapHeight}"
  >
    <n-spin
       :show="show" 
       :description="description" :size="size"
    />
  </div>
  <n-divider v-else dashed>
    没有更多内容了
  </n-divider>
</template>
<style scoped>
.wrapLoading {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
