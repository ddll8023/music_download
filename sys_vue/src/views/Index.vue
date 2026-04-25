<script setup>
/**
 * 布局框架页
 * 功能描述：全局布局（Header + Sidebar + Main + Player）
 * 依赖组件：MusicPlayer
 */
import { reactive, ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DefaultImg from '@/assets/img/init_img.jpg'
import MusicPlayer from '@/components/MusicPlayer.vue'

const data = reactive({ DefaultImg })
const router = useRouter()

const isCollapse = ref(false)
const isMobile = ref(false)
const isTransitioning = ref(false)

const asideWidth = computed(() => {
  if (isMobile.value) {
    return isCollapse.value ? '0' : '60px'
  }
  return isCollapse.value ? '64px' : '200px'
})

const mainStyle = computed(() => {
  if (isMobile.value) {
    if (!isCollapse.value) {
      return { marginLeft: '60px', width: 'calc(100% - 60px)', padding: '15px 10px' }
    }
    return { marginLeft: '0', width: '100%', padding: '15px 10px' }
  }
  return {
    marginLeft: isCollapse.value ? '64px' : '200px',
    width: isCollapse.value ? 'calc(100% - 64px)' : 'calc(100% - 200px)',
    padding: '20px'
  }
})

const menuItems = [
  { path: '/home', label: '音乐下载', icon: 'house' },
  { path: '/localmusic', label: '本地音乐', icon: 'headphones' }
]

const currentPath = computed(() => router.currentRoute.value.path)

const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    isCollapse.value = true
  }
}

const toggleCollapse = () => {
  isTransitioning.value = true
  isCollapse.value = !isCollapse.value
  setTimeout(() => {
    isTransitioning.value = false
  }, 300)
}

const handleMenuClick = (path) => {
  router.push(path)
  if (isMobile.value) {
    isCollapse.value = true
  }
}

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full h-[60px] bg-gradient-to-r from-[#2a3042] to-[#1a1f2e] z-50 shadow-md">
      <div class="flex items-center justify-between h-full px-4">
        <!-- 左侧：折叠按钮 + Logo + 标题 -->
        <div class="flex items-center gap-4">
          <button
            class="p-2.5 flex items-center justify-center bg-transparent border-none cursor-pointer"
            @click="toggleCollapse"
          >
            <font-awesome-icon
              :icon="isCollapse ? ['fas', 'angles-right'] : ['fas', 'angles-left']"
              class="text-white text-xl"
            />
          </button>
          <img :src="data.DefaultImg" alt="Logo" class="w-[50px] h-[50px] rounded-full object-cover" />
          <h1 v-if="!isMobile" class="text-white m-0 text-2xl font-medium">音乐平台</h1>
        </div>

        <!-- 右侧：用户头像 -->
        <div class="flex items-center gap-2.5 text-white cursor-pointer hover:text-primary transition-colors">
          <img :src="data.DefaultImg" alt="用户" class="w-11 h-11 rounded-full object-cover" />
          <span v-if="!isMobile" class="text-base">用户</span>
        </div>
      </div>
    </header>

    <!-- 侧边栏 -->
    <aside
      :style="{ width: asideWidth, minWidth: asideWidth }"
      :class="[
        'fixed top-[60px] left-0 h-screen bg-[#2a3042] transition-all duration-300 z-40 overflow-hidden',
        { 'pointer-events-none': isTransitioning },
        { 'mobile:translate-x-[-100%]': isMobile && isCollapse }
      ]"
    >
      <!-- 移动端遮罩层 -->
      <div
        v-if="isMobile && !isCollapse"
        class="fixed top-[60px] left-0 right-0 bottom-0 bg-black/50 z-[39]"
        @click="toggleCollapse"
      ></div>

      <nav class="pt-5 h-full">
        <div
          v-for="item in menuItems"
          :key="item.path"
          :class="[
            'flex items-center gap-3 h-14 px-5 cursor-pointer transition-all duration-300',
            currentPath === item.path
              ? 'bg-primary/12 border-l-4 border-primary text-primary'
              : 'text-[#b5b6bd] hover:bg-white/5 hover:text-white'
          ]"
          @click="handleMenuClick(item.path)"
        >
          <font-awesome-icon :icon="['fas', item.icon]" class="text-lg" />
          <span v-if="!isCollapse || isMobile" class="text-base whitespace-nowrap">{{ item.label }}</span>
        </div>
      </nav>
    </aside>

    <!-- 主内容 -->
    <main
      :style="mainStyle"
      :class="[
        'mt-[60px] bg-gray-100 transition-all duration-300 min-h-[calc(100vh-60px)]',
        { 'pointer-events-none': isTransitioning }
      ]"
    >
      <router-view />
    </main>

    <!-- 全局播放器 -->
    <MusicPlayer />
  </div>
</template>
