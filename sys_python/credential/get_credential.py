"""凭证加载模块"""
import json
import os
from qqmusic_api.models.request import Credential


def get_credential() -> Credential:
    """从本地 JSON 文件加载凭证"""
    try:
        credential_path = os.path.join(os.path.dirname(__file__), "credential.json")
        with open(credential_path, "r") as f:
            credential_dict = json.loads(f.read())
        return Credential.model_validate(credential_dict)
    except FileNotFoundError:
        print("请先登录")
        exit(1)


async def judge_credential():
    """检查凭证是否过期"""
    credential = get_credential()
    print(f"credential:{credential}")
    print(f"credential是否过期:{credential.is_expired()}")
