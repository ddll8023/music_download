import request from '@/utils/request'

/**
 * 搜索歌曲
 * @param {Object} params - 搜索参数
 * @param {string} params.url_type - 链接类型 (song/playlist)
 * @param {string} params.search_url - 搜索链接
 * @param {number} params.page - 页码
 * @param {number} params.page_size - 每页数量
 * @param {string} params.request_id - 请求唯一标识，用于过滤过期响应
 * @returns {Promise} 搜索结果，包含歌曲列表和总数
 */
export function searchSongs(params) {
  return request.post('/api/v1/song/search', params)
}

/**
 * 获取专辑封面图片
 * @param {string[]} albumIdList - 专辑 MID 列表
 * @returns {Promise} 封面图片 URL 列表
 */
export function getAlbumImages(albumIdList, requestId) {
  return request.post('/api/v1/song/albumImg', { album_id_list: albumIdList, request_id: requestId })
}

/**
 * 获取歌曲播放链接
 * @param {string[]} songIdList - 歌曲 MID 列表
 * @returns {Promise} 歌曲播放链接列表，包含 URL、格式、文件大小等信息
 */
export function getSongUrls(songIdList, requestId) {
  return request.post('/api/v1/song/songUrl', { song_id_list: songIdList, request_id: requestId })
}
