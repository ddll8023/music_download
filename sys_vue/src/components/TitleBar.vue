<script setup>
/**
 * TitleBar 标题栏组件
 * 功能描述：Electron 自定义标题栏，支持最小化、最大化、关闭操作
 * 依赖组件：无
 * Source: Electron BrowserWindow 自定义标题栏
 */
import { ref, onMounted, onUnmounted } from 'vue'
import DefaultImg from '@/assets/img/init_img.jpg'

const isMaximized = ref(false)

const handleMinimize = () => window.electronAPI?.windowMinimize()
const handleMaximize = () => window.electronAPI?.windowMaximize()
const handleClose = () => window.electronAPI?.windowClose()

const checkMaximized = async () => {
  if (window.electronAPI?.windowIsMaximized) {
    isMaximized.value = await window.electronAPI.windowIsMaximized()
  }
}

onMounted(() => {
  checkMaximized()
  window.addEventListener('resize', checkMaximized)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMaximized)
})
</script>

<template>
  <header class="title-bar fixed top-0 left-0 right-0 h-9 z-[9999] flex items-center justify-between bg-titlebar select-none">
    <div class="flex items-center gap-2.5 pl-4 h-full">
      <img :src="DefaultImg" alt="Logo" class="w-5 h-5 rounded-full object-cover opacity-90" />
      <span class="text-[13px] text-gray-400 font-medium tracking-wide">音乐平台</span>
    </div>

    <div class="flex items-center h-full">
      <button
        class="title-bar-btn w-11 h-full flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        @click="handleMinimize"
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor"><rect width="10" height="1"/></svg>
      </button>
      <button
        class="title-bar-btn w-11 h-full flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        @click="handleMaximize"
      >
        <svg v-if="!isMaximized" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2">
          <rect x="0.6" y="0.6" width="8.8" height="8.8"/>
        </svg>
        <svg v-else width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2">
          <rect x="2" y="0" width="8" height="8" rx="0.5"/>
          <rect x="0" y="2" width="8" height="8" rx="0.5"/>
        </svg>
      </button>
      <button
        class="title-bar-btn title-bar-btn-close w-11 h-full flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:bg-[#e81123] hover:text-white transition-colors"
        @click="handleClose"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
          <line x1="0" y1="0" x2="10" y2="10"/>
          <line x1="10" y1="0" x2="0" y2="10"/>
        </svg>
      </button>
    </div>
  </header>
</template>
