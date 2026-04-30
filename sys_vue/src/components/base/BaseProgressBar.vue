<script setup>
/**
 * BaseProgressBar 基础进度条组件
 * 功能描述：渐变填充进度条，支持百分比、当前/总数文本
 * 依赖组件：无
 * Source: 规范文档/前端规范文档.md §3.6 Tailwind 动态类名
 */
import { computed } from 'vue'

const props = defineProps({
  percent: {
    type: Number,
    default: 0,
    validator: (v) => v >= 0 && v <= 100
  },
  current: {
    type: Number,
    default: null
  },
  total: {
    type: Number,
    default: null
  },
  height: {
    type: String,
    default: '6px'
  },
  showPercent: {
    type: Boolean,
    default: true
  },
  animated: {
    type: Boolean,
    default: true
  }
})

const barStyle = computed(() => ({
  width: `${props.percent}%`,
  height: props.height
}))

const showDetail = computed(() => props.current !== null && props.total !== null)
</script>

<template>
  <div class="progress-wrapper">
    <div class="progress-track" :style="{ height }">
      <div
        :class="['progress-fill', { 'progress-animated': animated }]"
        :style="barStyle"
      />
    </div>
    <div v-if="showPercent || showDetail" class="progress-info">
      <span v-if="showDetail" class="progress-detail">
        {{ Math.round(total * percent / 100) }}/{{ total }}
      </span>
      <span v-if="showPercent" class="progress-percent">{{ Math.round(percent) }}%</span>
    </div>
  </div>
</template>

<style scoped>
.progress-wrapper {
  width: 100%;
}

.progress-track {
  width: 100%;
  border-radius: 9999px;
  overflow: hidden;
  background: var(--color-elevated);
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  background: linear-gradient(90deg, var(--color-primary), #6c5ce7);
  transition: width 0.3s ease;
  position: relative;
}

.progress-animated::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.progress-detail {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.progress-percent {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
}
</style>
