import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import 'normalize.css'

import './assets/css/common.css'
import './assets/css/transition.css'
import './index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
