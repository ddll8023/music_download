<script setup>
/**
 * SongListTable 歌曲列表通用组件
 * 功能描述：通过 columns 配置驱动的歌曲列表，支持选中、封面展示、自定义操作列
 * 依赖组件：无
 * Source: 规范文档/前端规范文档.md §5 页面组织规范
 */
import { computed } from 'vue'

const resolveCoverSrc = (song, col) => {
  const value = resolveField(song, col.field)
  return value || col.fallback || null
}

const props = defineProps({
  songs: {
    type: Array,
    required: true,
    default: () => []
  },
  columns: {
    type: Array,
    required: true,
    default: () => []
  },
  selectable: {
    type: Boolean,
    default: false
  },
  selectedKeys: {
    type: Array,
    default: () => []
  },
  selectAll: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  rowKey: {
    type: String,
    default: 'id'
  }
})

const emit = defineEmits([
  'row-click',
  'select',
  'select-all',
  'action'
])

const gridTemplate = computed(() => {
  const cols = []
  if (props.selectable) cols.push('40px')
  props.columns.forEach(col => cols.push(col.width || '1fr'))
  return { gridTemplateColumns: cols.join(' ') }
})

const isSongSelected = (song) => {
  return props.selectedKeys.includes(song[props.rowKey])
}

const handleRowClick = (song, index) => {
  emit('row-click', song, index)
}

const handleSelect = (song) => {
  emit('select', song)
}

const handleSelectAll = () => {
  emit('select-all', !props.selectAll)
}

const resolveField = (song, field) => {
  return field.split('.').reduce((obj, key) => obj?.[key], song)
}
</script>

<template>
  <section class="song-table-wrapper">
    <!-- 表头 -->
    <div class="song-table-header" :style="gridTemplate">
      <div v-if="selectable" class="flex items-center justify-center">
        <input
          type="checkbox"
          :checked="selectAll"
          class="cursor-pointer accent-primary"
          @change="handleSelectAll"
        />
      </div>
      <div
        v-for="col in columns"
        :key="col.key"
        :class="['song-table-header-cell', col.headerAlign === 'center' ? 'text-center' : 'pl-2']"
        :style="col.width ? {} : { flex: 1 }"
      >
        {{ col.label }}
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!songs.length && !loading" class="song-table-empty">
      <font-awesome-icon :icon="['fas', 'music']" class="text-2xl text-theme-text-secondary opacity-30" aria-hidden="true" />
      <span class="text-sm text-theme-text-secondary mt-2">{{ emptyText }}</span>
    </div>

    <!-- 数据行 -->
    <div
      v-for="(song, index) in songs"
      :key="song[rowKey] || index"
      class="song-table-row"
      :style="gridTemplate"
      @click="handleRowClick(song, index)"
    >
      <!-- 选择列 -->
      <div v-if="selectable" class="flex items-center justify-center" @click.stop>
        <input
          type="checkbox"
          :checked="isSongSelected(song)"
          class="cursor-pointer accent-primary"
          @change="handleSelect(song)"
        />
      </div>

      <!-- 动态列 -->
      <template v-for="col in columns" :key="col.key">
        <!-- 序号列 -->
        <div v-if="col.type === 'index'" class="flex items-center justify-center text-xs text-theme-text-secondary">
          {{ index + 1 }}
        </div>

        <!-- 封面列 -->
        <div v-else-if="col.type === 'cover'" class="flex items-center justify-center">
          <img
            v-if="resolveCoverSrc(song, col)"
            :src="resolveCoverSrc(song, col)"
            alt="封面"
            class="w-9 h-9 rounded-md object-cover cover-shadow"
          />
          <div v-else class="w-9 h-9 rounded-md flex items-center justify-center bg-elevated">
            <font-awesome-icon :icon="['fas', 'music']" class="text-xs text-theme-text-secondary" aria-hidden="true" />
          </div>
        </div>

        <!-- 格式标签列 -->
        <div v-else-if="col.type === 'format'" class="flex items-center justify-center">
          <span
            v-if="resolveField(song, col.field)"
            class="format-badge inline-block px-1.5 py-0.5 text-[10px] font-bold rounded"
          >
            {{ resolveField(song, col.field).toUpperCase() }}
          </span>
          <span v-else class="text-theme-text-secondary">-</span>
        </div>

        <!-- 操作列 -->
        <div v-else-if="col.type === 'action'" class="flex items-center justify-center" @click.stop>
          <slot name="action" :song="song" :index="index">
            <button
              :disabled="col.disabled?.(song)"
              :title="col.title?.(song) || ''"
              :aria-label="col.title?.(song) || '操作'"
              :class="col.disabled?.(song) ? 'btn-download-disabled' : 'btn-download'"
              class="p-1.5 rounded-md transition-all duration-200 cursor-pointer border-none bg-transparent"
              @click="emit('action', song, index)"
            >
              <font-awesome-icon :icon="col.icon || ['fas', 'download']" class="text-sm" aria-hidden="true" />
            </button>
          </slot>
        </div>

        <!-- 自定义插槽列 -->
        <div v-else-if="col.type === 'slot'" :class="col.cellClass" @click.stop>
          <slot :name="col.key" :song="song" :index="index" />
        </div>

        <!-- 默认文本列 -->
        <div v-else :class="['text-sm truncate', col.cellClass || 'text-theme-text-secondary']">
          {{ resolveField(song, col.field) ?? '-' }}
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.song-table-wrapper {
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.song-table-header {
  display: grid;
  align-items: center;
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.song-table-header-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-table-row {
  display: grid;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.song-table-row:hover {
  background: var(--color-hover-overlay);
}
.song-table-row:last-child {
  border-bottom: none;
}

.song-table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
}
</style>
