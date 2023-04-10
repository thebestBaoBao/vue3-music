<script lang="tsx" setup>
import { useMainStore } from '@/stores/main';
import { BackToTop, Music, User } from '@vicons/carbon'
import { QueueMusicFilled } from '@vicons/material'
import { SparklesOutline, StarOutline, Heart , List } from '@vicons/ionicons5'
import { onMounted, ref, watch, type VNodeChild, KeepAlive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useLoadingBar, NIcon } from 'naive-ui';
import LoginModal, { type LoginModalExpose } from './LoginModal.vue'
import { getLikeList, getUserPlaylist } from '@/service'
import { registerRouteHook } from '@/router'
import observer from '@/utils/observer'

const mainStore = useMainStore()
const route = useRoute()
const router = useRouter()
const loadingBar = useLoadingBar()

type MySongsList = { myCreatePlayList:any[], collectPlayList:any[] }
type MenuOptionItem = {
  label: string | (() => VNodeChild),
  key: string,
  icon?: () => VNodeChild,
  children?: childrenMenuOptionItem[]
}
interface childrenMenuOptionItem extends MenuOptionItem{
  id: number
}
const noLoginOption = {
  label: () => <div class="flex items-center" onClick={handleOpenLoginModalClick}> 
    <p >未登录</p>
  </div>,
  key: 'login',
  icon: () => <NIcon class="mr-1" size={20} component={User} onClick={handleOpenLoginModalClick}/>
}
const menuOptions = [
  {
    label: () => <RouterLink to="/discovery">发现音乐</RouterLink>,
    key: '/discovery',
    icon: () => <NIcon component={SparklesOutline}/>
  },
  {
    label: () => <RouterLink to="/songList">推荐歌单</RouterLink>,
    key: '/songList',
    icon: () => <NIcon component={List}/>
  },
  {
    label: () => <RouterLink to="/latestMusic">最新音乐</RouterLink>,
    key: '/latestMusic',
    icon: () => <NIcon component={Music}/>
  }
]
const collapsed = ref(false)
const myMenuOptions = ref<MenuOptionItem[]>(menuOptions)
const loginModalRef = ref<LoginModalExpose>()
// 高度
// const mainHeight = "70vh"
// 处理登陆的个人歌单（创建与收藏）
const changeMenuOption = (myCreatePlayList:any[]=[], collectPlayList:any[]=[]) => {
  if (!mainStore.isLogin) {
    myMenuOptions.value.unshift(noLoginOption);
  } else {
    myMenuOptions.value.unshift({
      label: '我创建的歌单',
      key: 'create',
      icon: () => <NIcon class="mr-1" size={20} component={User} />,
      children: myCreatePlayList.map((item:any, index:number) => {
        return {
          label: () => <span onClick={() => handlePlayListItemClick(item)}>{item.name}</span>,
          key: item.name,
          icon: () => <NIcon size={20} component={index === 0
            ? Heart
            : QueueMusicFilled}></NIcon>,
          id: item.id
        };
      })
    },
    {
      label: '收藏的歌单',
      key: 'collect',
      icon: () => <NIcon  class="mr-1" component={StarOutline} />,
      children: collectPlayList.map((item:any) => {
        return {
          label: () => <span onClick={() => handlePlayListItemClick(item)}>{item.name}</span>,
          key: item.name,
          icon: () => <NIcon size={20} component={QueueMusicFilled}></NIcon>,
          id: item.id
        };
      })
    });
  }
};
// 触发登陆
const handleOpenLoginModalClick = () => {
  loginModalRef.value?.show()
}
// 分类 (根据creator.userId)
const classifySongsList = (userId:number, playList:any[]) => {
  return playList.reduce((
    prev, currentValue, index
  ) => {
    if (index === 0) currentValue.name = '我喜欢的音乐';
    if (currentValue.creator.userId === userId) {
      prev.myCreatePlayList.push(currentValue);
    } else {
      prev.collectPlayList.push(currentValue);
    }
    return prev;
  }, { myCreatePlayList: [], collectPlayList: [] }) as MySongsList;
};
// 获取歌单
const fetchUserPlaylist = (userId:number) => {
  getUserPlaylist(userId).then((res) => {
    if (res.data.code === 200) {
      const { myCreatePlayList, collectPlayList } = classifySongsList(userId, res.data.playlist)
      changeMenuOption(myCreatePlayList, collectPlayList)
      mainStore.setMySubscribeSongList(myCreatePlayList)
    }
  })
}
// 获取“喜欢的音乐”
const fetchMyLikeMusicList = (userId:number) => {
  getLikeList(userId).then(res => {
    mainStore.setLikeList(res.data.ids);
  });
}
// 监听登陆变化
watch(() => mainStore.isLogin, (val) => {
  // console.log('3',val)
  if (val) {
    myMenuOptions.value.shift()
  } else {
    myMenuOptions.value.shift()
    myMenuOptions.value.shift()
  }
})
// 监听用户信息变化(不要主动立即调用初始化菜单)
watch(() => mainStore.userProfile, () => {
  const userId = mainStore.userProfile?.profile?.userId
  if(userId) {
    // console.log('1',val)
    fetchUserPlaylist(userId);
    fetchMyLikeMusicList(userId);
  } else if (!mainStore.isLogin) {
    // console.log('2')
    changeMenuOption()
  }
},)
if (!mainStore.isLogin) {
  changeMenuOption()
}

