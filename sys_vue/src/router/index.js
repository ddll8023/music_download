import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			redirect:'/home',
			component: () => import("../views/Index.vue"),
			children: [
				{
					path: "/home",
					component: () => import("../views/Home.vue"),
				},
				{
					path:"/localmusic",
					component: () => import("../views/LocalMusicGet.vue")
				}
			]
		},

	],
});

export default router;
