// src/renderer/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'

import App from './App.vue'
import 'tdesign-vue-next/es/style/index.css'

const pinia = createPinia()
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('./views/Home.vue')
    },
    {
      path: '/local',
      name: 'Local',
      component: () => import('./views/LocalMusic.vue')
    },
    {
      path: '/liked',
      name: 'Liked',
      component: () => import('./views/Playlist.vue')
    },
    {
      path: '/recent',
      name: 'Recent',
      component: () => import('./views/Playlist.vue')
    },
    {
      path: '/search',
      name: 'Search',
      component: () => import('./views/Search.vue')
    },
    {
      path: '/download',
      name: 'Download',
      component: () => import('./views/DownloadManager.vue')
    },
    {
      path: '/playlist/:id',
      name: 'PlaylistDetail',
      component: () => import('./views/Playlist.vue')
    },
    {
      path: '/driving',
      name: 'Driving',
      component: () => import('./views/DrivingMode.vue')
    },
    {
      path: '/relax',
      name: 'Relax',
      component: () => import('./views/RelaxMode.vue')
    }
  ]
})

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')