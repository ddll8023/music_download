<script setup>
/**
 * Index 布局框架页
 * 功能描述：全局布局（TitleBar + Sidebar + Main + Player）
 * 依赖组件：TitleBar, MusicPlayer
 * Source: 规范文档/前端规范文档.md §5 页面组织规范
 */
// 1. Vue 官方 API
import { reactive, ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'

// 5. 子组件 / 资源导入
import DefaultImg from '@/assets/img/init_img.jpg'
import MusicPlayer from '@/components/MusicPlayer.vue'
import TitleBar from '@/components/TitleBar.vue'

const data = reactive({ DefaultImg })
const router = useRouter()

const isCollapse = ref(false)
const isTransitioning = ref(false)

const asideStyle = computed(() => ({
  top: 'var(--titlebar-height)',
  width: isCollapse.value ? '64px' : '200px',
  minWidth: isCollapse.value ? '64px' : '200px'
}))

const mainStyle = computed(() => ({
  marginTop: 'var(--titlebar-height)',
  marginLeft: isCollapse.value ? '64px' : '200px',
  width: isCollapse.value ? 'calc(100% - 64px)' : 'calc(100% - 200px)',
  paddingTop: '20px',
  paddingBottom: '100px',
  paddingLeft: '20px',
  paddingRight: '20px'
}))

const menuItems = [
  { path: '/home', label: '音乐下载', icon: 'house' },
  { path: '/localmusic', label: '本地音乐', icon: 'headphones' }
]

const currentPath = computed(() => router.currentRoute.value.path)

const toggleCollapse = () => {
  isTransitioning.value = true
  isCollapse.value = !isCollapse.value
  setTimeout(() => {
    isTransitioning.value = false
  }, 300)
}

const handleMenuClick = (path) => {
  router.push(path)
}
</script>

<template>
  <div class="min-h-screen bg-theme-bg">
    <!-- 自定义标题栏 -->
    <TitleBar />

    <!-- 侧边栏 -->
    <aside
      :style="asideStyle"
      :class="[
        'sidebar-panel fixed left-0 h-screen transition-all duration-300 z-40 overflow-hidden',
        { 'pointer-events-none': isTransitioning }
      ]"
    >
      <nav class="h-full flex flex-col relative z-10">
        <!-- Logo 区域 -->
        <div class="sidebar-logo-area px-4 pt-5 pb-4">
          <div class="flex items-center gap-3">
            <div class="sidebar-logo-icon">
              <font-awesome-icon :icon="['fas', 'music']" class="text-white text-sm" />
            </div>
            <div v-if="!isCollapse" class="flex flex-col">
              <span class="sidebar-brand-name">MUSICHUB</span>
              <div class="sidebar-brand-line"></div>
            </div>
          </div>
        </div>

        <!-- 菜单区域 -->
        <div class="flex-1 px-2 mt-1">
          <div v-if="!isCollapse" class="px-3 mb-2">
            <span class="sidebar-section-label">导航</span>
          </div>
          <div
            v-for="item in menuItems"
            :key="item.path"
            :class="[
              'sidebar-nav-item',
              currentPath === item.path ? 'sidebar-nav-active' : 'sidebar-nav-default',
              isCollapse ? 'sidebar-nav-collapsed' : ''
            ]"
            @click="handleMenuClick(item.path)"
          >
            <div class="sidebar-nav-indicator" v-if="currentPath === item.path"></div>
            <font-awesome-icon :icon="['fas', item.icon]" class="sidebar-nav-icon" />
            <span v-if="!isCollapse" class="sidebar-nav-label">{{ item.label }}</span>
          </div>
        </div>

        <!-- 折叠按钮（融入侧边栏右边缘） -->
        <button class="sidebar-collapse-btn" @click="toggleCollapse">
          <font-awesome-icon
            :icon="isCollapse ? ['fas', 'angles-right'] : ['fas', 'angles-left']"
            class="text-[9px]"
          />
        </button>

        <!-- 底部用户区域 -->
        <div class="sidebar-user-section px-3 pb-4">
          <div class="sidebar-user-divider"></div>
          <div class="sidebar-user-card">
            <div class="sidebar-user-avatar">
              <img :src="data.DefaultImg" alt="用户" class="w-full h-full object-cover" />
            </div>
            <div v-if="!isCollapse" class="flex flex-col min-w-0">
              <span class="sidebar-user-name">用户</span>
              <span class="sidebar-user-status">
                <span class="sidebar-status-dot"></span>
                在线
              </span>
            </div>
          </div>
        </div>
      </nav>

      <!-- 右侧边缘光线 -->
      <div class="sidebar-edge-glow"></div>
    </aside>

    <!-- 主内容 -->
    <main
      :style="mainStyle"
      :class="[
        'transition-all duration-300 min-h-screen',
        { 'pointer-events-none': isTransitioning }
      ]"
      class="bg-theme-bg"
    >
      <router-view />
    </main>

    <!-- 全局播放器 -->
    <MusicPlayer />
  </div>
