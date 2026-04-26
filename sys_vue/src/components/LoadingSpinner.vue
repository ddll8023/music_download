<script setup>
/**
 * LoadingSpinner 加载状态展示组件
 * 功能描述：通用加载状态展示，支持自定义加载文本和内容插槽
 * 依赖组件：无
 * Source: 规范文档/前端规范文档.md §7.4 加载状态展示组件
 */
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: '加载中...'
  }
})
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-12">
    <svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <span class="ml-3 text-gray-600">{{ loadingText }}</span>
  </div>
  <slot v-else />
</template>
