import { createRouter, createWebHashHistory, type NavigationGuardWithThis} from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/discovery',
      meta: { auth: false },
    },
    {
      path: '/discovery',
      name: 'discovery',
      component: () => import('@/views/home/DiscoveryView.vue'),
      meta: { auth: false }
    },
    {
      path: '/songList/:id',
      name: 'songListDetail',
      component: () => import('@/views/songList/SongListDetail.vue'),
      meta: { auth: false }
    },
    {
      path: '/latestMusic',
      name: 'latestMusic',
      component: () => import('@/views/music/LatestMusicView.vue'),
      meta: { auth: false }
    },
    {
      path: '/songList',
      name: 'songList',
      component: () => import('@/views/songList/RecommendSongListView.vue'),
      meta: { auth: false }
    },
    {
      path: '/userInfoEdit',
      name: 'userInfoEdit',
      component: () => import('@/views/user/UserInfoEdit.vue'),
      meta: { auth: true }
    },
    {
      path: '/searchResult',
      name: 'searchResult',
      component: () => import('@/views/search/SearchResult.vue')
    }
  ]
})

export default router

export const registerRouteHook = (beforeEachFn: NavigationGuardWithThis<undefined>, beforeResolveFn: NavigationGuardWithThis<undefined>) => {
  router.beforeEach(beforeEachFn);
  router.beforeResolve(beforeResolveFn);
};
