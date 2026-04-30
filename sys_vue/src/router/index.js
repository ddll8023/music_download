/**
 * 路由配置文件
 * 功能描述：定义应用路由表，所有页面路由使用懒加载
 */
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			redirect: '/home',
			name: 'Index',
			component: () => import("../views/Index.vue"),
			children: [
				{
					path: "/home",
					name: 'Home',
					component: () => import("../views/Home.vue"),
				},
				{
					path: "/localmusic",
					name: 'LocalMusic',
					component: () => import("../views/LocalMusicGet.vue"),
				},
			],
		},

	],
});

export default router;
