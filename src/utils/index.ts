export * from './arr-map'
// 格式化数字
export function formateNumber(num:number) {
  // 小于10万的数字直接返回
  if (num < 99999) return num.toString();
  // 大于10万 小于10亿
  if (num < 1000000000) return Math.round(num / 10000) + '万';
  // 大于10亿
  if (num >= 1000000000) return Math.round(num / 100000000) + '亿';
 
  return num.toString();
}
// 获取数组最后一位
export const getArrLast = (arr:any[]) => {
  return arr[arr.length - 1];
};
// 当值等于最大值时,返回0,否则+1
export function getNextIndex(index:number, max:number) {
  return index === max
    ? 0
    : index + 1;
}
// 当值等于0时,返回最大值,否则-1
export function getPrevIndex(index:number, max:number) {
  return index === 0
    ? max
    : index - 1;
}