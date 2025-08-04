<script setup>
import { User, House, Histogram, Setting, Headset, Fold, Expand } from '@element-plus/icons-vue';
import DefaultImg from '@/assets/img/init_img.jpg'
import MusicPlayer from '@/components/MusicPlayer.vue'

import { reactive, ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";

const data = reactive({
  DefaultImg
})
const router = useRouter()

// 响应式相关变量
const isCollapse = ref(false); // 控制侧边栏折叠状态
const isMobile = ref(false); // 是否为移动端
const isTransitioning = ref(false); // 添加过渡状态标记

// 计算侧边栏宽度 - 修改计算逻辑
const asideWidth = computed(() => {
  if (isMobile.value) {
    return isCollapse.value ? '0' : '60px'; // 移动端根据折叠状态切换宽度
  }
  return isCollapse.value ? '64px' : '200px';
});

// 检测屏幕尺寸变化
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768;
  // 在移动端默认折叠菜单
  if (isMobile.value) {
    isCollapse.value = true;
  }
};

// 切换菜单折叠状态，改进版
const toggleCollapse = () => {
  isTransitioning.value = true;
  isCollapse.value = !isCollapse.value;

  // 过渡动画结束后清除标记
  setTimeout(() => {
    isTransitioning.value = false;
  }, 300); // 与过渡时间相匹配
};

// 菜单项点击处理
const handleMenuClick = (path) => {
  router.push(path);
  // 移动端点击菜单项后自动收起侧边栏
  if (isMobile.value) {
    isCollapse.value = true;
  }
};

// 监听窗口大小变化
onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});
</script>

<template>
  <el-container>
    <el-header>
      <div class="header-content">
        <div class="brand">
          <el-button type="text" class="collapse-btn" @click="toggleCollapse">
            <el-icon :size="24" color="#fff">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
          </el-button>
          <el-image :src="data.DefaultImg" class="logo"></el-image>
          <h1 class="title" :class="{ 'hidden-on-mobile': isMobile }">音乐平台</h1>
        </div>
        <div class="user-info">
          <el-avatar :size="isMobile ? 35 : 45" :src="data.DefaultImg" class="mr-2">
            <el-icon>
              <User />
            </el-icon>
          </el-avatar>
          <span :class="{ 'hidden-on-mobile': isMobile }">用户</span>
        </div>
      </div>
    </el-header>
    <el-aside :width="asideWidth" :class="{
      'hidden': isMobile && isCollapse,
      'mobile-aside': isMobile,
      'collapsed': isCollapse,
      'transitioning': isTransitioning
    }">
      <div class="sidebar-overlay" v-if="isMobile && !isCollapse" @click="toggleCollapse"></div>

      <!-- 使用自定义菜单替代 el-menu 在移动端 -->
      <div v-if="isMobile" class="mobile-menu">
        <div class="mobile-menu-item" :class="{ active: router.currentRoute.value.path === '/home' }"
          @click="handleMenuClick('/home')">
          <el-icon>
            <House />
          </el-icon>
        </div>
        <div class="mobile-menu-item" :class="{ active: router.currentRoute.value.path === '/localmusic' }"
          @click="handleMenuClick('/localmusic')">
          <el-icon>
            <Headset />
          </el-icon>
        </div>
      </div>

      <!-- 桌面端使用常规菜单 -->
      <el-menu v-else active-text-color="#409EFF" background-color="#2a3042" text-color="#b5b6bd" :collapse="isCollapse"
        :default-active="router.currentRoute.value.path" router>
        <el-menu-item index="/home">
          <el-icon>
            <House />
          </el-icon>
          <template #title><span>音乐下载</span></template>
        </el-menu-item>
        <el-menu-item index="/localmusic">
          <el-icon>
            <Headset />
          </el-icon>
          <template #title><span>本地音乐</span></template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main :class="{
      'full-width': isCollapse && !isMobile,
      'mobile-main': isMobile,
      'mobile-main-expanded': isMobile && !isCollapse,
      'transitioning': isTransitioning
    }">
      <router-view />
    </el-main>
    <!-- <MusicPlayer /> -->
  </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/Index";

// 响应式样式补充
.collapse-btn {
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
}

.hidden-on-mobile {
  @media screen and (max-width: 768px) {
    display: none;
  }
}

.full-width {
  width: calc(100% - 64px) !important;
  margin-left: 64px !important;
}

.mobile-main {
  width: 100% !important;
  margin-left: 0 !important;
  padding: 15px 10px !important;

  &:not(.hidden) {
    width: calc(100% - 60px) !important;
    margin-left: 60px !important;
  }
}

.hidden {
  transform: translateX(-100%);
}

.sidebar-overlay {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.logo {
  @media screen and (max-width: 768px) {
    width: 40px !important;
    height: 40px !important;
  }
}

:deep(.el-menu) {
  .el-menu-item {
    display: flex !important;
    align-items: center !important;

    .el-icon {
      margin-right: 5px;
      font-size: 18px;
    }
  }
}

// 移动端菜单样式
.mobile-aside {
  width: 60px !important;
}

.mobile-menu {
  display: flex;
  flex-direction: column;
  padding-top: 20px;
  height: 100%;
  background-color: #2a3042;

  .mobile-menu-item {
    width: 100%;
    height: 56px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;

    .el-icon {
      color: #b5b6bd;
      font-size: 22px;
      transition: color 0.3s ease;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);

      .el-icon {
        color: #ffffff;
      }
    }

    &.active {
      background-color: rgba(64, 158, 255, 0.12);
      border-left: 3px solid #409EFF;

      .el-icon {
        color: #409EFF;
      }
    }
  }
}

// 响应式样式更新
.collapsed {
  width: 0 !important;
  min-width: 0 !important;
  overflow: hidden;

  &:not(.mobile-aside) {
    width: 64px !important;
    min-width: 64px !important;
    overflow: visible;
  }
}

.mobile-main {
  width: 100% !important;
  margin-left: 0 !important;
  padding: 15px 10px !important;
  transition: all 0.3s ease;
}

.mobile-main-expanded {
  width: calc(100% - 60px) !important;
  margin-left: 60px !important;
}

.hidden {
  transform: translateX(-100%);
  width: 0 !important;
  min-width: 0 !important;
  overflow: hidden;
}

.mobile-aside {
  width: 60px !important;
  min-width: 60px !important;
  transition: all 0.3s ease;

  &.hidden {
    width: 0 !important;
    min-width: 0 !important;
  }
}

// 增强过渡动画效果
.transitioning {
  will-change: transform, width, margin; // 告知浏览器这些属性将会变化
  transform: translateZ(0); // 启用硬件加速
}

// 优化侧边栏过渡
.el-aside {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backface-visibility: hidden; // 提高性能
  perspective: 1000;

  &.transitioning {
    pointer-events: none; // 过渡期间禁用点击，避免多次触发
  }

  &.collapsed {
    // 改进过渡效果
    transition-property: transform, width, min-width;
  }
}

// 优化主内容区域过渡
.el-main {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backface-visibility: hidden;
  transform: translateZ(0);
}

// 移动端菜单样式调整
.mobile-aside {
  width: 60px !important;
  min-width: 60px !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &.hidden {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      width 0.1s 0.2s linear,
      min-width 0.1s 0.2s linear;
  }
}
</style>