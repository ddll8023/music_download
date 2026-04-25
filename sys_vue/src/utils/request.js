import axios from 'axios'
import { showToast } from '@/utils/toast.js'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 300000,
})

// request 拦截器
request.interceptors.request.use(
  (config) => {
    config.headers['Content-Type'] = 'application/json;charset=UTF-8'
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['token'] = `${token}`
    }
    config.withCredentials = true
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// response 拦截器
request.interceptors.response.use(
  (response) => {
    let res = response.data
    if (typeof res === 'string') {
      res = res ? JSON.parse(res) : res
    }
    return res
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 404) {
        showToast('请求接口不存在', 'error')
      } else if (error.response.status === 500) {
        showToast('服务器异常', 'error')
      } else if (error.response.status === 401) {
        showToast('未授权，请重新登录', 'error')
      } else {
        console.log(error.message)
      }
    } else {
      console.log(error.message)
    }
    return Promise.reject(error)
  }
)

export default request
