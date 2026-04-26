import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

// Tailwind CSS
import '@/assets/css/tailwind.css'

// Font Awesome
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
