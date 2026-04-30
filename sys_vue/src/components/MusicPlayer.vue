<script setup>
/**
 * MusicPlayer 全局播放器组件
 * 功能描述：底部固定播放器，支持播放控制、进度拖动、音量调节、播放模式切换
 * 依赖组件：无
 * Source: 规范文档/前端规范文档.md §3.6 Tailwind 动态类名
 */
import { ref, watch } from 'vue'
import { useCurSongDataStore } from '@/stores/Song'
import BaseSlider from '@/components/base/BaseSlider.vue'
import DefaultImg from '@/assets/img/init_img.jpg'

const curSongStore = useCurSongDataStore()
const volume = ref(80)
const previousVolume = ref(80)
const audioElement = ref(null)

const formatTime = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const setupAudioElement = () => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.currentTime = 0
    curSongStore.resetCurSongCurrentTime()
  } else {
    audioElement.value = new Audio()

    audioElement.value.addEventListener('timeupdate', () => {
      curSongStore.currentTime = audioElement.value.currentTime
    })

    audioElement.value.addEventListener('loadedmetadata', () => {
      curSongStore.duration = audioElement.value.duration
    })

    audioElement.value.addEventListener('ended', () => {
      curSongStore.nextSong()
    })
  }

  audioElement.value.src = curSongStore.currentSong.path
  audioElement.value.currentTime = curSongStore.currentTime
  audioElement.value.volume = volume.value / 100

  if (curSongStore.isPlaying) {
    audioElement.value.play().catch(error => {
      console.error('自动播放失败:', error)
    })
  }
}

const handleSeek = (time) => {
  curSongStore.seek(Number(time))
}

const handleVolumeChange = (val) => {
  volume.value = Number(val)
}

const toggleMute = () => {
  if (volume.value > 0) {
    previousVolume.value = volume.value
    volume.value = 0
  } else {
    volume.value = previousVolume.value || 80
  }
}

watch(() => curSongStore.currentSong, (newSong) => {
  if (newSong) {
    setTimeout(() => {
      setupAudioElement()
    }, 50)
  }
})

watch(() => curSongStore.isPlaying, (isPlaying) => {
  if (isPlaying) {
    audioElement.value?.play()
  } else {
    audioElement.value?.pause()
  }
})

watch(volume, (newVal) => {
  if (audioElement.value) {
    audioElement.value.volume = newVal / 100
  }
})

watch(() => curSongStore.currentTime, (newTime) => {
  if (audioElement.value && Math.abs(audioElement.value.currentTime - newTime) > 1) {
    audioElement.value.currentTime = newTime
  }
})
</script>

