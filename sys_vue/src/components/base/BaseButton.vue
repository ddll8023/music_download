<script setup>
/**
 * BaseButton 基础按钮组件
 * 功能描述：统一按钮变体（primary/outline/ghost/danger），支持图标、加载态、禁用态
 * 依赖组件：无
 * Source: 规范文档/前端规范文档.md §3.6 Tailwind 动态类名
 */
import { computed, useSlots } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'outline', 'ghost', 'danger'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  block: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const slots = useSlots()

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2.5'
}

const variantClasses = {
  primary: 'btn-base-primary',
  outline: 'btn-base-outline',
  ghost: 'btn-base-ghost',
  danger: 'btn-base-danger'
}

const buttonClasses = computed(() => [
  'btn-base',
  sizeClasses[props.size],
  variantClasses[props.variant],
  {
    'w-full': props.block,
    'opacity-40 cursor-not-allowed pointer-events-none': props.disabled || props.loading
  }
])
</script>

<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-0.5 h-em w-em"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot v-if="!loading" name="icon" />
    <span><slot /></span>
  </button>
</template>

<style scoped>
.btn-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  white-space: nowrap;
  line-height: 1.4;
}

.btn-base-primary {
  background: var(--color-primary);
  color: #fff;
  border-color: transparent;
}
.btn-base-primary:hover:not(:disabled) {
  filter: brightness(1.15);
  box-shadow: 0 0 16px rgba(64, 158, 255, 0.25);
}

.btn-base-outline {
  background: var(--color-elevated);
  color: var(--color-text);
  border-color: var(--color-border);
}
.btn-base-outline:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-base-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border-color: transparent;
}
.btn-base-ghost:hover:not(:disabled) {
  background: var(--color-hover-overlay);
  color: var(--color-text);
}

.btn-base-danger {
  background: #dc2626;
  color: #fff;
  border-color: transparent;
}
.btn-base-danger:hover:not(:disabled) {
  filter: brightness(1.15);
  box-shadow: 0 0 16px rgba(220, 38, 38, 0.25);
}
</style>