// 处理路由相关
const activeKey = ref<string>('')
watch(() => route.path, (newV) => {
  // console.log(newV)
  activeKey.value = newV
})
const handlePlayListItemClick = (item:any) => {
  router.push(`/songList/${item.id}`);
}
registerRouteHook((to) => {
  if (to.meta.auth && !mainStore.isLogin) {
    window.$message.error('请先登录');
    return false;
  } else {
    loadingBar.start();
    return true;
  }
  
}, () => {
  // 实现切换路由自动调用backtop
  // let backTopEle = document.querySelector('.n-back-top') as HTMLElement
  // backTopEle && backTopEle.click()
  loadingBar.finish();
})

//监听歌单收藏状态
observer.on('updateCollectPlayList', (data:any) => {
    let { subscribed } = data;
    // console.log(1)
    // 收藏 添加歌单
    if (subscribed) {
      let songListDetail = data.songListDetail;
      myMenuOptions.value[1].children?.unshift({
        label: () => <span onClick={() => handlePlayListItemClick(songListDetail)}>{songListDetail.name}</span>,
        key: songListDetail.name,
        icon: () => <NIcon size={20} component={QueueMusicFilled}></NIcon>,
        id: songListDetail.id
      });
    } else { //取消收藏. 删除歌单
      let id = data.id;
      let index = myMenuOptions.value[1].children?.findIndex((item:any) => item.id === +id);
      // console.log(index)
      // 0 的时候不执行！！！
      if (index !== -1) {
        myMenuOptions.value[1].children?.splice(index as number, 1);
      }
      // console.log(myMenuOptions.value[1].children)
    }
  })
// 监听创建歌单
observer.on('updateMyCreatePlayList', (data:any) => {
    myMenuOptions.value[0].children?.splice(
      1, 0, {
        label: () => <span onClick={() => handlePlayListItemClick(data)}>{data.name}</span>,
        key: data.name,
        icon: () => <NIcon size={20} component={QueueMusicFilled}></NIcon>,
        id: data.id
      }
    );
  })
</script>

<template>
  <n-layout has-sider>
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="200"
      style="height: 100%"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <n-menu
        v-model:value="activeKey"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="24"
        :options="myMenuOptions"
        :default-expand-all="true"        
      />
    </n-layout-sider>
    <n-layout-content style="height: 100%">
      <router-view v-slot="{ Component }">
        <transition
          name="fade-transform"
          mode="out-in"
        >
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
      <!-- backTop -->
      <n-back-top :right="mainStore.backTopLeft" :bottom="160" :visibility-height="100" show>
        <n-icon :component="BackToTop"/>
      </n-back-top>      
    </n-layout-content>    
    <!-- 扫码登陆 -->
    <LoginModal ref="loginModalRef"/>

  </n-layout>
</template>

<style scoped>
:deep(.n-submenu > .n-submenu-children > .n-menu-item > .n-menu-item-content){
  padding-left: 45px !important;
}
</style>