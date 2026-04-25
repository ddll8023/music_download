"""歌曲搜索与歌单查询服务"""
import json
import os

from qqmusic_api.modules.song import SongFileType, SongFileInfo
from credential.get_credential import get_credential
from untils.qqmusic_client import get_client

CDN_DOMAIN = "https://isure.stream.qqmusic.qq.com/"


async def search_song(song_id: int):
    """搜索单曲详情"""
    client = await get_client()
    detail = await client.execute(client.song.get_detail(song_id))

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

    album = {
        "albumId": detail.track.album.id,
        "albumMid": detail.track.album.mid,
        "albumName": detail.track.album.title,
        "albumCoverUrl": "",
    }

    duration = detail.track.interval
    duration_str = f"{duration // 60:02d}:{duration % 60:02d}"

    return {
        "result": [
            {
                "songId": song_id,
                "songMid": song_mid,
                "songName": detail.track.title,
                "singer": singer,
                "genre": genre,
                "lan": lan,
                "createTime": detail.track.time_public,
                "album": album,
                "duration": duration_str,
                "songUrl": "",
            }
        ],
        "total": 1,
    }


async def search_songlist(
    songlist_id: int, page: int = 1, page_size: int = 10, request_id: str = "0"
):
    """搜索歌单歌曲列表"""
    client = await get_client()
    result = await client.execute(
        client.songlist.get_detail(songlist_id, num=page_size, page=page)
    )

    data = {
        "result": [],
        "total": result.total,
        "requestId": request_id,
    }

    for song in result.songs:
        singer = " / ".join(s.name for s in song.singer)
        duration = song.interval
        duration_str = f"{duration // 60:02d}:{duration % 60:02d}"

        album = {
            "albumId": song.album.id,
            "albumMid": song.album.mid,
            "albumName": song.album.title,
            "albumCoverUrl": "",
        }

        data["result"].append(
            {
                "songId": song.id,
                "songMid": song.mid,
                "songName": song.title,
                "singer": singer,
                "genre": "",
                "lan": "",
                "createTime": song.time_public,
                "album": album,
                "duration": duration_str,
                "songUrl": {"url": "", "urlType": "flac"},
            }
        )

    return data


async def get_song_url_list(song_mid_list: list, file_type, credential):
    """获取歌曲下载链接列表"""
    client = await get_client()
    file_info = [SongFileInfo(mid=mid) for mid in song_mid_list]
    result = await client.execute(
        client.song.get_song_urls(file_info=file_info, file_type=file_type, credential=credential)
    )

    urls = {}
    for item in result.data:
        url = f"{CDN_DOMAIN}{item.purl}" if item.purl else ""
        urls[item.mid] = url

    return urls
