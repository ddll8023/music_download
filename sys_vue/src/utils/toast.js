/**
 * 自定义 Toast 提示工具
 * 替代 Element Plus 的 ElMessage
 */

// 1. Font Awesome 图标
import { icon, parse } from '@fortawesome/fontawesome-svg-core'
import {
  faCheck,
  faXmark,
  faCircleExclamation,
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons'

let toastCount = 0

const typeConfig = {
  success: { bg: 'bg-green-500', faIcon: faCheck },
  error: { bg: 'bg-red-500', faIcon: faXmark },
  warning: { bg: 'bg-yellow-500', faIcon: faCircleExclamation },
  info: { bg: 'bg-blue-500', faIcon: faCircleInfo }
}

/**
 * 显示 Toast 提示
 * @param {string} message - 提示内容
 * @param {'success'|'error'|'warning'|'info'} type - 提示类型
 */
export function showToast(message, type = 'info') {
  const config = typeConfig[type] || typeConfig.info

  const toast = document.createElement('div')
  toast.className = [
    'fixed right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm',
    'transition-all duration-300 opacity-0 translate-x-4',
    config.bg
  ].join(' ')

  toast.style.top = `${16 + toastCount * 56}px`

  const svgIcon = icon(config.faIcon)
  const iconWrapper = document.createElement('span')
  iconWrapper.setAttribute('aria-hidden', 'true')
  iconWrapper.innerHTML = svgIcon.html[0]

  const text = document.createElement('span')
  text.textContent = message

  toast.appendChild(iconWrapper)
  toast.appendChild(text)
  document.body.appendChild(toast)
  toastCount++

  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-x-4')
    toast.classList.add('opacity-100', 'translate-x-0')
  })

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-x-0')
    toast.classList.add('opacity-0', 'translate-x-4')
    setTimeout(() => {
      toast.remove()
      toastCount = Math.max(0, toastCount - 1)
    }, 300)
  }, 3000)
}
