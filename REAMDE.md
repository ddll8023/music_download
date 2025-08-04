# 音乐下载平台 项目功能说明文档

## 项目概述

音乐下载平台是一个基于 Vue.js + Flask 架构的 Web 应用，集成在线音乐搜索下载与本地音乐管理功能。支持通过 QQ 音乐链接获取高音质音乐资源，提供完整的本地音乐播放和管理体验。

## 根目录结构

```
music_download/
├── sys_python/                   # Python 后端服务
├── sys_vue/                      # Vue.js 前端应用
├── start_backend.bat             # 后端服务启动脚本
├── start_frontend.bat            # 前端应用启动脚本
├── python.zip                    # Python 环境包
└── 项目结构文档demo.md           # 参考文档模板
```

## Python 后端服务 (sys_python/)

### 应用入口

- **app.py** - Flask 应用主入口，CORS 跨域配置，蓝图注册管理
  - 配置跨域访问允许 `localhost:5173`（Vue 开发服务器）
  - 注册歌曲相关 API 蓝图
  - 启动 Flask 开发服务器（端口 8080）

### API 路由控制 (blueprint/)

- **song.py** - 歌曲相关 API 路由控制器
  - `/song/search` - 音乐搜索接口（支持单曲和歌单链接解析）
  - `/song/albumImg` - 专辑封面批量获取接口
  - `/song/songUrl` - 歌曲下载链接批量获取接口
  - 支持 QQ 音乐短链接重定向解析
  - 实现请求 ID 机制防止异步请求混乱

### 业务逻辑模块 (untils/)

- **search_song.py** - 音乐搜索核心业务逻辑
  - `search_song()` - 单曲详情获取和数据格式化
  - `search_songlist()` - 歌单信息获取和分页处理
  - `get_song_url_list()` - 批量歌曲下载链接获取
  - 集成 QQ 音乐 API 调用
  - 支持 FLAC 高音质音频获取
- **temp_song_detail.json** - 临时歌曲详情缓存文件
- **temp_song_urls.json** - 临时下载链接缓存文件

### 认证管理模块 (credential/)

- **get_credential.py** - QQ 音乐 API 认证凭证管理
  - 从 JSON 文件读取 Cookie 认证信息
  - 验证认证凭证有效性
  - 提供统一的认证获取接口
- **request_credential.py** - 用户登录认证处理（预留）
- **credential.json** - QQ 音乐 Cookie 凭证存储文件

### 通用模块 (common/)

- **result.py** - 统一 API 响应格式封装
  - 标准化成功响应格式
  - 标准化错误响应格式
  - 统一返回数据结构（code、msg、data）
- **configure_logging.py** - 应用日志系统配置

### 依赖配置

- **requirements.txt** - Python 依赖包清单
  - `flask` - Web 框架
  - `flask_cors` - 跨域请求支持
  - `qqmusic-api-python` - QQ 音乐 API SDK
  - `httpx` - 异步 HTTP 客户端
  - `asyncio` - 异步编程支持
- **app.log** - 应用运行日志文件

## Vue.js 前端应用 (sys_vue/)

### 应用入口

- **src/App.vue** - 根组件，路由视图容器
- **src/main.js** - Vue 应用初始化，Pinia 状态管理配置
- **index.html** - HTML 模板文件
- **vite.config.js** - Vite 构建工具配置
  - 路径别名配置（@ 指向 src 目录）
  - Vue 插件和开发工具集成
  - jsmediatags 库别名配置

### 核心页面 (src/views/)

- **Index.vue** - 主布局容器组件
  - 路由出口管理
  - 全局布局结构
- **Home.vue** - 在线音乐搜索下载主界面
  - 支持歌曲链接和歌单链接搜索
  - 实时获取专辑封面和下载链接
  - 批量选择和下载功能
  - 分页展示搜索结果
  - 异步请求状态管理和防重复机制
- **LocalMusicGet.vue** - 本地音乐文件管理界面
  - 支持单文件和文件夹批量上传
  - 音频元数据自动解析（标题、艺术家、专辑、时长）
  - 专辑封面提取和显示
  - IndexedDB 本地存储管理
  - 播放列表保存和加载功能

### 核心组件 (src/components/)

- **MusicPlayer.vue** - 全局音乐播放器组件
  - 完整播放控制（播放/暂停、上一曲/下一曲）
  - 实时进度显示和拖拽跳转
  - 音量控制滑块
  - 播放模式切换（顺序/随机）
  - 当前歌曲信息展示
  - 响应式设计适配移动端

### 状态管理 (src/stores/)

