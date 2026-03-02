@echo off
cd /d %~dp0sys_python

:: 激活 uv 虚拟环境
call .venv\Scripts\activate.bat

:: 启动后端服务
python app.py 