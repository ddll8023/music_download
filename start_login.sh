#!/bin/bash
cd "$(dirname "$0")/sys_python"
source .venv/bin/activate
PYTHONIOENCODING=utf-8 python credential/request_credential.py
