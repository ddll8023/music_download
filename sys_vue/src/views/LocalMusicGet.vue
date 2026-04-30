<script setup>
/**
 * LocalMusicGet 本地音乐页
 * 功能描述：导入本地音乐文件、保存/加载播放列表、播放本地音乐
 * 依赖组件：BaseButton, BaseProgressBar, SongListTable
 * Source: 规范文档/前端规范文档.md §7 错误处理规范
 */
// 1. Vue 官方 API
import { ref, computed } from 'vue'

// 2. Pinia Store
import { useCurSongDataStore } from '@/stores/Song'

// 3. 工具函数 / 常量
import { showToast } from '@/utils/toast'
import * as mm from 'music-metadata-browser'
import { Buffer } from 'buffer'
import { openDB } from 'idb'

// 5. 子组件导入
import BaseButton from '@/components/base/BaseButton.vue'
import BaseProgressBar from '@/components/base/BaseProgressBar.vue'
import SongListTable from '@/components/business/SongListTable.vue'

window.Buffer = Buffer

const dbPromise = openDB('music-store', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('songs')) {
      db.createObjectStore('songs', { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains('playlists')) {
      db.createObjectStore('playlists', { keyPath: 'id' })
    }
  },
})

const curSongStore = useCurSongDataStore()

const musicFiles = ref([])
const isLoading = ref(false)
const progress = ref(0)
const totalFiles = ref(0)

const localColumns = [
  { key: 'index', type: 'index', width: '48px', label: '#', headerAlign: 'center' },
  { key: 'cover', type: 'cover', width: '48px', label: '', field: 'cover', headerAlign: 'center' },
  { key: 'title', label: '歌曲标题', field: 'title', width: '1fr', cellClass: 'text-sm font-medium truncate text-theme-primary' },
  { key: 'artist', label: '艺术家', field: 'artist', width: '160px' },
  { key: 'album', label: '专辑', field: 'album', width: '160px' },
  { key: 'duration', label: '时长', field: 'duration', width: '70px', headerAlign: 'center' }
]

