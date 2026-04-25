"""歌曲相关路由"""
from urllib.parse import parse_qs, urlparse
import httpx
import logging
from typing import List, Literal
from flask import Blueprint, request
from flask_cors import cross_origin
from common.configure_logging import configure_logging
from common.result import Result
from credential.get_credential import get_credential
from qqmusic_api.modules.song import SongFileType
import asyncio

from untils.search_song import get_song_url_list, search_songlist

song_bp = Blueprint("song", __name__, url_prefix="/song")
configure_logging()

ALBUM_COVER_TEMPLATE = "https://y.gtimg.cn/music/photo_new/T002R300x300M000{mid}.jpg"


@song_bp.route("/search", methods=["POST", "OPTIONS"])
def search():
    if request.method == "OPTIONS":
        return "", 200

    try:
        request_id: str = request.json.get("requestId", "0")
        url_type: str = request.json.get("urlType")
        url: str = request.json.get("searchUrl")
        page: int = request.json.get("page", 1)
        page_size: int = request.json.get("pageSize", 10)
        if url_type not in ["song", "playlist"]:
            logging.error(f"url_type参数错误")
            return (
                Result.result_fail("url_type参数错误", data={"requestId": request_id}),
                400,
            )
        if not url:
            logging.error(f"url参数错误")
            return (
                Result.result_fail("url参数错误", data={"requestId": request_id}),
                400,
            )

        if url_type == "song":
            response = httpx.get(url)
            if response.status_code != 302:
                logging.error(f"重定向失败，状态码:{response.status_code}")
                return (
                    Result.result_fail(
                        "重定向失败", data={"requestId": request_id}
                    ),
                    400,
                )
            if "Location" not in response.headers:
                logging.error(f"重定向响应缺少 Location 头")
                return (
                    Result.result_fail(
                        "重定向失败", data={"requestId": request_id}
                    ),
                    400,
                )
            redirect_url = response.headers["Location"]
            logging.info(f"重定向到:{redirect_url}")

            parsed_url = urlparse(redirect_url)
            query_params = parse_qs(parsed_url.query)

            if "songid" not in query_params:
                logging.error(f"未找到 songid")
                return (
                    Result.result_fail(
                        "未找到 songid", data={"requestId": request_id}
                    ),
                    400,
                )

            song_id: int = int(query_params["songid"][0])
            logging.info(f"查询歌曲:{song_id}")

            from untils.search_song import search_song

            data = asyncio.run(search_song(song_id=song_id))
            data["requestId"] = request_id
            logging.info(f"查询成功:{data}")
            return Result.result_success(msg="查询成功", data=data), 200
        elif url_type == "playlist":
            res = httpx.get(url)
            if res.status_code == 302:
                if "Location" not in res.headers:
                    logging.error(f"重定向失败1")
                    return (
                        Result.result_fail(
                            "重定向失败1", data={"requestId": request_id}
                        ),
                        400,
                    )
                redirect_url = res.headers["Location"]
                logging.info(f"重定向到:{redirect_url}")

                parsed_url = urlparse(redirect_url)
                query_params = parse_qs(parsed_url.query)

                if "id" not in query_params:
                    logging.error(f"未找到 id")
                    return (
                        Result.result_fail("未找到 id", data={"requestId": request_id}),
                        400,
                    )
                playlist_id: int = int(query_params["id"][0])
                data = asyncio.run(
                    search_songlist(
                        songlist_id=playlist_id,
                        page=page,
                        page_size=page_size,
                        request_id=request_id,
                    )
                )

                logging.info(
                    f"查询歌单:{url} page:{page} pageSize:{page_size} 查询成功:{len(data['result'])}条"
                )
                return Result.result_success(msg="查询成功", data=data), 200
            else:
                logging.error(f"重定向失败2")
                return (
                    Result.result_fail("重定向失败2", data={"requestId": request_id}),
                    400,
                )
    except Exception as e:
        logging.error(f"Error: {e}")
        return Result.result_fail(f"查询错误:{e}", data={"requestId": request_id}), 400


@song_bp.route("/albumImg", methods=["POST", "OPTIONS"])
def album_img():
    if request.method == "OPTIONS":
        return "", 200

    try:
        request_id = request.json.get("requestId")
        album_mid_list: List[str] = request.json.get("albumIdList")
        if not album_mid_list:
            logging.error(f"album_mid_list参数错误")
            return (
                Result.result_fail(
                    "album_mid_list参数错误", data={"requestId": request_id}
                ),
                400,
            )
        data = {"requestId": request_id, "result": []}
        for album_mid in album_mid_list:
            cover_url = ALBUM_COVER_TEMPLATE.format(mid=album_mid)
            data["result"].append(cover_url)
        logging.info(f"查询成功")
        return Result.result_success(msg="查询成功", data=data), 200
    except Exception as e:
        logging.error(f"Error: {e}")
        return Result.result_fail(f"查询错误:{e}"), 400


@song_bp.route("/songUrl", methods=["POST", "OPTIONS"])
def get_song_url():
    if request.method == "OPTIONS":
        return "", 200

    try:
        request_id = request.json.get("requestId")
        song_id_list: List[int] = request.json.get("songIdList")
        if not song_id_list:
            logging.error(f"song_id_list参数错误")
            return Result.result_fail("song_id_list参数错误"), 400
        data = {"requestId": request_id, "result": []}
        logging.info(f"查询歌曲链接:{song_id_list}")
        song_url_list = asyncio.run(
            get_song_url_list(
                song_mid_list=song_id_list,
                file_type=SongFileType.FLAC,
                credential=get_credential(),
            )
        )
        logging.info(f"查询歌曲链接:{song_url_list} 成功")
        for song_id, url_info in song_url_list.items():
            song_url_dict = {"url": "", "urlType": "mp3", "fileSize": 0}
            song_url = url_info
            if song_url:
                song_url_dict["url"] = song_url
                if "flac" in song_url.lower():
                    song_url_dict["urlType"] = "flac"

                try:
                    head_response = httpx.head(song_url, follow_redirects=True, timeout=5.0)
                    content_length = head_response.headers.get("content-length")
                    if content_length:
                        song_url_dict["fileSize"] = int(content_length)
                        logging.debug(f"获取文件大小成功: {song_url_dict['fileSize']} bytes")
                except Exception as e:
                    logging.warning(f"获取文件大小失败: {e}")
                    song_url_dict["fileSize"] = 0
            else:
                song_url_dict["url"] = "null"
            data["result"].append(song_url_dict)
        logging.info(f"查询成功:{len(song_url_dict)}条")
        return Result.result_success(msg="查询成功", data=data), 200
    except Exception as e:
        logging.error(f"Error: {e}")
        return Result.result_fail(f"查询错误:{e}"), 400
