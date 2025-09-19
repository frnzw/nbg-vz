import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import './style.css'

import '@fontsource/roboto/100.css'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@fontsource/roboto/900.css'

import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'



const app = createApp(App)

app.use(router)

const pinia = createPinia()
app.use(pinia)

const vuetify = createVuetify({
    components,
    directives,
  })
app.use(vuetify)

app.mount('#app')
