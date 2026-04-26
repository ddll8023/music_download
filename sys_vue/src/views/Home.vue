<script setup>
/**
 * Home 音乐下载页
 * 功能描述：搜索/下载音乐，展示搜索结果表格，支持分页和批量下载
 * 依赖组件：无
 * Source: 规范文档/前端规范文档.md §6 API 调用规范
 */
// 1. Vue 官方 API
import { computed, nextTick, reactive, ref } from 'vue'

// 2. Pinia Store
import { useCurSongDataStore } from '@/stores/Song'

// 3. 工具函数 / 常量
import { showToast } from '@/utils/toast'

// 4. API 接口定义
import { searchSongs, getAlbumImages, getSongUrls } from '@/api/song'

// 5. 子组件 / 资源导入
import DefaultImg from '@/assets/img/init_img.jpg'

const curSongStore = useCurSongDataStore()
const selectedSongs = ref([])
const selectAllChecked = ref(false)

const searchData = reactive({
  urlType: 'playlist',
  searchUrl: '',
  searchUrlType: [
    { index: 0, label: '歌曲链接', value: 'song' },
    { index: 1, label: '歌单链接', value: 'playlist' }
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

const totalPages = computed(() => Math.ceil(songData.total / songData.pageSize))

const handleSearch = async () => {
  try {
    songData.songList = []
    const requestId = generateRequestId()
    currentRequestId = requestId

    const searchResponse = await searchSongs({
      urlType: searchData.urlType,
      searchUrl: searchData.searchUrl,
      page: songData.page,
      pageSize: songData.pageSize,
      requestId
    })

    if (searchResponse.data.requestId !== currentRequestId) return

    songData.songList = searchResponse.data.result
    songData.total = searchResponse.data.total

    const songAlbumIdList = songData.songList.map(item => item.album.albumMid.toString())
    await getAlbumImg(songAlbumIdList)
  } catch (error) {
    console.error('歌曲搜索失败:', error)
  }
}

const getAlbumImg = async (songAlbumIdList) => {
  try {
    const requestId = currentRequestId
    let validIds = songAlbumIdList.filter(Boolean)
    if (validIds.length === 0) return

    const imgResponse = await getAlbumImages(validIds)
    if (imgResponse.data.requestId !== currentRequestId) return

    imgResponse.data = imgResponse.data.result
    if (imgResponse.data) {
      for (let i = 0; i < songData.songList.length; i++) {
        songData.songList[i].album.albumCoverUrl = imgResponse.data[i]
      }
    }
    validIds = songData.songList.map(item => item.songMid.toString())
    await getSongUrl(validIds)
  } catch (error) {
    console.error('封面获取失败:', error)
  }
}

const getSongUrl = async (validIds) => {
  try {
    const requestId = currentRequestId
    const songUrlResponse = await getSongUrls(validIds)
    if (songUrlResponse.data.requestId !== currentRequestId) return

    songUrlResponse.data = songUrlResponse.data.result
    if (songUrlResponse.data) {
      for (let i = 0; i < songData.songList.length; i++) {
        songData.songList[i].songUrl = songUrlResponse.data[i]
      }
    }
    showToast('音乐链接获取成功', 'success')
  } catch (error) {
    console.error('链接获取失败:', error)
  }
}

const handleDownload = async (song) => {
  try {
    if (!songData.songList[0]?.songUrl?.url) {
      showToast('请等待音乐链接获取完成', 'warning')
      return
    }
    if (!song.songUrl.url) {
      showToast('音乐链接获取失败', 'warning')
      return
    }

    const success = await window.electronAPI.downloadFile({
      url: song.songUrl.url,
      filename: `${song.songName}-${song.singer}.${song.songUrl.urlType}`,
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

const handlePageChange = async (page) => {
  songData.page = page
  await handleSearch()
}

const handlePageSizeChange = async (e) => {
  songData.pageSize = Number(e.target.value)
  songData.page = 1
  await handleSearch()
}

const toggleSelectAll = () => {
  if (selectAllChecked.value) {
    selectedSongs.value = [...songData.songList]
  } else {
    selectedSongs.value = []
  }
}

const toggleSongSelect = (song) => {
  const index = selectedSongs.value.indexOf(song)
  if (index > -1) {
    selectedSongs.value.splice(index, 1)
  } else {
    selectedSongs.value.push(song)
  }
  selectAllChecked.value = selectedSongs.value.length === songData.songList.length
}

const isSongSelected = (song) => selectedSongs.value.includes(song)

const handleAllDownload = async () => {
  if (!selectedSongs.value.length) {
    showToast('请选择要下载的歌曲', 'warning')
    return
  }
  if (!songData.songList[0]?.songUrl?.url) {
    showToast('请等待音乐链接获取完成', 'warning')
    return
  }

  const validSongs = selectedSongs.value.filter(song => song.songUrl?.url && song.songUrl?.url !== 'null')

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
      <!-- 背景微光装饰 -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="home-glow"></div>
      </div>

      <span class="text-2xl font-bold mb-5 tracking-wide text-theme-text">音乐下载平台</span>
      <div class="flex gap-3 items-center flex-wrap justify-center relative z-10">
        <button
          class="px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer border-none btn-outline"
          @click="toggleSelectAll"
        >
          {{ selectAllChecked ? '取消全选' : '一键全选' }}
        </button>
        <button
          class="px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer border-none btn-primary"
          @click="handleAllDownload"
        >
          全部下载
        </button>
        <select
          v-model="searchData.urlType"
          class="h-[40px] w-[100px] px-3 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer select-dark"
        >
          <option v-for="item in searchData.searchUrlType" :key="item.index" :value="item.value">
            {{ item.label }}
          </option>
        </select>
        <div class="relative">
          <font-awesome-icon
            :icon="['fas', 'magnifying-glass']"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-theme-text-secondary"
            aria-hidden="true"
          />
          <input
            v-model="searchData.searchUrl"
            placeholder="请输入歌曲或歌单链接..."
            class="h-[40px] w-[520px] max-w-[55vw] pl-10 pr-4 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow input-dark"
            @keyup.enter="handleSearch"
          />
        </div>
        <button
          class="px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer border-none btn-primary"
          @click="handleSearch"
        >
          查询
        </button>
      </div>
    </header>

    <!-- 歌曲列表 -->
    <section class="flex-1 overflow-x-hidden w-full mb-2.5 rounded-xl overflow-hidden bg-surface border border-theme-border">
      <!-- 列表头部 -->
      <div class="song-list-header grid items-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wider">
        <div class="flex justify-center">
          <input type="checkbox" v-model="selectAllChecked" @change="toggleSelectAll" class="cursor-pointer accent-primary" />
        </div>
        <div class="text-center">#</div>
        <div></div>
        <div class="pl-2">歌名</div>
        <div>歌手</div>
        <div>专辑</div>
        <div>时间</div>
        <div>时长</div>
        <div class="text-center">格式</div>
        <div class="text-center">大小</div>
        <div class="text-center">操作</div>
      </div>
      <!-- 列表行 -->
      <div
        v-for="(song, index) in songData.songList"
        :key="index"
        class="song-list-row grid items-center px-4 py-2 cursor-pointer group"
      >
        <div class="flex justify-center">
          <input
            type="checkbox"
            :checked="isSongSelected(song)"
            @change="toggleSongSelect(song)"
            class="cursor-pointer accent-primary"
          />
        </div>
        <div class="text-center text-xs text-theme-text-secondary">{{ index + 1 }}</div>
        <div class="flex justify-center">
          <img
            :src="song.album.albumCoverUrl || DefaultImg"
            alt="封面"
            class="w-9 h-9 rounded-md object-cover cover-shadow"
          />
        </div>
        <div class="pl-2 text-sm font-medium truncate text-theme-text">{{ song.songName }}</div>
        <div class="text-sm truncate text-theme-text-secondary">{{ song.singer }}</div>
        <div class="text-sm truncate text-theme-text-secondary">{{ song.album.albumName }}</div>
        <div class="text-sm text-theme-text-secondary">{{ song.createTime }}</div>
        <div class="text-sm text-theme-text-secondary">{{ song.duration }}</div>
        <div class="text-center">
          <span
            v-if="song.songUrl?.urlType"
            class="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded format-badge"
          >
            {{ song.songUrl.urlType.toUpperCase() }}
          </span>
          <span v-else class="text-theme-text-secondary">-</span>
        </div>
        <div class="text-center text-sm text-theme-text-secondary">
          {{ formatFileSize(song.songUrl?.fileSize) }}
        </div>
        <div class="flex justify-center">
          <button
            :disabled="song.songUrl?.url === 'null' || !song.songUrl?.url"
            :title="song.songUrl?.url === 'null' || !song.songUrl?.url ? '该歌曲链接无效，无法下载' : '点击下载'"
            :aria-label="song.songUrl?.url === 'null' || !song.songUrl?.url ? '该歌曲链接无效，无法下载' : '下载'"
            class="p-1.5 rounded-md transition-all duration-200 cursor-pointer border-none bg-transparent"
            :class="song.songUrl?.url === 'null' || !song.songUrl?.url ? 'btn-download-disabled' : 'btn-download'"
            @click="handleDownload(song)"
          >
            <font-awesome-icon :icon="['fas', 'download']" class="text-sm" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>

    <!-- 分页控制器 -->
    <footer class="flex items-center justify-between py-3 px-4 z-10 border-t border-theme-border">
      <span class="text-xs text-theme-text-secondary">共 {{ songData.total }} 条</span>
      <div class="flex items-center gap-1.5">
        <button
          :disabled="songData.page <= 1"
          class="w-8 h-8 text-sm rounded-md transition-colors duration-200 flex items-center justify-center btn-page-nav"
          aria-label="上一页"
          @click="handlePageChange(songData.page - 1)"
        >
          <font-awesome-icon :icon="['fas', 'chevron-left']" class="text-xs" aria-hidden="true" />
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          :class="[
            'w-8 h-8 text-xs font-medium rounded-md transition-all duration-200',
            p === songData.page ? 'btn-page-active' : 'btn-page-default'
          ]"
          @click="handlePageChange(p)"
        >
          {{ p }}
        </button>
        <button
          :disabled="songData.page >= totalPages"
          class="w-8 h-8 text-sm rounded-md transition-colors duration-200 flex items-center justify-center btn-page-nav"
          aria-label="下一页"
          @click="handlePageChange(songData.page + 1)"
        >
          <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-xs" aria-hidden="true" />
        </button>
        <select
          :value="songData.pageSize"
          class="ml-3 h-8 px-2 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer select-dark"
          @change="handlePageSizeChange"
        >
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="30">30条/页</option>
          <option :value="50">50条/页</option>
        </select>
      </div>
    </footer>
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

.song-list-header {
  grid-template-columns: 40px 40px 48px 1fr 140px 160px 100px 60px 70px 80px 60px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.song-list-row {
  grid-template-columns: 40px 40px 48px 1fr 140px 160px 100px 60px 70px 80px 60px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: background-color 0.15s;
}
.song-list-row:hover {
  background: var(--color-hover-overlay);
}
</style>
