<script setup>
/**
 * BasePagination 基础分页组件
 * 功能描述：完整分页器 — 页码、上/下一页、每页条数、总条数
 * 依赖组件：BaseSelect
 * Source: 规范文档/前端规范文档.md §3.3 Props 定义规范
 */
import { computed } from 'vue'
import BaseSelect from '@/components/base/BaseSelect.vue'

const props = defineProps({
  total: {
    type: Number,
    required: true
  },
  page: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    default: 20
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 30, 50]
  },
  maxVisible: {
    type: Number,
    default: 7
  }
})

const emit = defineEmits(['update:page', 'update:pageSize', 'change'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const pages = computed(() => {
  const total = totalPages.value
  const current = props.page
  const max = props.maxVisible

  if (total <= max) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const half = Math.floor(max / 2)
  let start = Math.max(1, current - half)
  let end = Math.min(total, start + max - 1)

  if (end - start < max - 1) {
    start = Math.max(1, end - max + 1)
  }

  const result = []
  for (let i = start; i <= end; i++) {
    result.push(i)
  }
  return result
})

const pageSizeOptions = computed(() =>
  props.pageSizes.map(size => ({ value: size, label: `${size}条/页` }))
)

const handlePageChange = (p) => {
  if (p < 1 || p > totalPages.value || p === props.page) return
  emit('update:page', p)
  emit('change', { page: p, pageSize: props.pageSize })
}

const handlePageSizeChange = (val) => {
  const size = Number(val)
  emit('update:pageSize', size)
  emit('update:page', 1)
  emit('change', { page: 1, pageSize: size })
}
</script>

<template>
  <footer class="flex items-center justify-between py-3 px-4 border-t border-theme-border">
    <span class="text-xs text-theme-text-secondary">共 {{ total }} 条</span>

    <div class="flex items-center gap-1.5">
      <button
        :disabled="page <= 1"
        class="page-nav-btn"
        aria-label="上一页"
        @click="handlePageChange(page - 1)"
      >
        <font-awesome-icon :icon="['fas', 'chevron-left']" class="text-xs" aria-hidden="true" />
      </button>

      <template v-for="p in pages" :key="p">
        <button
          :class="[
            'page-num-btn',
            p === page ? 'page-num-active' : 'page-num-default'
          ]"
          @click="handlePageChange(p)"
        >
          {{ p }}
        </button>
      </template>

      <button
        :disabled="page >= totalPages"
        class="page-nav-btn"
        aria-label="下一页"
        @click="handlePageChange(page + 1)"
      >
        <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-xs" aria-hidden="true" />
      </button>

      <div class="ml-3">
        <BaseSelect
          :model-value="pageSize"
          :options="pageSizeOptions"
          size="sm"
          @change="handlePageSizeChange"
        />
      </div>
    </div>
  </footer>
</template>

<style scoped>
.page-nav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-elevated);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}
.page-nav-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.page-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-num-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-num-default {
  background: var(--color-elevated);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}
.page-num-default:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-num-active {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.3);
  border-color: transparent;
}
</style>
