/**
 * 应用入口文件
 * 功能描述：初始化 Vue3 应用，挂载 Router、Pinia、Tailwind CSS、Font Awesome 图标库
 */

// 1. Vue 官方 API
import { createApp } from 'vue'
import App from './App.vue'

// 2. Vue Router
import router from './router'

// 3. Pinia Store
import { createPinia } from 'pinia'

// 4. 样式资源
import '@/assets/css/tailwind.css'

// 5. Font Awesome 图标库
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faHouse,
  faHeadphones,
  faMagnifyingGlass,
  faDownload,
  faPlay,
  faPause,
  faForwardStep,
  faBackwardStep,
  faVolumeHigh,
  faVolumeLow,
  faVolumeXmark,
  faShuffle,
  faRepeat,
  faList,
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
  faMusic,
  faFileAudio,
  faFolderOpen,
  faFloppyDisk,
  faRotate,
  faUser,
  faCheck,
  faCheckCircle,
  faSpinner,
  faXmark,
  faCircleExclamation,
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faHouse,
  faHeadphones,
  faMagnifyingGlass,
  faDownload,
  faPlay,
  faPause,
  faForwardStep,
  faBackwardStep,
  faVolumeHigh,
  faVolumeLow,
  faVolumeXmark,
  faShuffle,
  faRepeat,
  faList,
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
  faMusic,
  faFileAudio,
  faFolderOpen,
  faFloppyDisk,
  faRotate,
  faUser,
  faCheck,
  faCheckCircle,
  faSpinner,
  faXmark,
  faCircleExclamation,
  faCircleInfo
)

const app = createApp(App)
app.use(router)
app.use(createPinia())
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
