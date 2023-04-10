/// <reference types="vite/client" />
import type { MessageApiInjection } from 'naive-ui/lib/message/src/MessageProvider';
export * from 'naive-ui/volar';
export {}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
 
  const vueComponent: DefineComponent<{}, {}, any>;
 
  export default vueComponent;
}
declare global {
  interface Window {
    $message: MessageApiInjection;
  }
  interface ImportMeta {
    env: Record<string, string>
  }
}
declare module 'vue' {
  export interface Window {
    $message: MessageApiInjection;
  }
}

// 任意键值对对象类型
export type AnyObject = {
  [key: string]: any;
};
export interface TopAlbumParams {
  limit?: number;
  offset?: number;
  area?: '全部' | '华语' | '欧美' | '韩国' | '日本';
  type?: '全部' | '热门',
  year?: number;
  month?: number;
}
