"""歌曲相关 Schema 定义"""
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

# ========== 辅助类（Support）==========


class UrlType(str, Enum):
    SONG = "song"
    PLAYLIST = "playlist"


class AlbumInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    album_id: int = Field(..., description="专辑ID")
    album_mid: str = Field(..., description="专辑MID")
    album_name: str = Field(..., description="专辑名称")
    album_cover_url: str = Field("", description="专辑封面URL")


class SongUrlItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    url: str = Field("", description="播放链接")
    url_type: str = Field("mp3", description="格式")
    file_size: int = Field(0, description="文件大小(字节)")


# ========== 请求类（Request）==========


class SearchRequest(BaseModel):
    url_type: UrlType = Field(..., description="搜索类型: song/playlist")
    search_url: str = Field(..., min_length=1, description="搜索URL")
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(10, ge=1, le=100, description="每页数量")
    request_id: str = Field("0", description="请求ID")


class AlbumImgRequest(BaseModel):
    request_id: str = Field("0", description="请求ID")
    album_id_list: list[str] = Field(..., min_length=1, description="专辑MID列表")


class SongUrlRequest(BaseModel):
    request_id: str = Field("0", description="请求ID")
    song_id_list: list[str] = Field(..., min_length=1, description="歌曲MID列表")


# ========== 响应类（Response）==========


class SongItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    song_id: int = Field(..., description="歌曲ID")
    song_mid: str = Field(..., description="歌曲MID")
    song_name: str = Field(..., description="歌曲名称")
    singer: str = Field(..., description="歌手")
    genre: str = Field("", description="流派")
    lan: str = Field("", description="语言")
    create_time: str = Field("", description="发布时间")
    album: AlbumInfo = Field(..., description="专辑信息")
    duration: str = Field(..., description="时长")
    song_url: SongUrlItemResponse | None = Field(None, description="歌曲链接信息")


class SearchResponse(BaseModel):
    request_id: str = Field(..., description="请求ID")
    result: list[SongItemResponse] = Field(default_factory=list, description="歌曲列表")
    total: int = Field(0, description="总数")


class AlbumImgResponse(BaseModel):
    request_id: str = Field(..., description="请求ID")
    result: list[str] = Field(default_factory=list, description="封面URL列表")


class SongUrlResponse(BaseModel):
    request_id: str = Field(..., description="请求ID")
    result: list[SongUrlItemResponse] = Field(default_factory=list, description="歌曲链接列表")
