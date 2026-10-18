import { createRouter, createWebHistory } from 'vue-router';
import WorkbenchView from '../views/WorkbenchView.vue';
import HistoryView from '../views/HistoryView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'workbench', component: WorkbenchView },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});
