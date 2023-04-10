<script lang="ts" setup>
import { useMainStore } from "@/stores/main";
import { onMounted } from "vue";

import { useMessage, useDialog } from "naive-ui";

window.$message = useMessage();
const dialog = useDialog();
const mainStore = useMainStore();
onMounted(() => {
  // console.log(mainStore.isLogin, dialog.info)
  if (!mainStore.isLogin) {
    dialog.info({
      title: "提示",
      content: "请先登录",
    });
  }
});
</script>

<template>
  <div id="layout-container" style="width: 90vw; margin: auto">
    <n-layout>
      <LayoutHeader />
      <LayoutLeftMenu class="leftmenu"/>
      <n-layout-footer bordered>
        <FooterPlayer />
      </n-layout-footer>
    </n-layout>
  </div>
</template>

<style>
.leftmenu {
  height: calc(100vh - 118px);
}
::-webkit-scrollbar {
  width: 5px;
  background-color: transparent;
}
::-webkit-scrollbar-thumb {
  width: 5px;
  background-color: rgba(107, 114 ,128, 0.5);
  /* opacity: 0; */
  border-radius: 10px;
}
</style>
