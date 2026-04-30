<script setup>
/**
 * Home 音乐下载页
 * 功能描述：搜索/下载音乐，展示搜索结果表格，支持分页和批量下载
 * 依赖组件：BaseButton, BaseInput, BaseSelect, BasePagination, SongListTable
 * Source: 规范文档/前端规范文档.md §6 API 调用规范
 */
// 1. Vue 官方 API
import { computed, reactive, ref } from 'vue'

// 2. Pinia Store
import { useCurSongDataStore } from '@/stores/Song'

// 3. 工具函数 / 常量
import { showToast } from '@/utils/toast'

// 4. API 接口定义
import { searchSongs, getAlbumImages, getSongUrls } from '@/api/song'

// 5. 子组件导入
import DefaultImg from '@/assets/img/init_img.jpg'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BasePagination from '@/components/base/BasePagination.vue'
import SongListTable from '@/components/business/SongListTable.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const curSongStore = useCurSongDataStore()
const selectedSongs = ref([])
const selectAllChecked = ref(false)
const isLoading = ref(false)
const error = ref(null)

const searchData = reactive({
  urlType: 'playlist',
  searchUrl: '',
  searchUrlType: [
    { value: 'song', label: '歌曲链接' },
    { value: 'playlist', label: '歌单链接' }
  ]
})

const songData = reactive({
  songList: [],
  total: 0,
  page: 1,
  pageSize: 20
})

let currentRequestId = 0
function generateRequestId() {
  return Date.now() + '_' + Math.random()
}

const homeColumns = [
  { key: 'index', type: 'index', width: '40px', label: '#', headerAlign: 'center' },
  { key: 'cover', type: 'cover', width: '48px', label: '', field: 'album.album_cover_url', fallback: DefaultImg, headerAlign: 'center' },
  { key: 'songName', label: '歌名', field: 'song_name', width: '1fr', cellClass: 'text-sm font-medium truncate text-theme-text' },
  { key: 'singer', label: '歌手', field: 'singer', width: '140px' },
  { key: 'albumName', label: '专辑', field: 'album.album_name', width: '160px' },
  { key: 'createTime', label: '时间', field: 'create_time', width: '100px' },
  { key: 'duration', label: '时长', field: 'duration', width: '60px' },
  { key: 'urlType', type: 'format', width: '70px', label: '格式', field: 'song_url.url_type', headerAlign: 'center' },
  { key: 'fileSize', type: 'slot', label: '大小', width: '80px', headerAlign: 'center' },
  {
    key: 'download',
    type: 'action',
    width: '60px',
    label: '操作',
    headerAlign: 'center',
    icon: ['fas', 'download'],
    disabled: (song) => song.song_url?.url === 'null' || !song.song_url?.url,
    title: (song) => song.song_url?.url === 'null' || !song.song_url?.url ? '该歌曲链接无效，无法下载' : '点击下载'
  }
]

const selectedSongMids = computed(() => selectedSongs.value.map(s => s.song_mid))

const handleSearch = async () => {
  try {
    error.value = null
    isLoading.value = true
    songData.songList = []
    const requestId = generateRequestId()
    currentRequestId = requestId

    const searchResponse = await searchSongs({
      url_type: searchData.urlType,
      search_url: searchData.searchUrl,
      page: songData.page,
      page_size: songData.pageSize,
      request_id: requestId
    })

    if (searchResponse.data.request_id !== currentRequestId) return

    songData.songList = searchResponse.data.result
    songData.total = searchResponse.data.total

    const songAlbumIdList = songData.songList.map(item => item.album.album_mid.toString())
    await getAlbumImg(songAlbumIdList)
  } catch (err) {
    error.value = '歌曲搜索失败，请稍后重试'
    console.error('歌曲搜索失败:', err)
  } finally {
    isLoading.value = false
  }
}

const getAlbumImg = async (songAlbumIdList) => {
  try {
    const requestId = currentRequestId
    let validIds = songAlbumIdList.filter(Boolean)
    if (validIds.length === 0) return

    const imgResponse = await getAlbumImages(validIds)
    if (imgResponse.data.request_id !== currentRequestId) return

    imgResponse.data = imgResponse.data.result
    if (imgResponse.data) {
      for (let i = 0; i < songData.songList.length; i++) {
        songData.songList[i].album.album_cover_url = imgResponse.data[i]
      }
    }
    validIds = songData.songList.map(item => item.song_mid.toString())
    await getSongUrl(validIds)
  } catch (error) {
    console.error('封面获取失败:', error)
  }
}

const getSongUrl = async (validIds) => {
  try {
    const requestId = currentRequestId
    const songUrlResponse = await getSongUrls(validIds)
    if (songUrlResponse.data.request_id !== currentRequestId) return

    songUrlResponse.data = songUrlResponse.data.result
    if (songUrlResponse.data) {
      for (let i = 0; i < songData.songList.length; i++) {
        songData.songList[i].song_url = songUrlResponse.data[i]
      }
    }
    showToast('音乐链接获取成功', 'success')
  } catch (error) {
    console.error('链接获取失败:', error)
  }
}