</template>

<style scoped>
/* ===== 侧边栏面板 ===== */
.sidebar-panel {
  background: linear-gradient(180deg, var(--color-sidebar-top), var(--color-sidebar-bottom));
}

.sidebar-edge-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 5%,
    rgba(255, 255, 255, 0.06) 30%,
    rgba(64, 158, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.06) 70%,
    transparent 95%
  );
  pointer-events: none;
}

/* ===== Logo 区域 ===== */
.sidebar-logo-area {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.sidebar-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), #6c5ce7);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.25);
  flex-shrink: 0;
}

.sidebar-brand-name {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 2.5px;
  color: var(--color-text);
  line-height: 1.2;
}

.sidebar-brand-line {
  height: 1.5px;
  margin-top: 3px;
  border-radius: 1px;
  background: linear-gradient(90deg, var(--color-primary), #6c5ce7, transparent);
  width: 100%;
}

/* ===== 菜单区域 ===== */
.sidebar-section-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 3px;
  font-weight: 600;
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.sidebar-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 42px;
  margin-bottom: 2px;
  padding: 0 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 2px solid transparent;
}

.sidebar-nav-collapsed {
  justify-content: center;
  padding: 0;
}

.sidebar-nav-icon {
  font-size: 15px;
  width: 20px;
  text-align: center;
  transition: transform 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}

.sidebar-nav-label {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

/* 导航 — 选中态：左侧亮线 + 背景微光 */
.sidebar-nav-active {
  background: rgba(64, 158, 255, 0.08);
  border-left-color: var(--color-sidebar-indicator);
  color: var(--color-text);
}

.sidebar-nav-active .sidebar-nav-icon {
  color: var(--color-primary);
}

.sidebar-nav-active .sidebar-nav-label {
  color: var(--color-text);
}

/* 导航指示器 — 选中项左侧发光竖线 */
.sidebar-nav-indicator {
  position: absolute;
  left: -2px;
  top: 25%;
  bottom: 25%;
  width: 2px;
  border-radius: 1px;
  background: var(--color-primary);
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.6), 0 0 16px rgba(64, 158, 255, 0.3);
}

/* 导航 — 默认态 */
.sidebar-nav-default {
  color: var(--color-text-secondary);
}

.sidebar-nav-default:hover {
  background: var(--color-hover-overlay);
  color: var(--color-text);
}

.sidebar-nav-default:hover .sidebar-nav-icon {
  transform: translateY(-1px);
  color: var(--color-text);
}

/* ===== 折叠按钮（融入侧边栏底部） ===== */
.sidebar-collapse-btn {
  position: absolute;
  right: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-sidebar-bottom);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-right: none;
  border-radius: 4px 0 0 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.25s ease;
  z-index: 20;
  opacity: 0;
  padding: 0;
}

.sidebar-panel:hover .sidebar-collapse-btn {
  opacity: 0.7;
}

.sidebar-collapse-btn:hover {
  opacity: 1 !important;
  width: 22px;
  right: -1px;
  color: var(--color-primary);
  background: var(--color-surface);
  border-color: rgba(64, 158, 255, 0.15);
}

/* ===== 底部用户区域 ===== */
.sidebar-user-section {
  margin-top: auto;
}

.sidebar-user-divider {
  height: 1px;
  margin-bottom: 12px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
}

.sidebar-user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.sidebar-user-card:hover {
  background: var(--color-hover-overlay);
}

.sidebar-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.sidebar-user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.2;
}

.sidebar-user-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 1px;
}

.sidebar-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 6px rgba(52, 211, 153, 0.5);
}
</style>
