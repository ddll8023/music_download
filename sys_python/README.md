# 音乐下载平台 - Python 后端服务

## 概述

基于 Flask 框架的音乐下载平台后端服务，提供 QQ 音乐资源获取和管理功能。支持单曲搜索、歌单解析、专辑封面获取和高音质下载链接获取。

## 项目结构

```
sys_python/
├── app.py                      # Flask 应用入口
├── requirements.txt            # Python 依赖清单
├── app.log                     # 应用日志文件
├── blueprint/                  # API 路由蓝图
│   └── song.py                # 歌曲相关 API
├── common/                     # 通用模块
│   ├── configure_logging.py   # 日志配置
│   └── result.py              # 统一响应格式
├── credential/                 # 认证管理
│   ├── credential.json        # QQ 音乐 Cookie 存储
│   ├── get_credential.py      # 认证获取模块
│   └── request_credential.py  # 登录认证处理
└── untils/                     # 业务逻辑工具
    ├── search_song.py         # 音乐搜索核心逻辑
    ├── temp_song_detail.json  # 临时歌曲详情缓存
    └── temp_song_urls.json    # 临时链接缓存
```

## 快速开始

### 环境要求

- Python 3.7+
- pip 包管理器

### 安装依赖

```bash
cd sys_python
pip install -r requirements.txt
```

### 配置 QQ 音乐认证

1. 在浏览器中登录 QQ 音乐网页版
2. 打开开发者工具，复制相关 Cookie
3. 将 Cookie 信息保存到 `credential/credential.json` 文件中

示例格式：
```json
{
  "qm_keyst": "your_qm_keyst_value",
  "uin": "your_uin_value",
  "skey": "your_skey_value"
}
```

### 启动服务

```bash
python app.py
```

服务将在 `http://localhost:8080` 启动

## API 接口文档

### 基础信息

- **Base URL**: `http://localhost:8080`
- **Content-Type**: `application/json`
- **跨域支持**: 允许来自 `http://localhost:5173` 的请求

### 1. 音乐搜索接口

**接口路径**: `POST /song/search`

**功能描述**: 根据 QQ 音乐链接搜索单曲或歌单信息

**请求参数**:
```json
{
  "requestId": "唯一请求标识符",
  "urlType": "song|playlist",
  "searchUrl": "QQ音乐分享链接",
  "page": 1,
  "pageSize": 10
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "requestId": "请求ID",
    "result": [
      {
        "songId": 123456,
        "songMid": "song_mid_string",
        "songName": "歌曲名称",
        "singer": "歌手名称",
        "album": {
          "albumId": 789,
          "albumMid": "album_mid_string",
          "albumName": "专辑名称",
          "albumCoverUrl": ""
        },
        "duration": "03:45",
        "createTime": "2023-01-01",
        "songUrl": ""
      }
    ],
    "total": 50
  }
}
```

### 2. 专辑封面获取接口

**接口路径**: `POST /song/albumImg`

**功能描述**: 批量获取专辑封面图片链接

**请求参数**:
```json
{
  "requestId": "唯一请求标识符",
  "albumIdList": ["album_mid1", "album_mid2"]
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "requestId": "请求ID",
    "result": [
      "https://y.qq.com/music/photo_new/T002R300x300M000album_mid1.jpg",
      "https://y.qq.com/music/photo_new/T002R300x300M000album_mid2.jpg"
    ]
  }
}
```

### 3. 歌曲下载链接获取接口

**接口路径**: `POST /song/songUrl`

**功能描述**: 批量获取歌曲高音质下载链接

**请求参数**:
```json
{
  "requestId": "唯一请求标识符",
  "songIdList": ["song_mid1", "song_mid2"]
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "requestId": "请求ID",
    "result": [
      {
        "url": "https://download.url/song1.flac",
        "urlType": "flac"
      },
      {
        "url": "https://download.url/song2.mp3",
        "urlType": "mp3"
      }
    ]
  }
}
```

## 核心模块说明

### 应用入口 (app.py)

- Flask 应用初始化和配置
- CORS 跨域设置，允许前端访问
- 注册歌曲 API 蓝图
- 启动开发服务器

### API 蓝图 (blueprint/song.py)

- 实现所有歌曲相关的 API 接口
- 处理 QQ 音乐短链接重定向解析
- 集成异步调用 QQ 音乐 API
- 统一错误处理和响应格式

### 业务逻辑 (untils/search_song.py)

- `search_song()`: 单曲详情获取和格式化
- `search_songlist()`: 歌单信息获取和分页
- `get_song_url_list()`: 批量下载链接获取
- 支持 FLAC 高音质音频格式

### 认证管理 (credential/)

- `get_credential.py`: QQ 音乐 API 认证管理
- `credential.json`: Cookie 认证信息存储
- 支持认证有效性验证

### 通用工具 (common/)

- `result.py`: 统一 API 响应格式封装
- `configure_logging.py`: 应用日志系统配置

## 配置说明

### 跨域配置

```python
CORS(
    app,
    origins=["http://localhost:5173"],  # 允许的前端域名
    supports_credentials=True,          # 允许携带凭证
    allow_headers=["Content-Type", "Authorization", "token"],
    methods=["GET", "POST", "OPTIONS"],
    expose_headers=["Content-Type", "Access-Control-Allow-Origin"]
)
```

### 日志配置

- 日志文件: `app.log`
- 日志级别: 支持 INFO、ERROR 等级别
- 自动记录 API 请求和错误信息

## 部署说明

### 开发环境部署

1. 克隆项目到本地
2. 安装 Python 依赖
3. 配置 QQ 音乐认证信息
4. 运行 `python app.py` 启动服务

### 生产环境部署

推荐使用 Gunicorn 作为 WSGI 服务器：

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8080 app:app
```

### Docker 部署

创建 `Dockerfile`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["python", "app.py"]
```

## 常见问题

### 1. QQ 音乐认证失效

**问题**: API 返回认证相关错误
**解决**: 重新获取 QQ 音乐 Cookie 并更新 `credential.json`

### 2. 跨域请求被拒绝

**问题**: 前端无法访问后端 API
**解决**: 检查 CORS 配置中的允许域名是否正确

### 3. 下载链接失效

**问题**: 获取的音乐下载链接无法访问
**解决**: 检查 QQ 音乐认证状态，重新获取有效认证信息

## 技术特性

1. **异步处理**: 使用 asyncio 提升 API 调用性能
2. **错误处理**: 完善的异常捕获和错误响应机制
3. **日志记录**: 详细的操作日志和错误追踪
4. **跨域支持**: 完整的 CORS 配置支持前端调用
5. **模块化设计**: 清晰的项目结构和模块划分

## 依赖说明

- `flask`: Web 框架核心
- `flask_cors`: 跨域请求支持
- `qqmusic-api-python`: QQ 音乐官方 API SDK
- `httpx`: 现代异步 HTTP 客户端
- `asyncio`: Python 异步编程支持 