<script lang="ts" setup>
import { useMainStore } from '@/stores/main'
import { ref, watch } from 'vue'
import { getLoginStatus, getUserDetail, getUserInfo, logout, signIn } from '@/service'
import type { AnyObject } from 'env';
// import { useRouter } from 'vue-router';
import { onClickOutside } from '@vueuse/core'

import { ArrowForwardIosRound } from '@vicons/material'
import { UserProfile } from '@vicons/carbon'
import { ExitToAppRound } from '@vicons/material'

let mainStore = useMainStore()
// const router = useRouter()
const popoverContainerRef = ref()
const userDetail = ref<AnyObject>()
const showUserPopover = ref(false);
const signBtnLoading = ref(false);

// 监听登录状态 获取用户信息
watch(() => mainStore.isLogin, (val) => {
  if (val) {
    getUserProfile()
  }
})
// 获取用户账号数据
const getUserProfile = () => {
  // 如果已经设置过,则从store读取userId
  if (mainStore.userProfile?.userId) {
    getUserDetailInfo(mainStore.userProfile.profile.userId);    
  } else {
    getUserInfo().then(res => {
      getUserDetailInfo(res.data.profile.userId)
    })
  }
}
// 获取用户详情数据
const getUserDetailInfo = (uid:string) => {
  getUserDetail(uid).then((res) => {
    if(res?.data?.code === 200) {
      mainStore.userProfile = res.data
      localStorage.userProfile = JSON.stringify(res.data)
      userDetail.value = res.data
    }
  })
}
onClickOutside(popoverContainerRef, (event:MouseEvent) => {
  let target = event.target as HTMLElement
  // 如果点击的不是不是触发弹出选择的元素
  if (!target.classList.contains('trigger')) {
    showUserPopover.value = false;
  }   
})
const checkLoginStatus = () => {
  getLoginStatus().then(res => {
    if (res.data?.data?.code === 200) {
      if (!res.data.data.account) {
        window.$message.warning('登录状态过期,请重新登录');
        mainStore.userProfile = {};
        localStorage.clear();
        mainStore.isLogin = false;
      }
    }
  });
};
if (mainStore.isLogin) {
  getUserProfile();
  checkLoginStatus();
}
// 退出登陆
const handlePositiveClick = () => {
  window.$message.loading('退出登录中...', { duration: 0 });
  logout().then(res => {
    if (res.data.code === 200) {
      mainStore.isLogin = false;
      mainStore.userProfile = {};
      localStorage.isLogin = false;
      localStorage.clear();
      mainStore.removeAllLikeList();
      window.$message.destroyAll();
      window.$message.success('退出登录成功!');
    }
  });
};
// 签到
const handleSignInClick = () => {
  signBtnLoading.value = true
  signIn().then(() => {
    if (userDetail.value) {
      signBtnLoading.value = false
      userDetail.value.pcSign = true
      window.$message.success('签到成功')
    }
  }) 
}

// 编辑信息
const handleInfoEditClick = () => {
  
}
</script>

<template>
  <n-layout-header bordered class="flex justify-between items-center px-4 h-14 sm:px-3">
    <div class="flex">
      <span class=" truncate">仿网易云音乐Web网站</span>
      <LayoutHeaderSearch/>
    </div>
    <div class="flex items-center">
      <!-- 用户信息 -->
      <div v-if="mainStore.isLogin">
        <div v-if="mainStore.userProfile" class="flex items-center mr-2">
          <n-avatar round :size="30" :src="mainStore.userProfile?.profile?.avatarUrl"></n-avatar>
          <n-popover
            :show="showUserPopover"
            trigger="click" style="padding:0"
            display-directive="show"
          >
          <!-- 具名插槽 -->
            <template #trigger>
              <p
                class="pl-2 text-xs truncate opacity-80 hover:opacity-100 cursor-pointer w-30 trigger" 
                @click="() => (userDetail && (showUserPopover = !showUserPopover ))
                "
              >
                {{ mainStore.userProfile?.profile?.nickname }}
              </p>
            </template>
            <div ref="popoverContainerRef" style="width:300px">
              <div class="flex justify-evenly py-4">
                <div class="flex flex-col items-center">
                  <p class="text-lg font-bold">
                    {{ mainStore.userProfile?.profile.eventCount }}
                  </p>
                  动态
                </div>
                <div>
                  <p class="text-lg font-bold">
                    {{ mainStore.userProfile?.profile?.follows }}
                  </p>
                  关注
                </div>
                <div>
                  <p class="text-lg font-bold">
                    {{ mainStore.userProfile?.profile?.followeds }}
                  </p>
                  粉丝
                </div>
              </div>
              <div class="flex justify-center">
                <n-button
                  :loading="signBtnLoading" :disabled="mainStore.userProfile.pcSign" round
                  @click="handleSignInClick"
                >
                  {{ mainStore.userProfile.pcSign ? '已签到' :' 签到' }}
                </n-button>
              </div>
              <div class="mt-3 hover:bg-neutral-200/20 border-0 border-b border-gray-200  dark:border-gray-200/20 border-solid">
                <!-- 个人信息设置 -->
                <div class="flex justify-between items-center py-2 px-4 cursor-pointer" @click="handleInfoEditClick">
                  <div class="flex items-center text-base">
                    <n-icon :size="20" :component="UserProfile" />
                    <span class="ml-2">个人信息设置</span>
                  </div>
                  <n-icon :component="ArrowForwardIosRound" />
                </div>
              </div>
              <div class="hover:bg-neutral-200/20 border-0 border-b border-gray-200  dark:border-gray-200/20 border-solid">
                <n-popconfirm
                  @positive-click="handlePositiveClick"
                  positive-text="确认退出"
                  negative-text="取消"
                >
                  <template #trigger>
                    <!-- 个人信息设置 -->
                    <div class="flex justify-between items-center py-2 px-4 cursor-pointer">
                      <div class="flex items-center text-base">
                        <n-icon :size="20" :component="ExitToAppRound" />
                        <span class="ml-2">退出登录</span>
                      </div>
                      <n-icon :component="ArrowForwardIosRound" />
                    </div>
                  </template>
                  确认退出登录吗?
                </n-popconfirm>
              </div>
            </div>            
          </n-popover>
        </div>
        <!-- 用户详情加载骨架屏 -->
        <div v-else class="flex items-center mr-2">
          <n-skeleton width="30px" height="30px" round />
          <n-skeleton text style="width:100px;margin-left: 8px;" />
        </div>
      </div>
    </div>
  </n-layout-header>

</template>

<style scoped>
  
</style>