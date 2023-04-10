<script lang="tsx">
import { computed, defineComponent, ref } from 'vue'
// import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/main'
import { NIcon, NTime, NTag, type DataTableColumns } from 'naive-ui'
import { VolumeMuteFilled, VolumeUpFilled } from '@vicons/material'
import { formateSongsAuthor } from '@/utils/arr-map'
import { useDbClickPlay } from '@/hook/useDbClickPlay'

type RowData = {
  like: boolean
  ar: any[]
  al: {name:string, nameRichText:string}
  dt: number
  name: string
  nameRichText: string
  formatAuthorRichText: string
  mv: number
  id: string
  // 免费或无版权1: VIP 歌曲4: 购买专辑8: 非会员可免费播放低音质，会员可播放高音质及下载 
  //fee 为 1 或 8 的歌曲均可单独购买 2 元单曲
  fee: number
  isSearch?: boolean
  index?: number
}

export default defineComponent({
  props: {
    songList: {type: Array, default: () => []},
    loading: {type: Boolean},
    playListId: {type: String, required: true},
    rawSongList: {type: Array, default: () => []},
  },
  emits: ['updateMusicListLike'],
  setup(props, ctx) {
    // const router = useRouter();
    const mainStore = useMainStore();
    // n-tag
    const tagColor = {textColor: 'pink', borderColor: 'pink'};
    const columns:DataTableColumns<RowData> = [
      {
        title: '操作',
        key: 'row',
        width: 50,
        render(row, index) {
          let songList = (props.rawSongList.length
            ? props.rawSongList
            : props.songList) as any[]
            return <div class="flex items-center">
              {
                mainStore.currentPlaySong?.id === songList[index].id
                  ? <NIcon color="pink" component={mainStore.playing
                    ? VolumeUpFilled
                    : VolumeMuteFilled} size={20} class="pr-3"/>
                  : <span class="pr-4 opacity-50">
                      { index < 9 ? '0' + (index+1) : index+1}
                    </span>
              }
              <heart-icon
                id={row.id}
                like={row.like}
                size={20}
                likeSuccess={(like:boolean) => likeSuccess(like, index)}
              />
            
            </div>
        }
      },
      {
        title: '标题',
        key: 'name',
        width: 200,
        render(row) {
          return <div>
            {
              row.nameRichText
              ? <span v-html={row.nameRichText}></span>
              : row.name
            }
            {
              row.mv !== 0
              ? <NTag size="small" color={tagColor} class="ml-2">MV</NTag>
              : null
            }
            {
              row.fee === 1
              ? <NTag size='small' color={tagColor} class="ml-2">VIP</NTag>
              : null
            }
          </div>
        }
      },
      {
        title: '歌手',
        key: 'singer',
        width: 140,
        render(row) {
          return <p class="text-sm truncate">
            {
              row.formatAuthorRichText
              ? <span v-html={row.formatAuthorRichText}></span>
              : formateSongsAuthor(row.ar)
            }
          </p>
        }
      },
      {
        title: '专辑',
        key: 'album',
        width: 120,
        render(row) {
          return <p class="text-sm truncate">
            { 
              row.al.name
              ? row.al.nameRichText
                ? <span v-html={row.al.nameRichText}></span>
                : row.al.name
              : <span class="opacity-50">未知专辑</span> 
            }
          </p>;
        }        
      },
      {
        title: '时间',
        key: 'time',
        width: 80,
        render(row) {
          return <NTime class="text-sm text-left"
            time={row.dt} format='mm:ss'/>
        }
      }
    ]

    const likeSuccess = (like:boolean, index:number) => {
      ctx.emit('updateMusicListLike', like, index)
    }
    // 双击函数
    const handleDbClick = useDbClickPlay()
    // 添加样式
    const rowClassName = (_row: any, index:number) => {
      if (index === +mainStore.currentPlayIndex) {
        return 'current-play bg-gray-200/80 dark:bg-gray-200/20';
      }
      return '';
    }
    // 自定义行属性
    const rowProps = (row: any, index: number) => {
      let rawIndex = row.isSearch ? row.index : index
      return {
        ondblclick: () => handleDbClick(
          props.rawSongList.length ? props.rawSongList : props.songList,
          props.playListId, row, rawIndex
        )
      }
    }

    return () => {
      return <div>
        <n-data-table
          striped
          columns={columns}
          data={props.songList}
          loading={props.loading}
          max-height={500}
          virtual-scroll
          row-class-name={rowClassName}
          row-props={rowProps}
        />
      </div>
    }

  }
})


</script>

<template>
  <div>
    
  </div>
</template>

<style scoped>
  
</style>