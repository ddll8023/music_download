<script setup>
/**
 * 全局播放器组件
 * 功能描述：底部固定播放器，支持播放控制、进度拖动、音量调节、播放模式切换
 */
import { ref, watch } from 'vue'
import { useCurSongDataStore } from '@/stores/Song'
import DefaultImg from '@/assets/img/init_img.jpg'

const curSongStore = useCurSongDataStore()
const volume = ref(80)
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

const handleSeek = (e) => {
  const time = Number(e.target.value)
  curSongStore.seek(time)
}

const handleVolumeChange = (e) => {
  volume.value = Number(e.target.value)
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
  <div class="fixed bottom-0 left-0 right-0 h-20 flex items-center justify-between px-6 z-[1000] bg-white border-t border-[#ebeef5] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] max-md:px-2.5 max-md:h-[70px]">
    <!-- 左侧：歌曲信息 -->
    <div class="flex items-center gap-4 w-[300px] cursor-pointer max-md:w-auto max-md:gap-2">
      <img
        :src="curSongStore.currentSong?.cover || DefaultImg"
        alt="封面"
        class="w-[60px] h-[60px] rounded-lg object-cover max-md:w-[45px] max-md:h-[45px] max-md:rounded-md"
      />
      <div class="max-md:max-w-[100px]">
        <div class="text-base font-medium mb-1 truncate max-md:text-sm">
          {{ curSongStore.currentSong?.title || '未选择歌曲' }}
        </div>
        <div class="text-xs text-[#909399] truncate max-md:text-[10px]">
          {{ curSongStore.currentSong?.artist || '-' }}
        </div>
      </div>
    </div>

    <!-- 中间：播放控制 -->
    <div class="flex-1 max-w-[600px] max-md:max-w-none">
      <!-- 控制按钮组 -->
      <div class="text-[26px] flex justify-center gap-5 mb-2 max-md:text-xl max-md:gap-4 max-md:mb-1">
        <button
          class="text-[20px] text-[#606266] hover:text-primary transition-all duration-300 bg-transparent border-none cursor-pointer max-md:text-base max-md:mr-2.5"
          @click="curSongStore.togglePlayMode()"
          :title="curSongStore.playMode === 'order' ? '顺序播放' : '随机播放'"
        >
          <font-awesome-icon :icon="curSongStore.playMode === 'order' ? ['fas', 'repeat'] : ['fas', 'shuffle']" />
        </button>
        <button
          class="text-[#606266] hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
          @click="curSongStore.prevSong()"
          aria-label="上一首"
        >
          <font-awesome-icon :icon="['fas', 'backward-step']" />
        </button>
        <button
          class="text-[#606266] hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
          @click="curSongStore.togglePlay()"
          aria-label="播放/暂停"
        >
          <font-awesome-icon :icon="curSongStore.isPlaying ? ['fas', 'pause'] : ['fas', 'play']" />
        </button>
        <button
          class="text-[#606266] hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
          @click="curSongStore.nextSong()"
          aria-label="下一首"
        >
          <font-awesome-icon :icon="['fas', 'forward-step']" />
        </button>
        <button
          class="text-[#606266] hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
          aria-label="播放列表"
        >
          <font-awesome-icon :icon="['fas', 'list']" />
        </button>
      </div>

      <!-- 进度条 -->
      <div class="flex items-center gap-3 w-full max-md:gap-1.5">
        <span class="text-xs text-[#909399] min-w-[40px] max-md:min-w-[35px] max-md:text-[10px]">
          {{ formatTime(curSongStore.currentTime) }}
        </span>
        <input
          type="range"
          :min="0"
          :max="curSongStore.duration || 0"
          :value="curSongStore.currentTime"
          @input="handleSeek"
          class="flex-1 h-1 bg-gray-300 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <span class="text-xs text-[#909399] min-w-[40px] max-md:min-w-[35px] max-md:text-[10px]">
          {{ formatTime(curSongStore.duration) }}
        </span>
      </div>
    </div>

    <!-- 右侧：音量控制 -->
    <div class="flex items-center gap-3 w-[200px] max-md:w-auto">
      <font-awesome-icon :icon="['fas', 'volume-high']" class="text-[#606266] text-lg" />
      <input
        type="range"
        v-model.number="volume"
        :max="100"
        class="w-[120px] h-1 bg-gray-300 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer max-md:hidden"
        @input="handleVolumeChange"
      />
    </div>
  </div>
</template>
