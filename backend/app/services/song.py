"""歌曲搜索与下载服务"""
import logging
from urllib.parse import parse_qs, urlparse

import httpx
from qqmusic_api.modules.song import SongFileType, SongFileInfo

from app.credential.get_credential import get_credential
from app.qqmusic.client import get_client
from app.schemas.common import ErrorCode
from app.schemas.song import (
    AlbumImgRequest,
    AlbumImgResponse,
    AlbumInfo,
    SearchRequest,
    SearchResponse,
    SongItemResponse,
    SongUrlItemResponse,
    SongUrlRequest,
    SongUrlResponse,
)
from app.utils.exception import ServiceException

ALBUM_COVER_TEMPLATE = "https://y.gtimg.cn/music/photo_new/T002R300x300M000{mid}.jpg"
CDN_DOMAIN = "https://isure.stream.qqmusic.qq.com/"


# ========== 公共入口函数 ==========


async def search_song(request: SearchRequest) -> SearchResponse:
    """搜索歌曲/歌单"""
    if request.url_type.value == "song":
        return await _search_single_song(request)
    else:
        return await _search_playlist(request)


async def get_album_images(request: AlbumImgRequest) -> AlbumImgResponse:
    """获取专辑封面URL列表"""
    cover_urls = []
    for album_mid in request.album_id_list:
        cover_urls.append(ALBUM_COVER_TEMPLATE.format(mid=album_mid))
    return AlbumImgResponse(request_id=request.request_id, result=cover_urls)


async def get_song_urls(request: SongUrlRequest) -> SongUrlResponse:
    """获取歌曲下载链接"""
    client = await get_client()
    credential = get_credential()
    file_info = [SongFileInfo(mid=mid) for mid in request.song_id_list]

    try:
        result = await client.execute(
            client.song.get_song_urls(
                file_info=file_info,
                file_type=SongFileType.FLAC,
                credential=credential,
            )
        )
    except Exception:
        logging.exception("QQ Music API 获取歌曲链接失败")
        raise ServiceException(ErrorCode.AI_SERVICE_ERROR, "服务调用失败，请稍后重试")

    url_map = {}
    for item in result.data:
        url = f"{CDN_DOMAIN}{item.purl}" if item.purl else ""
        url_map[item.mid] = url

    response_list = []
    for song_mid in request.song_id_list:
        song_url = url_map.get(song_mid, "")
        url_type = "flac" if song_url and "flac" in song_url.lower() else "mp3"
        file_size = 0

        if song_url:
            file_size = await _get_file_size(song_url)

        response_list.append(
            SongUrlItemResponse(
                url=song_url if song_url else "null",
                url_type=url_type,
                file_size=file_size,
            )
        )

    return SongUrlResponse(request_id=request.request_id, result=response_list)


"""辅助函数"""


async def _search_single_song(request: SearchRequest) -> SearchResponse:
    """搜索单曲"""
    redirect_params = await _resolve_redirect(request.search_url)
    song_id_str = redirect_params.get("songid")
    if not song_id_str:
        raise ServiceException(ErrorCode.PARAM_ERROR, "未找到 songid")

    song_id = int(song_id_str[0] if isinstance(song_id_str, list) else song_id_str)
    logging.info(f"查询歌曲: {song_id}")

    song_item = await _fetch_song_detail(song_id)
    return SearchResponse(
        request_id=request.request_id,
        result=[song_item],
        total=1,
    )


async def _search_playlist(request: SearchRequest) -> SearchResponse:
    """搜索歌单"""
    redirect_params = await _resolve_redirect(request.search_url)
    playlist_id_str = redirect_params.get("id")
    if not playlist_id_str:
        raise ServiceException(ErrorCode.PARAM_ERROR, "未找到歌单ID")

    playlist_id = int(playlist_id_str[0] if isinstance(playlist_id_str, list) else playlist_id_str)

    items, total = await _fetch_songlist(playlist_id, request.page, request.page_size)
    logging.info(
        f"查询歌单: {request.search_url} page:{request.page} pageSize:{request.page_size} 成功:{len(items)}条"
    )

    return SearchResponse(
        request_id=request.request_id,
        result=items,
        total=total,
    )


async def _resolve_redirect(url: str) -> dict:
    """解析302重定向URL中的查询参数"""
    try:
        async with httpx.AsyncClient(follow_redirects=False) as client:
            response = await client.get(url)
    except Exception:
        raise ServiceException(ErrorCode.INTERNAL_ERROR, "重定向请求失败")

    if response.status_code != 302:
        raise ServiceException(ErrorCode.PARAM_ERROR, "链接无法解析，请检查URL")

    location = response.headers.get("location")
    if not location:
        raise ServiceException(ErrorCode.PARAM_ERROR, "重定向响应缺少Location头")

    logging.info(f"重定向到: {location}")
    parsed = urlparse(location)
    return parse_qs(parsed.query)


async def _fetch_song_detail(song_id: int) -> SongItemResponse:
    """获取单曲详情"""
    client = await get_client()

    try:
        detail = await client.execute(client.song.get_detail(song_id))
    except Exception:
        logging.exception(f"获取歌曲详情失败: {song_id}")
        raise ServiceException(ErrorCode.AI_SERVICE_ERROR, "服务调用失败，请稍后重试")

    song_mid = detail.track.mid
    singer = " / ".join(s.name for s in detail.track.singer)

    try:
        genre = " / ".join(item.value for item in detail.genre)
    except (AttributeError, TypeError):
        genre = ""

    try:
        lan = " / ".join(item.value for item in detail.lan)
    except (AttributeError, TypeError):
        lan = ""

    album = AlbumInfo(
        album_id=detail.track.album.id,
        album_mid=detail.track.album.mid,
        album_name=detail.track.album.title,
        album_cover_url="",
    )

    duration = detail.track.interval
    duration_str = f"{duration // 60:02d}:{duration % 60:02d}"

    return SongItemResponse(
        song_id=song_id,
        song_mid=song_mid,
        song_name=detail.track.title,
        singer=singer,
        genre=genre,
        lan=lan,
        create_time=detail.track.time_public,
        album=album,
        duration=duration_str,
        song_url=None,
    )


async def _fetch_songlist(
    songlist_id: int, page: int, page_size: int
) -> tuple[list[SongItemResponse], int]:
    """获取歌单歌曲列表"""
    client = await get_client()

    try:
        result = await client.execute(
            client.songlist.get_detail(songlist_id, num=page_size, page=page)
        )
    except Exception:
        logging.exception(f"获取歌单详情失败: {songlist_id}")
        raise ServiceException(ErrorCode.AI_SERVICE_ERROR, "服务调用失败，请稍后重试")

    items = []
    for song in result.songs:
        singer = " / ".join(s.name for s in song.singer)
        duration = song.interval
        duration_str = f"{duration // 60:02d}:{duration % 60:02d}"

        album = AlbumInfo(
            album_id=song.album.id,
            album_mid=song.album.mid,
            album_name=song.album.title,
            album_cover_url="",
        )

        items.append(
            SongItemResponse(
                song_id=song.id,
                song_mid=song.mid,
                song_name=song.title,
                singer=singer,
                genre="",
                lan="",
                create_time=song.time_public,
                album=album,
                duration=duration_str,
                song_url=None,
            )
        )

    return items, result.total


async def _get_file_size(url: str) -> int:
    """通过HEAD请求获取文件大小"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.head(url, follow_redirects=True, timeout=5.0)
        content_length = response.headers.get("content-length")
        if content_length:
            return int(content_length)
    except Exception:
        logging.warning(f"获取文件大小失败: {url}")
    return 0
