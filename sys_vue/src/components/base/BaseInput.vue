<script setup>
/**
 * BaseInput 基础输入框组件
 * 功能描述：暗色主题输入框，支持前缀/后缀插槽、清除按钮、搜索模式
 * 依赖组件：无
 * Source: 规范文档/前端规范文档.md §3.3 Props 定义规范
 */
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
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
  clearable: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'enter', 'clear', 'focus', 'blur'])

const isFocused = ref(false)

const sizeClasses = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 pl-10 pr-4 text-sm',
  lg: 'h-12 px-5 text-base'
}

const wrapperClasses = computed(() => [
  'input-base-wrapper relative',
  {
    'input-base-focused': isFocused.value,
    'input-base-disabled': props.disabled
  }
])

const inputClasses = computed(() => [
  'input-base w-full rounded-lg transition-all duration-200 outline-none',
  sizeClasses[props.size]
])

const handleInput = (e) => {
  emit('update:modelValue', e.target.value)
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}

const handleKeyup = (e) => {
  if (e.key === 'Enter') emit('enter')
}
</script>

<template>
  <div :class="wrapperClasses">
    <div v-if="$slots.prefix" class="input-base-prefix">
      <slot name="prefix" />
    </div>

    <input
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="inputClasses"
      @input="handleInput"
      @keyup.enter="handleKeyup"
      @focus="isFocused = true; $emit('focus')"
      @blur="isFocused = false; $emit('blur')"
    />

    <button
      v-if="clearable && modelValue"
      class="input-base-clear"
      @click="handleClear"
      aria-label="清除"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <line x1="2" y1="2" x2="10" y2="10" />
        <line x1="10" y1="2" x2="2" y2="10" />
      </svg>
    </button>

    <div v-if="$slots.suffix && !(clearable && modelValue)" class="input-base-suffix">
      <slot name="suffix" />
    </div>
  </div>
</template>

<style scoped>
.input-base-wrapper {
  display: flex;
  align-items: center;
}

.input-base {
  background: var(--color-elevated);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  font-family: inherit;
}
.input-base::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}
.input-base:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
}

.input-base-focused .input-base {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
}

.input-base-disabled .input-base {
  opacity: 0.4;
  cursor: not-allowed;
}

.input-base-prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  pointer-events: none;
  z-index: 1;
}

.input-base-suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.input-base-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s;
}
.input-base-clear:hover {
  color: var(--color-text);
}
</style>
