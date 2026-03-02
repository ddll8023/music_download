import { ElMessage } from "element-plus";
import axios from "axios";
import router from "@/router/index.js";

const request = axios.create({
	baseURL: "http://localhost:6854",
	// baseURL: "http://47.92.175.157:8080",
	timeout: 300000,
});

// request 拦截器
request.interceptors.request.use(
	(config) => {
		config.headers["Content-Type"] = "application/json;charset=UTF-8";
		// 从本地存储中获取 Token
		const token = localStorage.getItem("token");
		if (token) {
			// 将 Token 添加到请求头中
			config.headers["token"] = `${token}`;
		}
		//携带cookie
		config.withCredentials = true;
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// response 拦截器
request.interceptors.response.use(
	(response) => {
		let res = response.data;
		console.log(res);
		if (typeof res === "string") {
			res = res ? JSON.parse(res) : res;
		}
		return res;
	},
	(error) => {
		if (error.response.status === 404) {
			ElMessage.error("请求接口不存在");
		} else if (error.response.status === 500) {
			ElMessage.error("服务器异常");
		} else if (error.response.status === 401) {
			ElMessage.error("未授权，请重新登录");
		} else {
			console.log(error.message);
		}
		return Promise.reject(error);
	}
);

export default request;
