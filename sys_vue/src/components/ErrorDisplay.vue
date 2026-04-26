<script setup>
/**
 * ErrorDisplay 错误状态展示组件
 * 功能描述：通用错误信息展示，支持自定义提示文本和重试按钮
 * 依赖组件：无
 * Source: 规范文档/前端规范文档.md §7.3 错误状态展示组件
 */
defineProps({
  error: {
    type: String,
    default: ''
  },
  showRetry: {
    type: Boolean,
    default: true
  }
})

defineEmits(['retry'])
</script>

<template>
  <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
    <div class="flex items-start">
      <svg class="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <div>
        <h3 class="text-sm font-medium text-red-800">操作失败</h3>
        <p class="mt-1 text-sm text-red-700">{{ error }}</p>
        <button
          v-if="showRetry"
          @click="$emit('retry')"
          class="mt-3 text-sm font-medium text-red-800 hover:text-red-700"
        >
          重新尝试
        </button>
      </div>
    </div>
  </div>
</template>
