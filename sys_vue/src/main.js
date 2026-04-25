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
  faShuffle,
  faRepeat,
  faList,
  faAnglesLeft,
  faAnglesRight,
  faUser,
  faCheck,
  faCheckCircle,
  faSpinner,
  faTimes
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
  faShuffle,
  faRepeat,
  faList,
  faAnglesLeft,
  faAnglesRight,
  faUser,
  faCheck,
  faCheckCircle,
  faSpinner,
  faTimes
)

const app = createApp(App)
app.use(router)
app.use(createPinia())
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
