@echo off
cd /d %~dp0backend

:: 激活 uv 虚拟环境
call .venv\Scripts\activate.bat

:: 启动后端服务
python -m uvicorn app.main:app --host 0.0.0.0 --port 3492 