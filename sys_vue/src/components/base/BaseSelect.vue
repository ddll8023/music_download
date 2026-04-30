<script setup>
/**
 * BaseSelect 基础下拉框组件
 * 功能描述：暗色主题 select，支持 options 数组、v-model、自定义显示字段
 * 依赖组件：无
 * Source: 规范文档/前端规范文档.md §3.3 Props 定义规范
 */
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    required: true,
    default: () => []
  },
  valueKey: {
    type: String,
    default: 'value'
  },
  labelKey: {
    type: String,
    default: 'label'
  },
  placeholder: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)

const sizeClasses = {
  sm: 'select-sm',
  md: 'select-md',
  lg: 'select-lg'
}

const selectClasses = computed(() => [
  'select-inner w-full rounded-lg outline-none cursor-pointer appearance-none',
  sizeClasses[props.size],
  {
    'select-disabled': props.disabled,
    'select-open': isOpen.value
  }
])

const handleChange = (e) => {
  const val = e.target.value
  emit('update:modelValue', val)
  const selected = props.options.find(opt => String(opt[props.valueKey]) === val)
  emit('change', val, selected)
}
</script>

<template>
  <div class="select-wrapper">
    <select
      :value="modelValue"
      :disabled="disabled"
      :class="selectClasses"
      @change="handleChange"
      @focus="isOpen = true"
      @blur="isOpen = false"
      @mousedown="isOpen = !isOpen"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="opt[valueKey]"
        :value="opt[valueKey]"
      >
        {{ opt[labelKey] }}
      </option>
    </select>
    <div class="select-arrow" :class="{ 'select-arrow-open': isOpen }">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1,1 5,5 9,1" />
      </svg>
    </div>
    <div class="select-glow-line" />
  </div>
</template>

<style scoped>
.select-wrapper {
  display: inline-flex;
  align-items: center;
  position: relative;
  border-radius: 10px;
}

.select-inner {
  background: linear-gradient(
    135deg,
    var(--color-elevated) 0%,
    rgba(33, 36, 58, 0.85) 100%
  );
  color: var(--color-text);
  border: 1px solid var(--color-border);
  font-family: inherit;
  padding-right: 32px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(4px);
}

.select-sm {
  height: 32px;
  padding-left: 10px;
  padding-right: 28px;
  font-size: 12px;
  min-width: 80px;
}
.select-md {
  height: 40px;
  padding-left: 14px;
  padding-right: 32px;
  font-size: 14px;
  min-width: 100px;
}
.select-lg {
  height: 48px;
  padding-left: 18px;
  padding-right: 36px;
  font-size: 16px;
  min-width: 120px;
}

.select-inner:not(:disabled):hover {
  border-color: rgba(64, 158, 255, 0.45);
  background: linear-gradient(
    135deg,
    rgba(37, 41, 68, 0.95) 0%,
    rgba(33, 36, 58, 0.9) 100%
  );
  box-shadow:
    0 0 0 1px rgba(64, 158, 255, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.select-inner:not(:disabled):focus,
.select-inner.select-open {
  border-color: var(--color-primary);
  box-shadow:
    0 0 0 1px rgba(64, 158, 255, 0.25),
    0 0 20px rgba(64, 158, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.select-disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.select-inner option {
  background: var(--color-surface);
  color: var(--color-text);
  padding: 8px 12px;
  border-bottom: 1px solid rgba(42, 46, 69, 0.6);
}
.select-inner option:hover,
.select-inner option:checked {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.15), rgba(64, 158, 255, 0.05));
  color: var(--color-primary);
}

.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.select-wrapper:hover .select-arrow {
  color: var(--color-primary);
  background: rgba(64, 158, 255, 0.1);
}

.select-arrow-open {
  transform: translateY(-50%) rotate(180deg);
  color: var(--color-primary);
  background: rgba(64, 158, 255, 0.12);
}

.select-glow-line {
  position: absolute;
  bottom: -1px;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(64, 158, 255, 0.5),
    transparent
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 1px;
  z-index: 3;
}

.select-wrapper:hover .select-glow-line {
  opacity: 0.5;
}
.select-wrapper:focus-within .select-glow-line {
  opacity: 1;
}
</style>