<template>
  <!-- 全局播放器容器 -->
  <div class="fixed bottom-0 left-0 right-0 h-20 flex items-center justify-between px-6 z-[1000] player-bar">
    <!-- 左侧：歌曲信息 -->
    <div class="flex items-center gap-3.5 w-[280px]">
      <div class="relative">
        <img
          :src="curSongStore.currentSong?.cover || DefaultImg"
          alt="封面"
          class="w-12 h-12 rounded-lg object-cover player-cover"
        />
        <div
          v-if="curSongStore.isPlaying"
          class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center playing-indicator"
        >
          <font-awesome-icon :icon="['fas', 'volume-high']" class="text-[7px] text-white" aria-hidden="true" />
        </div>
      </div>
      <div class="min-w-0">
        <div class="text-sm font-medium truncate text-theme-text">
          {{ curSongStore.currentSong?.title || '未选择歌曲' }}
        </div>
        <div class="text-xs truncate mt-0.5 text-theme-text-secondary">
          {{ curSongStore.currentSong?.artist || '-' }}
        </div>
      </div>
    </div>

    <!-- 中间：播放控制 -->
    <div class="flex-1 max-w-[560px]">
      <!-- 控制按钮组 -->
      <div class="text-[20px] flex justify-center items-center gap-4 mb-2">
        <button
          class="text-sm p-1.5 rounded-md transition-all duration-200 bg-transparent border-none cursor-pointer"
          :class="curSongStore.playMode === 'shuffle' ? 'text-primary' : 'ctrl-btn'"
          @click="curSongStore.togglePlayMode()"
          :title="curSongStore.playMode === 'order' ? '顺序播放' : '随机播放'"
          :aria-label="curSongStore.playMode === 'order' ? '顺序播放' : '随机播放'"
        >
          <font-awesome-icon :icon="curSongStore.playMode === 'order' ? ['fas', 'repeat'] : ['fas', 'shuffle']" aria-hidden="true" />
        </button>
        <button
          class="p-1 rounded-md transition-colors duration-200 bg-transparent border-none cursor-pointer ctrl-btn"
          @click="curSongStore.prevSong()"
          aria-label="上一首"
        >
          <font-awesome-icon :icon="['fas', 'backward-step']" aria-hidden="true" />
        </button>
        <button
          class="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border-none cursor-pointer"
          :class="curSongStore.isPlaying ? 'play-btn-active' : 'play-btn-default'"
          @click="curSongStore.togglePlay()"
          aria-label="播放/暂停"
        >
          <font-awesome-icon :icon="curSongStore.isPlaying ? ['fas', 'pause'] : ['fas', 'play']" class="text-sm" :class="!curSongStore.isPlaying ? 'ml-[2px]' : ''" aria-hidden="true" />
        </button>
        <button
          class="p-1 rounded-md transition-colors duration-200 bg-transparent border-none cursor-pointer ctrl-btn"
          @click="curSongStore.nextSong()"
          aria-label="下一首"
        >
          <font-awesome-icon :icon="['fas', 'forward-step']" aria-hidden="true" />
        </button>
        <button
          class="text-sm p-1.5 rounded-md transition-colors duration-200 bg-transparent border-none cursor-pointer ctrl-btn"
          aria-label="播放列表"
        >
          <font-awesome-icon :icon="['fas', 'list']" aria-hidden="true" />
        </button>
      </div>

      <!-- 进度条 -->
      <div class="flex items-center gap-2.5 w-full">
        <span class="text-[11px] tabular-nums min-w-[36px] text-right text-theme-text-secondary">
          {{ formatTime(curSongStore.currentTime) }}
        </span>
        <BaseSlider
          :model-value="curSongStore.currentTime"
          :min="0"
          :max="curSongStore.duration || 0"
          height="4px"
          class="flex-1"
          @update:model-value="handleSeek"
        />
        <span class="text-[11px] tabular-nums min-w-[36px] text-theme-text-secondary">
          {{ formatTime(curSongStore.duration) }}
        </span>
      </div>
    </div>

    <!-- 右侧：音量控制 -->
    <div class="flex items-center gap-2.5 w-[180px] justify-end">
      <button
        class="p-1 bg-transparent border-none cursor-pointer transition-colors duration-200 ctrl-btn"
        :aria-label="volume === 0 ? '取消静音' : '静音'"
        @click="toggleMute"
      >
        <font-awesome-icon :icon="volume === 0 ? ['fas', 'volume-xmark'] : volume < 50 ? ['fas', 'volume-low'] : ['fas', 'volume-high']" class="text-sm" aria-hidden="true" />
      </button>
      <BaseSlider
        :model-value="volume"
        :min="0"
        :max="100"
        height="4px"
        class="w-[100px]"
        @update:model-value="handleVolumeChange"
      />
      <span class="text-[11px] tabular-nums min-w-[28px] text-right text-theme-text-secondary">{{ volume }}</span>
    </div>
  </div>
</template>

<style scoped>
.player-bar {
  background: linear-gradient(180deg, rgba(26, 29, 46, 0.95), rgba(18, 20, 28, 0.98));
  border-top: 1px solid var(--color-border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.player-cover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.playing-indicator {
  background: var(--color-primary);
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.5);
}

.ctrl-btn {
  color: var(--color-text-secondary);
}
.ctrl-btn:hover {
  color: var(--color-text);
}

.play-btn-active {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 0 16px rgba(64, 158, 255, 0.35);
}

.play-btn-default {
  background: var(--color-elevated);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
</style>