const handleFileSelect = async () => {
  try {
    const files = await window.electronAPI.selectFiles([
      { name: 'Audio Files', extensions: ['mp3', 'flac', 'wav', 'ogg', 'm4a'] },
    ])
    if (!files || files.length === 0) return

    isLoading.value = true
    progress.value = 0
    totalFiles.value = files.length

    const results = []
    for (const [index, filePath] of files.entries()) {
      try {
        const response = await fetch(`file://${filePath}`)
        const blob = await response.blob()
        const metadata = await mm.parseBlob(blob)
        const coverData = await getCoverArt(metadata)
        const coverUrl = coverData
          ? URL.createObjectURL(new Blob([coverData.data], { type: coverData.format }))
          : null

        const id = Date.now() + '-' + filePath
        const fileName = filePath.split('/').pop().split('\\').pop()

        results.push({
          id,
          name: fileName,
          path: `file://${filePath}`,
          title: metadata.common?.title || fileName.replace(/\.[^/.]+$/, ''),
          artist: metadata.common?.artist || '未知艺术家',
          album: metadata.common?.album || '未知专辑',
          duration: metadata.format?.duration ? parseDuration(metadata.format.duration) : '--:--',
          cover: coverUrl,
        })
      } catch (error) {
        console.error(`处理文件 ${filePath} 时出错:`, error)
      }
      progress.value = Math.round(((index + 1) / files.length) * 100)
    }

    musicFiles.value = [...musicFiles.value, ...results]
    showToast(`成功加载 ${results.length} 首歌曲`, 'success')
  } catch (error) {
    showToast('文件加载失败: ' + error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

const handleDirSelect = async () => {
  try {
    const dirPath = await window.electronAPI.selectDirectory()
    if (!dirPath) return

    isLoading.value = true
    showToast('文件夹选择功能在 Electron 模式下需要递归扫描，当前使用文件选择代替', 'info')
    isLoading.value = false
  } catch (error) {
    showToast('文件夹选择失败: ' + error.message, 'error')
    isLoading.value = false
  }
}

const handlePlay = (song) => {
  curSongStore.setCurSonglist(musicFiles.value)
  curSongStore.setCurrentSong(song)
}

const handleSaveToLocal = async () => {
  try {
    const db = await dbPromise
    const songIds = musicFiles.value.map(song => song.id)
    await db.put('playlists', {
      id: 'current',
      songs: songIds,
    })
    showToast('播放列表已保存到本地', 'success')
  } catch (error) {
    showToast('保存失败: ' + error.message, 'error')
  }
}

const handleLoadFromLocal = async () => {
  try {
    isLoading.value = true
    progress.value = 0
    const db = await dbPromise
    const playlist = await db.get('playlists', 'current')
    if (!playlist) {
      showToast('未找到保存的播放列表', 'warning')
      return
    }

    totalFiles.value = playlist.songs.length
    const songs = []

    for (const [index, songId] of playlist.songs.entries()) {
      const songData = await db.get('songs', songId)
      if (!songData) {
        console.warn(`未找到歌曲ID为 ${songId} 的数据`)
        continue
      }

      const blob = new Blob([songData.arrayBuffer], { type: 'audio/mpeg' })
      const path = URL.createObjectURL(blob)

      let coverUrl = null
      if (songData.metadata.cover) {
        const coverBlob = new Blob(
          [songData.metadata.cover.data],
          { type: songData.metadata.cover.format }
        )
        coverUrl = URL.createObjectURL(coverBlob)
      }

      songs.push({
        id: songData.id,
        name: songData.metadata.name,
        path,
        title: songData.metadata.title,
        artist: songData.metadata.artist,
        album: songData.metadata.album,
        duration: songData.metadata.duration,
        cover: coverUrl,
      })

      progress.value = Math.round(((index + 1) / totalFiles.value) * 100)
    }

    musicFiles.value = songs
    curSongStore.setCurSonglist(songs)
    if (curSongStore.playMode === 'shuffle') {
      curSongStore.generateShuffledList()
    }
    showToast(`成功加载 ${songs.length} 首歌曲`, 'success')
  } catch (error) {
    showToast('加载失败: ' + error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

const getCoverArt = async (metadata) => {
  if (metadata?.common?.picture?.[0]) {
    const picture = metadata.common.picture[0]
    return {
      data: picture.data,
      format: picture.format,
    }
  }
  return null
}

const parseDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="p-5 h-full mb-[60px]">
    <!-- 操作按钮区域 -->
    <header class="flex gap-3 mb-5">
      <BaseButton variant="primary" :loading="isLoading" @click="handleFileSelect">
        <template #icon>
          <font-awesome-icon :icon="['fas', 'file-audio']" class="text-xs" aria-hidden="true" />
        </template>
        添加音乐文件
      </BaseButton>
      <BaseButton variant="outline" :loading="isLoading" @click="handleDirSelect">
        <template #icon>
          <font-awesome-icon :icon="['fas', 'folder-open']" class="text-xs" aria-hidden="true" />
        </template>
        添加音乐文件夹
      </BaseButton>
      <div class="flex-1"></div>
      <BaseButton variant="outline" size="sm" :disabled="isLoading" @click="handleSaveToLocal">
        <template #icon>
          <font-awesome-icon :icon="['fas', 'floppy-disk']" class="text-xs" aria-hidden="true" />
        </template>
        保存列表
      </BaseButton>
      <BaseButton variant="outline" size="sm" :disabled="isLoading" @click="handleLoadFromLocal">
        <template #icon>
          <font-awesome-icon :icon="['fas', 'rotate']" class="text-xs" aria-hidden="true" />
        </template>
        加载列表
      </BaseButton>
    </header>

    <!-- 加载进度条 -->
    <div v-if="isLoading" class="max-w-[500px] my-5">
      <BaseProgressBar :percent="progress" :current="Math.round(totalFiles * progress / 100)" :total="totalFiles" height="6px" />
    </div>

    <!-- 音乐列表 -->
    <SongListTable
      :songs="musicFiles"
      :columns="localColumns"
      empty-text="请添加本地音乐文件"
      @row-click="handlePlay"
    />
  </div>
</template>
