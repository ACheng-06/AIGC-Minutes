import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './styles/tokens.css';
import './styles/main.css';

// Element Plus 组件与样式由 vite.config.ts 中的按需引入插件自动加载。
createApp(App).use(router).mount('#app');
