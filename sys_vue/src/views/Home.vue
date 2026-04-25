<script setup>
/**
 * 音乐下载页
 * 功能描述：搜索/下载音乐，展示搜索结果表格，支持分页和批量下载
 */
import { computed, nextTick, reactive, ref } from 'vue'
import { searchSongs, getAlbumImages, getSongUrls } from '@/api/song'
import { showToast } from '@/utils/toast'
import { useCurSongDataStore } from '@/stores/Song'
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
    const response = await fetch(song.songUrl.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${song.songName}-${song.singer}.${song.songUrl.urlType}`
    document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    }, 5000)
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
    <div class="flex flex-col items-center justify-center min-h-[150px]">
      <span class="text-3xl font-bold mb-6">音乐下载平台</span>
      <div class="flex gap-5 items-center flex-wrap justify-center">
        <div class="flex gap-3">
          <button
            class="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors text-base font-medium"
            @click="toggleSelectAll"
          >
            {{ selectAllChecked ? '取消全选' : '一键全选' }}
          </button>
          <button
            class="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors text-base font-medium"
            @click="handleAllDownload"
          >
            全部下载
          </button>
        </div>
        <select
          v-model="searchData.urlType"
          class="h-[42px] w-[110px] px-3 border border-gray-300 rounded-lg bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option v-for="item in searchData.searchUrlType" :key="item.index" :value="item.value">
            {{ item.label }}
          </option>
        </select>
        <div class="relative">
          <font-awesome-icon
            :icon="['fas', 'magnifying-glass']"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="searchData.searchUrl"
            placeholder="请输入链接"
            class="h-[42px] w-[600px] max-w-[60vw] pl-10 pr-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            @keyup.enter="handleSearch"
          />
        </div>
        <button
          class="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors text-base font-medium"
          @click="handleSearch"
        >
          查询
        </button>
      </div>
    </div>

    <!-- 歌曲列表表格 -->
    <div class="flex-1 overflow-x-hidden w-full mb-2.5">
      <table class="w-full border-collapse bg-white rounded-lg shadow-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="w-10 px-2 py-3 text-center text-sm font-medium text-gray-600">
              <input type="checkbox" v-model="selectAllChecked" @change="toggleSelectAll" class="cursor-pointer" />
            </th>
            <th class="w-10 px-2 py-3 text-center text-sm font-medium text-gray-600">序号</th>
            <th class="w-20 px-2 py-3 text-center text-sm font-medium text-gray-600">封面</th>
            <th class="min-w-[120px] px-3 py-3 text-left text-sm font-medium text-gray-600">歌名</th>
            <th class="min-w-[100px] px-3 py-3 text-left text-sm font-medium text-gray-600">歌手</th>
            <th class="min-w-[120px] px-3 py-3 text-left text-sm font-medium text-gray-600">专辑</th>
            <th class="min-w-[100px] px-3 py-3 text-left text-sm font-medium text-gray-600">出版时间</th>
            <th class="min-w-[60px] px-3 py-3 text-left text-sm font-medium text-gray-600">时长</th>
            <th class="w-[70px] px-2 py-3 text-center text-sm font-medium text-gray-600">格式</th>
            <th class="w-[90px] px-2 py-3 text-center text-sm font-medium text-gray-600">大小</th>
            <th class="w-[60px] px-2 py-3 text-center text-sm font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(song, index) in songData.songList"
            :key="index"
            class="hover:bg-gray-50 border-b border-gray-100 transition-colors"
          >
            <td class="w-10 px-2 py-3 text-center">
              <input
                type="checkbox"
                :checked="isSongSelected(song)"
                @change="toggleSongSelect(song)"
                class="cursor-pointer"
              />
            </td>
            <td class="w-10 px-2 py-3 text-center text-sm text-gray-600">{{ index + 1 }}</td>
            <td class="w-20 px-2 py-3 text-center">
              <img
                :src="song.album.albumCoverUrl || DefaultImg"
                alt="封面"
                class="w-10 h-10 rounded-xl object-cover inline-block"
              />
            </td>
            <td class="min-w-[120px] px-3 py-3 text-sm">{{ song.songName }}</td>
            <td class="min-w-[100px] px-3 py-3 text-sm text-gray-600">{{ song.singer }}</td>
            <td class="min-w-[120px] px-3 py-3 text-sm text-gray-600">{{ song.album.albumName }}</td>
            <td class="min-w-[100px] px-3 py-3 text-sm text-gray-600">{{ song.createTime }}</td>
            <td class="min-w-[60px] px-3 py-3 text-sm text-gray-600">{{ song.duration }}</td>
            <td class="w-[70px] px-2 py-3 text-center">
              <span
                v-if="song.songUrl?.urlType"
                class="inline-block px-2 py-0.5 text-xs bg-primary/10 text-primary rounded"
              >
                {{ song.songUrl.urlType.toUpperCase() }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="w-[90px] px-2 py-3 text-center text-sm text-gray-600">
              {{ formatFileSize(song.songUrl?.fileSize) }}
            </td>
            <td class="w-[60px] px-2 py-3 text-center">
              <button
                :disabled="song.songUrl?.url === 'null' || !song.songUrl?.url"
                :title="song.songUrl?.url === 'null' || !song.songUrl?.url ? '该歌曲链接无效，无法下载' : '点击下载'"
                class="text-primary hover:text-primary-600 disabled:text-gray-300 disabled:cursor-not-allowed text-base bg-transparent border-none cursor-pointer"
                @click="handleDownload(song)"
              >
                下载
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页控制器 -->
    <div class="sticky bottom-0 bg-white flex items-center justify-center gap-2 py-3 z-10 shadow-[0_-1px_4px_rgba(0,0,0,0.05)]">
      <span class="text-sm text-gray-500 mr-4">共 {{ songData.total }} 条</span>
      <button
        :disabled="songData.page <= 1"
        class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        @click="handlePageChange(songData.page - 1)"
      >
        上一页
      </button>
      <button
        v-for="p in totalPages"
        :key="p"
        :class="[
          'w-8 h-8 text-sm rounded-lg transition-colors',
          p === songData.page
            ? 'bg-primary text-white'
            : 'border border-gray-300 hover:bg-gray-50'
        ]"
        @click="handlePageChange(p)"
      >
        {{ p }}
      </button>
      <button
        :disabled="songData.page >= totalPages"
        class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        @click="handlePageChange(songData.page + 1)"
      >
        下一页
      </button>
      <select
        :value="songData.pageSize"
        class="ml-4 h-8 px-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        @change="handlePageSizeChange"
      >
        <option :value="10">10条/页</option>
        <option :value="20">20条/页</option>
        <option :value="30">30条/页</option>
        <option :value="50">50条/页</option>
      </select>
    </div>
  </div>
</template>