- **Song.js** - 音乐播放和歌曲列表状态管理（Pinia）
  - 当前播放歌曲状态
  - 播放列表管理
  - 播放状态控制（播放/暂停、进度、音量）
  - 播放模式管理（顺序播放、随机播放）
  - 歌曲切换逻辑（上一曲/下一曲）
  - 随机播放列表生成和管理

### 工具模块 (src/utils/)

- **request.js** - HTTP 请求封装和拦截器配置
  - Axios 实例配置
  - 请求/响应拦截器
  - 统一错误处理

### 路由配置 (src/router/)

- **index.js** - Vue Router 路由配置
  - 首页重定向到 `/home`
  - 在线音乐搜索路由（`/home`）
  - 本地音乐管理路由（`/localmusic`）

### 样式系统 (src/assets/)

- **scss/** - SCSS 样式文件目录
  - `Global.scss` - 全局样式定义
  - `Home.scss` - 首页专用样式
  - `Index.scss` - 主布局样式
  - `LocalMusicGet.scss` - 本地音乐页面样式
- **img/** - 图像资源目录
  - `init_img.jpg` - 默认专辑封面图片

### 依赖配置

- **package.json** - 前端依赖和脚本配置
  - Vue.js 3 核心框架
  - Element Plus UI 组件库
  - Pinia 状态管理
  - Vue Router 路由管理
  - Vite 构建工具
  - SCSS 样式预处理器
  - 音频元数据处理库

## 核心功能流程

### 在线音乐搜索下载流程

1. **链接解析**：用户输入 QQ 音乐分享链接
2. **重定向处理**：后端解析短链接获取真实 ID
3. **信息获取**：调用 QQ 音乐 API 获取歌曲/歌单详情
4. **封面获取**：批量获取专辑封面图片
5. **链接获取**：获取高音质下载链接（支持 FLAC）
6. **文件下载**：前端实现文件流下载和保存

### 本地音乐管理流程

1. **文件上传**：支持单文件或文件夹批量选择
2. **元数据解析**：使用 music-metadata-browser 解析音频信息
3. **封面提取**：提取音频文件内嵌专辑封面
4. **数据存储**：将音频文件和元数据存储到 IndexedDB
5. **列表管理**：播放列表的保存和加载功能

### 音频播放控制流程

1. **歌曲加载**：从本地存储或在线链接加载音频
2. **播放控制**：HTML5 Audio API 实现播放控制
3. **状态同步**：Pinia 状态管理同步播放状态
4. **进度管理**：实时更新播放进度和总时长
5. **模式切换**：支持顺序播放和随机播放模式

## 技术栈特性

### 前端技术栈

- **Vue.js 3** - 组合式 API，响应式数据绑定
- **Vite** - 快速构建工具，模块热替换
- **Element Plus** - 现代化 UI 组件库
- **Pinia** - Vue 3 官方状态管理库
- **Vue Router** - 单页应用路由管理
- **SCSS** - CSS 预处理器，模块化样式
- **music-metadata-browser** - 浏览器端音频元数据解析
- **IndexedDB** - 浏览器本地数据库存储

### 后端技术栈

- **Flask** - 轻量级 Python Web 框架
- **Flask-CORS** - 跨域资源共享支持
- **qqmusic-api-python** - QQ 音乐官方 API SDK
- **httpx** - 现代异步 HTTP 客户端
- **asyncio** - Python 异步编程支持

### 数据持久化方案

- **后端**：临时 JSON 文件缓存（调试用）
- **前端**：IndexedDB 本地数据库存储
- **认证**：JSON 文件存储 QQ 音乐 Cookie

### 跨域处理方案

- 后端 Flask-CORS 配置允许前端域名访问
- 支持携带认证凭证的跨域请求
- 预检请求（OPTIONS）处理

## 部署和启动

### 启动脚本

- **start_backend.bat** - Windows 后端服务启动脚本
  - 切换到 Python 服务目录
  - 启动 Flask 开发服务器
- **start_frontend.bat** - Windows 前端应用启动脚本
  - 切换到 Vue 应用目录
  - 启动 Vite 开发服务器

### 服务端口配置

- **后端服务**：http://localhost:8080
- **前端应用**：http://localhost:5173
- **跨域配置**：后端允许前端域名访问

### 环境要求

- **Python 3.7+** - 后端运行环境
- **Node.js 16+** - 前端构建和运行环境
- **现代浏览器** - 支持 IndexedDB 和 HTML5 Audio API

## 项目特色功能

1. **高音质支持** - 支持 FLAC 无损音质下载
2. **智能链接解析** - 自动处理 QQ 音乐分享链接重定向
3. **本地音乐库** - 完整的本地音乐文件管理系统
4. **异步请求优化** - 防止重复请求，提升用户体验
5. **响应式设计** - 适配桌面和移动设备
6. **离线播放** - 本地音乐无需网络连接即可播放
