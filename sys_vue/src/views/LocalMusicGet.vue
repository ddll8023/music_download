<script setup>
/**
 * 本地音乐页
 * 功能描述：导入本地音乐文件、保存/加载播放列表、播放本地音乐
 */
import { ref } from 'vue'
import { showToast } from '@/utils/toast'
import { useCurSongDataStore } from '@/stores/Song'
import * as mm from 'music-metadata-browser'
import { Buffer } from 'buffer'
import { openDB } from 'idb'

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
const fileInput = ref(null)
const dirInput = ref(null)

const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files)
  if (!files.length) return

  try {
    isLoading.value = true
    progress.value = 0

    const audioFiles = files.filter(file =>
      file.type.startsWith('audio/') ||
      file.name.endsWith('.mp3') ||
      file.name.endsWith('.flac')
    )
    totalFiles.value = audioFiles.length

    if (audioFiles.length === 0) {
      showToast('未找到音频文件', 'warning')
      return
    }

    const results = []
    for (const [index, file] of audioFiles.entries()) {
      try {
        const metadata = await mm.parseBlob(file)
        const coverData = await getCoverArt(metadata)
        const coverUrl = coverData
          ? URL.createObjectURL(new Blob([coverData.data], { type: coverData.format }))
          : null

        const id = Date.now() + '-' + file.name + '-' + index

        const arrayBuffer = await file.arrayBuffer()
        const db = await dbPromise
        await db.put('songs', {
          id,
          arrayBuffer,
          metadata: {
            title: metadata.common?.title || file.name.replace(/\.[^/.]+$/, ''),
            artist: metadata.common?.artist || '未知艺术家',
            album: metadata.common?.album || '未知专辑',
            duration: metadata.format?.duration ? parseDuration(metadata.format.duration) : '--:--',
            cover: coverData,
            name: file.name,
          }
        })

        results.push({
          id,
          name: file.name,
          path: URL.createObjectURL(file),
          title: metadata.common?.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: metadata.common?.artist || '未知艺术家',
          album: metadata.common?.album || '未知专辑',
          duration: metadata.format?.duration ? parseDuration(metadata.format.duration) : '--:--',
          cover: coverUrl,
        })
      } catch (error) {
        console.error(`处理文件 ${file.name} 时出错:`, error)
      }
      progress.value = Math.round(((index + 1) / audioFiles.length) * 100)
    }

    musicFiles.value = [...musicFiles.value, ...results]
    showToast(`成功加载 ${results.length} 首歌曲`, 'success')
  } catch (error) {
    showToast('文件加载失败: ' + error.message, 'error')
  } finally {
    isLoading.value = false
    event.target.value = ''
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
    <div class="flex gap-4 mb-5">
      <button
        :disabled="isLoading"
        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        @click="fileInput.click()"
      >
        {{ isLoading ? '加载中...' : '添加音乐文件' }}
      </button>
      <button
        :disabled="isLoading"
        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        @click="dirInput.click()"
      >
        {{ isLoading ? '加载中...' : '添加音乐文件夹' }}
      </button>
      <button
        :disabled="isLoading"
        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        @click="handleSaveToLocal"
      >
        保存播放列表
      </button>
      <button
        :disabled="isLoading"
        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        @click="handleLoadFromLocal"
      >
        加载播放列表
      </button>

      <!-- 隐藏输入控件 -->
      <input ref="fileInput" type="file" multiple accept="audio/*" @change="handleFileSelect" hidden />
      <input ref="dirInput" type="file" multiple webkitdirectory accept="audio/*" @change="handleFileSelect" hidden />
    </div>

    <!-- 加载进度条 -->
    <div v-if="isLoading" class="w-[80%] max-w-[600px] my-5">
      <div class="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
        <div
          :style="{ width: progress + '%' }"
          class="h-full bg-green-500 rounded-full transition-all duration-300 flex items-center justify-center"
        >
          <span v-if="progress > 10" class="text-xs text-white font-medium">
            {{ progress }}%
          </span>
        </div>
      </div>
      <span class="text-sm text-gray-500 mt-1 block">
        {{ Math.round(totalFiles * progress / 100) }}/{{ totalFiles }}
      </span>
    </div>

    <!-- 音乐数据表格 -->
    <table class="w-full rounded-lg shadow-md overflow-hidden bg-white">
      <thead class="bg-gray-50">
        <tr>
          <th class="w-[60px] px-3 py-3 text-center text-sm font-medium text-gray-600">序号</th>
          <th class="w-[70px] px-3 py-3 text-center text-sm font-medium text-gray-600">封面</th>
          <th class="px-3 py-3 text-left text-sm font-medium text-gray-600">歌曲标题</th>
          <th class="px-3 py-3 text-left text-sm font-medium text-gray-600">艺术家</th>
          <th class="px-3 py-3 text-left text-sm font-medium text-gray-600">专辑</th>
          <th class="px-3 py-3 text-left text-sm font-medium text-gray-600">时长</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(song, index) in musicFiles"
          :key="song.id"
          class="hover:bg-gray-50 border-b border-gray-100 transition-colors cursor-pointer"
          @click="handlePlay(song)"
        >
          <td class="w-[60px] px-3 py-3 text-center text-sm text-gray-600">{{ index + 1 }}</td>
          <td class="w-[70px] px-3 py-3 text-center">
            <img
              v-if="song.cover"
              :src="song.cover"
              alt="封面"
              class="w-10 h-10 rounded-lg object-cover inline-block"
            />
            <div
              v-else
              class="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center inline-flex"
            >
              <font-awesome-icon :icon="['fas', 'music']" class="text-gray-400" />
            </div>
          </td>
          <td class="px-3 py-3 text-sm">
            <span class="font-medium text-primary">{{ song.title }}</span>
          </td>
          <td class="px-3 py-3 text-sm text-gray-600">{{ song.artist }}</td>
          <td class="px-3 py-3 text-sm text-gray-600">{{ song.album }}</td>
          <td class="px-3 py-3 text-sm text-gray-600">{{ song.duration }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
