"""歌曲相关路由"""
from fastapi import APIRouter

from app.schemas.common import ApiResponse
from app.schemas.response import error, success
from app.schemas.song import (
    AlbumImgRequest,
    AlbumImgResponse,
    SearchRequest,
    SearchResponse,
    SongUrlRequest,
    SongUrlResponse,
)
from app.services import song as services_song
from app.utils.exception import ServiceException

router = APIRouter(prefix="/song", tags=["歌曲"])


@router.post("/search", response_model=ApiResponse)
async def search(request: SearchRequest):
    """搜索歌曲/歌单"""
    try:
        result = await services_song.search_song(request)
        return success(data=result.model_dump())
    except ServiceException as e:
        return error(code=e.code, message=e.message)


@router.post("/albumImg", response_model=ApiResponse)
async def get_album_images(request: AlbumImgRequest):
    """获取专辑封面"""
    try:
        result = await services_song.get_album_images(request)
        return success(data=result.model_dump())
    except ServiceException as e:
        return error(code=e.code, message=e.message)


@router.post("/songUrl", response_model=ApiResponse)
async def get_song_urls(request: SongUrlRequest):
    """获取歌曲下载链接"""
    try:
        result = await services_song.get_song_urls(request)
        return success(data=result.model_dump())
    except ServiceException as e:
        return error(code=e.code, message=e.message)
