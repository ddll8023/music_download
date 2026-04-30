/**
 * Axios 请求封装
 * 功能描述：统一请求/响应拦截，错误处理，Token 注入
 */

import axios from 'axios'
import { showToast } from '@/utils/toast.js'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3492',
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
    if (res.code === 0) {
      return res
    }
    showToast(res.msg || '请求失败', 'error')
    return Promise.reject(new Error(res.msg || '请求失败'))
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      const messages = {
        401: '未授权，请重新登录',
        403: '没有操作权限',
        404: '请求接口不存在',
        500: '服务器异常',
      }
      showToast(messages[status] || '请求失败', 'error')
    } else {
      showToast('网络连接失败，请检查网络设置', 'error')
    }
    return Promise.reject(error)
  }
)

export default request