const handleDownload = async (song) => {
  try {
    if (!songData.songList[0]?.song_url?.url) {
      showToast('请等待音乐链接获取完成', 'warning')
      return
    }
    if (!song.song_url.url) {
      showToast('音乐链接获取失败', 'warning')
      return
    }

    const success = await window.electronAPI.downloadFile({
      url: song.song_url.url,
      filename: `${song.song_name}-${song.singer}.${song.song_url.url_type}`,
    })
    if (success) {
      showToast('下载成功', 'success')
    } else {
      showToast('下载取消或失败', 'warning')
    }
  } catch (error) {
    console.error('下载失败:', error)
    showToast('文件下载失败', 'error')
  }
}

const handlePageChange = () => {
  handleSearch()
}

const toggleSelectAll = () => {
  if (selectAllChecked.value) {
    selectedSongs.value = [...songData.songList]
  } else {
    selectedSongs.value = []
  }
}

const handleSongSelect = (song) => {
  const index = selectedSongs.value.indexOf(song)
  if (index > -1) {
    selectedSongs.value.splice(index, 1)
  } else {
    selectedSongs.value.push(song)
  }
  selectAllChecked.value = selectedSongs.value.length === songData.songList.length
}

const handleSongAction = (song) => {
  handleDownload(song)
}

const handleAllDownload = async () => {
  if (!selectedSongs.value.length) {
    showToast('请选择要下载的歌曲', 'warning')
    return
  }
  if (!songData.songList[0]?.song_url?.url) {
    showToast('请等待音乐链接获取完成', 'warning')
    return
  }

  const validSongs = selectedSongs.value.filter(song => song.song_url?.url && song.song_url?.url !== 'null')

  if (validSongs.length === 0) {
    showToast('选中的歌曲均无法下载，请重新选择', 'warning')
    return
  }

  if (validSongs.length < selectedSongs.value.length) {
    showToast(
      `共选择了${selectedSongs.value.length}首歌曲，其中${selectedSongs.value.length - validSongs.length}首因链接无效无法下载`,
      'warning'
    )
  }

  for (const song of validSongs) {
    await handleDownload(song)
  }
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '未知'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 顶部搜索区域 -->
    <header class="flex flex-col items-center justify-center min-h-[160px] relative">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="home-glow"></div>
      </div>

      <span class="text-2xl font-bold mb-5 tracking-wide text-theme-text">音乐下载平台</span>
      <div class="flex gap-3 items-center flex-wrap justify-center relative z-10">
        <BaseButton variant="outline" @click="selectAllChecked = !selectAllChecked; toggleSelectAll()">
          {{ selectAllChecked ? '取消全选' : '一键全选' }}
        </BaseButton>
        <BaseButton variant="primary" @click="handleAllDownload">全部下载</BaseButton>

        <BaseSelect
          v-model="searchData.urlType"
          :options="searchData.searchUrlType"
        />

        <BaseInput
          v-model="searchData.searchUrl"
          placeholder="请输入歌曲或歌单链接..."
          class="w-[520px] max-w-[55vw]"
          @enter="handleSearch"
        >
          <template #prefix>
            <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="text-sm" aria-hidden="true" />
          </template>
        </BaseInput>

        <BaseButton variant="primary" @click="handleSearch">查询</BaseButton>
      </div>
    </header>

    <!-- 错误提示 -->
    <ErrorDisplay v-if="error" :error="error" show-retry @retry="handleSearch" />

    <!-- 歌曲列表 -->
    <LoadingSpinner :loading="isLoading" loading-text="正在搜索歌曲...">
    <SongListTable
      :songs="songData.songList"
      :columns="homeColumns"
      :selectable="true"
      row-key="song_mid"
      :selected-keys="selectedSongMids"
      :select-all="selectAllChecked"
      empty-text="请搜索歌曲..."
      @row-click="handleSongSelect"
      @select="handleSongSelect"
      @select-all="(val) => { selectAllChecked = val; toggleSelectAll() }"
      @action="handleSongAction"
    >
      <template #fileSize="{ song }">
        <div class="text-center text-sm text-theme-text-secondary">
          {{ formatFileSize(song.song_url?.file_size) }}
        </div>
      </template>
    </SongListTable>
    </LoadingSpinner>

    <!-- 分页控制器 -->
    <BasePagination
      v-model:page="songData.page"
      v-model:page-size="songData.pageSize"
      :total="songData.total"
      @change="handlePageChange"
    />
  </div>
</template>

<style scoped>
.home-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 200px;
  border-radius: 9999px;
  opacity: 0.04;
  background: radial-gradient(ellipse, var(--color-primary), transparent 70%);
}
</style>
