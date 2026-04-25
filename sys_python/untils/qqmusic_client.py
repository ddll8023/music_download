"""QQ Music API 客户端管理"""
from qqmusic_api import Client
from qqmusic_api.models.request import Credential
from credential.get_credential import get_credential

_client: Client | None = None


async def get_client() -> Client:
    """获取全局 Client 单例"""
    global _client
    if _client is None:
        credential = get_credential()
        _client = Client(credential=credential)
    return _client
