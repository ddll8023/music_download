file: LocalMusicGet.vue

<script setup>
/* ************ 依赖导入 ************ */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useCurSongDataStore } from '@/stores/Song'
import * as mm from 'music-metadata-browser'
import { Buffer } from 'buffer'
import { openDB } from 'idb'

/* ************ 全局配置 ************ */
window.Buffer = Buffer // 兼容浏览器环境Buffer处理

/* ************ 数据库初始化 ************ */
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

/* ************ 状态管理 ************ */
const curSongStore = useCurSongDataStore() // 歌曲状态管理

/* ************ 响应式数据 ************ */
const musicFiles = ref([])        // 存储音乐文件数据
const isLoading = ref(false)      // 加载状态标识
const progress = ref(0)           // 加载进度百分比
const totalFiles = ref(0)         // 总文件数量
const fileInput = ref(null)       // 文件输入框引用
const dirInput = ref(null)        // 目录输入框引用

/* ************ 事件处理 ************ */
// 文件选择处理函数
const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files)
  if (!files.length) return

  try {
    // 初始化加载状态
    isLoading.value = true
    progress.value = 0

    // 过滤音频文件
    const audioFiles = files.filter(file =>
        file.type.startsWith('audio/') ||
        file.name.endsWith('.mp3') ||
        file.name.endsWith('.flac')
    )
    totalFiles.value = audioFiles.length

    if (audioFiles.length === 0) {
      ElMessage.warning('未找到音频文件')
      return
    }

    // 处理元数据解析
    const results = []
    for (const [index, file] of audioFiles.entries()) {
      try {
        const metadata = await mm.parseBlob(file)
        const coverData = await getCoverArt(metadata)
        const coverUrl = coverData ? URL.createObjectURL(new Blob([coverData.data], { type: coverData.format })) : null

        // 生成唯一ID
        const id = Date.now() + '-' + file.name + '-' + index

        // 保存到数据库
        const arrayBuffer = await file.arrayBuffer()
        const db = await dbPromise
        await db.put('songs', {
          id,
          arrayBuffer,
          metadata: {
            title: metadata.common?.title || file.name.replace(/\.[^/.]+$/, ""),
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
          title: metadata.common?.title || file.name.replace(/\.[^/.]+$/, ""),
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

    // 更新音乐文件列表
    musicFiles.value = [...musicFiles.value, ...results]
    ElMessage.success(`成功加载 ${results.length} 首歌曲`)
  } catch (error) {
    ElMessage.error('文件加载失败: ' + error.message)
  } finally {
    isLoading.value = false
    event.target.value = ''  // 清空输入框
  }
}

// 播放处理函数
const handlePlay = (song) => {
  curSongStore.setCurSonglist(musicFiles.value)
  curSongStore.setCurrentSong(song)
}

// 保存到本地处理函数
const handleSaveToLocal = async () => {
  try {
    const db = await dbPromise
    const songIds = musicFiles.value.map(song => song.id)
    await db.put('playlists', {
      id: 'current',
      songs: songIds,
    })
    ElMessage.success('播放列表已保存到本地')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  }
}

// 从本地加载处理函数
const handleLoadFromLocal = async () => {
  try {
    isLoading.value = true
    progress.value = 0 // 初始化进度
    const db = await dbPromise
    const playlist = await db.get('playlists', 'current')
    if (!playlist) {
      ElMessage.warning('未找到保存的播放列表')
      return
    }

    totalFiles.value = playlist.songs.length // 设置总文件数
    const songs = []

    // 使用带索引的遍历
    for (const [index, songId] of playlist.songs.entries()) {
      const songData = await db.get('songs', songId)
      if (!songData) {
        console.warn(`未找到歌曲ID为 ${songId} 的数据`)
        continue
      }

      // 生成Blob URL
      const blob = new Blob([songData.arrayBuffer], { type: 'audio/mpeg' })
      const path = URL.createObjectURL(blob)

      // 处理封面
      let coverUrl = null
      if (songData.metadata.cover) {
        const coverBlob = new Blob([songData.metadata.cover.data],
            { type: songData.metadata.cover.format })
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

      // 更新进度（每个文件处理完成后更新）
      progress.value = Math.round(((index + 1) / totalFiles.value) * 100)
    }

    musicFiles.value = songs
    curSongStore.setCurSonglist(songs)
    if (curSongStore.playMode === 'shuffle') {
      curSongStore.generateShuffledList()
    }
    ElMessage.success(`成功加载 ${songs.length} 首歌曲`)
  } catch (error) {
    ElMessage.error('加载失败: ' + error.message)
  } finally {
    isLoading.value = false
  }
}

/* ************ 工具函数 ************ */
// 获取专辑封面数据
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

// 转换时长格式（秒 => mm:ss）
const parseDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="local-music-container">
    <!-- 操作按钮区域 -->
    <div class="header">
      <el-button
          type="primary"
          :disabled="isLoading"
          @click="fileInput.click()"
          style="margin-right: 10px"
      >
        {{ isLoading ? '加载中...' : '添加音乐文件' }}
      </el-button>
      <el-button
          type="primary"
          :disabled="isLoading"
          @click="dirInput.click()"
      >
        {{ isLoading ? '加载中...' : '添加音乐文件夹' }}
      </el-button>
      <el-button
          type="primary"
          :disabled="isLoading"
          @click="handleSaveToLocal"
      >
        保存播放列表
      </el-button>
      <el-button
          type="primary"
          :disabled="isLoading"
          @click="handleLoadFromLocal"
      >
        加载播放列表
      </el-button>

      <!-- 隐藏输入控件 -->
      <input ref="fileInput" type="file" multiple accept="audio/*" @change="handleFileSelect" hidden>
      <input ref="dirInput" type="file" multiple webkitdirectory accept="audio/*" @change="handleFileSelect" hidden>
    </div>

    <!-- 加载进度条 -->
    <el-progress
        v-if="isLoading"
        :percentage="progress"
        :text-inside="true"
        :stroke-width="20"
        status="success"
        class="loading-progress"
    >
      <span>{{ progress }}% ({{ Math.round(totalFiles * progress / 100) }}/{{ totalFiles }})</span>
    </el-progress>

    <!-- 音乐数据表格 -->
    <el-table
        v-loading="isLoading"
        :data="musicFiles"
        class="music-table"
        @row-click="handlePlay"
    >
      <el-table-column type="index" label="序号" width="60"/>
      <el-table-column prop="cover" label="封面" width="70">
        <template #default="{ row }">
          <el-image class="song-cover" :src="row.cover" fit="cover"/>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="歌曲标题" >
        <template #default="{ row }">
          <div class="song-title">
            <span class="text">{{ row.title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="artist" label="艺术家" />
      <el-table-column prop="album" label="专辑" />
      <el-table-column prop="duration" label="时长" />
    </el-table>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/LocalMusicGet';
</style>
