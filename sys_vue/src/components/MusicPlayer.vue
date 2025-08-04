<script setup>
// ---------------------------- 依赖导入 ----------------------------
import { ref, watch } from 'vue'
import { useCurSongDataStore } from '@/stores/Song'
import {
  Star,
  StarFilled,
  VideoPlay,
  VideoPause,
  Refresh,
  List,
  ArrowLeft,
  ArrowRight,
  Mic, Sort, Rank
} from '@element-plus/icons-vue'
import DefaultImg from '@/assets/img/init_img.jpg'

// ---------------------------- 状态管理 ----------------------------
const curSongStore = useCurSongDataStore()

// ---------------------------- 响应式变量 ----------------------------
const volume = ref(80)                 // 音量控制
const audioElement = ref(null)         // 音频元素引用


// ---------------------------- 工具函数 ----------------------------
/**
 * 格式化时间显示（MM:SS）
 * @param {number} seconds - 总秒数
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// ---------------------------- 音频控制方法 ----------------------------
/**
 * 初始化音频元素
 */
const setupAudioElement = () => {
  if (audioElement.value) {
    // 停止旧音频播放
    audioElement.value.pause()
    audioElement.value.currentTime = 0
    curSongStore.resetCurSongCurrentTime()
  } else {
    audioElement.value = new Audio()

    // 添加时间更新监听
    audioElement.value.addEventListener('timeupdate', () => {
      curSongStore.currentTime = audioElement.value.currentTime
    })

    // 添加元数据加载监听
    audioElement.value.addEventListener('loadedmetadata', () => {
      curSongStore.duration = audioElement.value.duration
    })

    // 添加播放结束监听
    audioElement.value.addEventListener('ended', () => {
      curSongStore.nextSong()
    })
  }

  // 更新音频源并播放
  audioElement.value.src = curSongStore.currentSong.path
  audioElement.value.currentTime = curSongStore.currentTime
  audioElement.value.volume = volume.value / 100

  // 自动播放新音频
  if (curSongStore.isPlaying) {
    audioElement.value.play().catch(error => {
      console.error('自动播放失败:', error)
    })
  }
}


// ---------------------------- 监听器 ----------------------------
// 监听当前歌曲变化
watch(() => curSongStore.currentSong, (newSong) => {
  if (newSong) {
    // 添加延迟确保状态更新
    setTimeout(() => {
      setupAudioElement()
    }, 50)
  }
})
// 监听播放状态变化
watch(() => curSongStore.isPlaying, (isPlaying) => {
  if (isPlaying) {
    audioElement.value?.play()
  } else {
    audioElement.value?.pause()
  }
})

// 监听音量变化
watch(volume, (newVal) => {
  if (audioElement.value) {
    audioElement.value.volume = newVal / 100
  }
})

// 监听进度跳转
watch(() => curSongStore.currentTime, (newTime) => {
  if (audioElement.value && Math.abs(audioElement.value.currentTime - newTime) > 1) {
    audioElement.value.currentTime = newTime
  }
})
</script>

<template>
  <!-- 全局播放器容器 -->
  <div class="global-player-bar">
    <!-- 左侧：歌曲信息 -->
    <div class="player-left">
      <el-image :src="curSongStore.currentSong?.cover || DefaultImg" class="cur-song-img" />
      <div class="song-info">
        <div class="song-title">
          {{ curSongStore.currentSong?.title || '未选择歌曲' }}
        </div>
        <div class="song-artist">
          {{ curSongStore.currentSong?.artist || '-' }}
        </div>
      </div>
    </div>

    <!-- 中间：播放控制 -->
    <div class="player-center">
      <!-- 控制按钮组 -->
      <div class="controls">
        <el-icon @click="curSongStore.togglePlayMode()" class="mode-switch">
          <Sort v-if="curSongStore.playMode === 'order'" />
          <Rank v-else />
        </el-icon>
        <el-icon class="play-btn-icon" @click="curSongStore.prevSong()">
          <ArrowLeft />
        </el-icon>
        <el-icon class="play-btn-icon" @click="curSongStore.togglePlay()">
          <VideoPause v-if="curSongStore.isPlaying" />
          <VideoPlay v-else />
        </el-icon>
        <el-icon class="play-btn-icon" @click="curSongStore.nextSong()">
          <ArrowRight />
        </el-icon>
        <el-icon class="play-btn-icon">
          <List />
        </el-icon>
      </div>

      <!-- 进度条容器 -->
      <div class="progress-container">
        <span class="time">{{ formatTime(curSongStore.currentTime) }}</span>


        <!-- 播放进度条 -->
        <el-slider :max="curSongStore.duration" :model-value="curSongStore.currentTime" :format-tooltip="formatTime"
          @input="curSongStore.seek" />
        <span class="time">{{ formatTime(curSongStore.duration) }}</span>
      </div>
    </div>

    <!-- 右侧：音量控制 -->
    <div class="player-right">
      <el-icon class="play-btn-icon">
        <Mic />
      </el-icon>
      <el-slider v-model="volume" :max="100" :show-tooltip="false" class="volume-slider" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 全局播放器样式 */
.global-player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
  background: #fff;
  border-top: 1px solid #ebeef5;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);

  /* 左侧面板样式 */
  .player-left {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 300px;
    cursor: pointer;

    .cur-song-img {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      object-fit: cover;
    }

    .song-info {
      .song-title {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .song-artist {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  /* 中间面板样式 */
  .player-center {
    flex: 1;
    max-width: 600px;

    .controls {
      font-size: 26px;
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 8px;

      .mode-switch {
        font-size: 20px;
        margin-right: 15px;
        transition: transform 0.3s ease;

        &:hover {
          color: var(--el-color-primary);
          transform: scale(1.1);
        }
      }

      .el-icon {
        cursor: pointer;
        color: #606266;
        transition: color 0.3s;

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
      width: 100%;

      .time {
        font-size: 12px;
        color: #909399;
        min-width: 40px;
      }

      :deep(.el-slider) {
        position: relative;
        z-index: 2;
        flex: 1;

        .el-slider__runway {
          height: 4px;
          background-color: #e0e0e0;
        }

        .el-slider__button {
          width: 12px;
          height: 12px;
        }
      }
    }
  }

  /* 右侧面板样式 */
  .player-right {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 200px;

    .volume-slider {
      width: 120px;
    }
  }

  /* 移动端响应式样式 */
  @media screen and (max-width: 768px) {
    padding: 0 10px;
    height: 70px;

    .player-left {
      width: auto;
      gap: 8px;

      .cur-song-img {
        width: 45px;
        height: 45px;
        border-radius: 6px;
      }

      .song-info {
        .song-title {
          font-size: 14px;
          width: 100px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .song-artist {
          font-size: 10px;
          width: 100px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .player-center {
      max-width: none;

      .controls {
        font-size: 20px;
        gap: 15px;
        margin-bottom: 4px;

        .mode-switch {
          font-size: 16px;
          margin-right: 10px;
        }
      }

      .progress-container {
        gap: 6px;

        .time {
          min-width: 35px;
          font-size: 10px;
        }
      }
    }

    .player-right {
      width: auto;

      .volume-slider {
        display: none; // 在移动端隐藏音量滑块以节省空间
      }
    }

    // 应用硬件加速优化性能
    transform: translateZ(0);
    will-change: height,
    padding;
    backface-visibility: hidden;
  }
}
</style>