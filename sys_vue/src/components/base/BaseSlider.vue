<script setup>
/**
 * BaseSlider 基础滑块组件
 * 功能描述：自定义 range input，渐变轨道 + 发光 thumb，用于进度条/音量控制
 * 依赖组件：无
 * Source: 规范文档/前端规范文档.md §3.6 Tailwind 动态类名
 */
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  step: {
    type: Number,
    default: 1
  },
  showValue: {
    type: Boolean,
    default: false
  },
  height: {
    type: String,
    default: '4px'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'input', 'change'])

const progress = computed(() => {
  const range = props.max - props.min
  if (range === 0) return 0
  return ((props.modelValue - props.min) / range) * 100
})

const trackStyle = computed(() => ({
  '--slider-progress': `${progress.value}%`,
  '--slider-height': props.height
}))

const handleInput = (e) => {
  const val = Number(e.target.value)
  emit('update:modelValue', val)
  emit('input', val)
}

const handleChange = (e) => {
  emit('change', Number(e.target.value))
}
</script>

<template>
  <div :class="['slider-wrapper', { 'slider-disabled': disabled }]" :style="trackStyle">
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :disabled="disabled"
      class="slider-input"
      @input="handleInput"
      @change="handleChange"
    />
    <span v-if="showValue" class="slider-value">{{ modelValue }}</span>
  </div>
</template>

<style scoped>
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.slider-input {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  height: var(--slider-height);
  border-radius: 9999px;
  background: linear-gradient(
    to right,
    var(--color-primary) 0%,
    var(--color-primary) var(--slider-progress),
    var(--color-border) var(--slider-progress),
    var(--color-border) 100%
  );
  outline: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.5);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.25);
  box-shadow: 0 0 14px rgba(64, 158, 255, 0.7);
}

.slider-input::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.5);
  cursor: pointer;
  border: none;
}

.slider-input::-moz-range-track {
  height: var(--slider-height);
  border-radius: 9999px;
  background: var(--color-border);
}

.slider-input::-moz-range-progress {
  height: var(--slider-height);
  border-radius: 9999px;
  background: var(--color-primary);
}

.slider-value {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  min-width: 28px;
  text-align: right;
  color: var(--color-text-secondary);
}

.slider-disabled .slider-input {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
