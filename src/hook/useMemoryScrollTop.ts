import { throttle } from "lodash";
import { nextTick, onMounted, onUnmounted, onUpdated, onActivated, onDeactivated,type Ref } from "vue";

export function useMemoryScrollTop(ref:Ref<HTMLElement> | string, key:string) {
  // '.n-layout-sider+.n-layout-content>.n-layout-scroll-container'
  let targetEle : HTMLElement | null | Window = null;
  let setScrollTopLock = false;
  // 设置滚动位置
  const setScrollPosition = (key:string) => {
    setScrollTopLock = true;
    const scrollTop = sessionStorage.getItem(key);
    
    if (scrollTop) {
      const options:ScrollToOptions = {
        behavior: 'smooth',
        top: +scrollTop
      };
      if (targetEle instanceof Window) {
        document.documentElement.scrollTo(options);
        document.body.scrollTo(options);
        setScrollTopLock = false;
      } else {
        nextTick(() => {
          targetEle!.scrollTo(options);
          setScrollTopLock = false;
        });
      }
    }
  };
  const handleListenScroll = () => {
    if (setScrollTopLock) return;
    
    let scrollTop;
    // 是否为window
    if (targetEle instanceof Window) {
      scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    } else {
      scrollTop = targetEle!.scrollTop;
    }
    
    sessionStorage.setItem(key, scrollTop!.toString());

  };
  const throttleFn = throttle(handleListenScroll, 500);
  
  onMounted(() => {
    if (!ref) {
      targetEle = window;
      return;
    }
    if (typeof ref === 'string') {
      const dom = document.querySelector(ref);
      targetEle = (dom
        ? dom
        : window) as HTMLElement | Window;
    } else {
      if (ref?.value) {
        targetEle = ref.value;
      } else {
        targetEle = window;
      }
    }
    // console.log(targetEle)
    // targetEle.addEventListener('scroll', throttleFn);
    // setScrollPosition(key);
  });
  onUnmounted(() => {
    // targetEle!.removeEventListener('scroll', throttleFn);
    sessionStorage.removeItem(key);
    // targetEle!.scrollTo({ top: 0 });
  });
  // onUpdated(() => {
  //   setScrollPosition(key);
  // });
  onActivated(() => {
    setScrollPosition(key)
  })
  onDeactivated(() => {
    let scrollTop;
    // 是否为window
    if (targetEle instanceof Window) {
      scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    } else {
      scrollTop = targetEle!.scrollTop;
    }
    // console.log(scrollTop)
    sessionStorage.setItem(key, scrollTop!.toString())
  })
}