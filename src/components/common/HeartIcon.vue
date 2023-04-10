<script lang="ts" setup>
 import { HeartOutline, Heart } from '@vicons/ionicons5'
 import { likeMusic } from '@/service'
 import { useMainStore } from '@/stores/main';
 export interface HeartIconExpose{
  triggerLike:() => any;
}

 const mainStore = useMainStore()

 type Props = {
  like: boolean,
  id: number,
  size?: number,
  triggerClick?: boolean,
  likeSuccess?: null | ((like:boolean) => void)
 }
 const props = withDefaults(defineProps<Props>(), {
  size: 20,
  triggerClick: false,
  likeSucess: null
 })
 const emit = defineEmits(['likeSuccess'])
 const triggerLike = () => {
  if (!mainStore.isLogin) {
    return window.$message.error('请先登录');
  }
  let like = !props.like
  likeMusic(props.id, like).then(res => {
    if (res.data.code !== 200) {
      return window.$message.error('喜欢音乐失败!');
    }
    if (like) {
      mainStore.addLikeList(props.id);
      window.$message.success('已添加到我喜欢的音乐');
    } else {
      mainStore.removeLikeList(props.id);
      window.$message.success('取消喜欢成功');
    }
    emit('likeSuccess', like);
    props.likeSuccess && props.likeSuccess(like);
    return null    
  })
 }
 const handleClick = () => {
  if (!props.triggerClick) {
    triggerLike()
  }
 }

 defineExpose({ triggerLike });
</script>

<template>
  <n-icon
    :size="size"
    :color="like ? 'pink' : undefined"
    class="cursor-pointer"
    @click="handleClick"
    :component="HeartOutline"
  />
</template>

<style scoped>
  
</style>