import request from '@/utils/request'

/**
 * 搜索歌曲
 * @param {Object} params - 搜索参数
 * @param {string} params.urlType - 链接类型 (song/playlist)
 * @param {string} params.searchUrl - 搜索链接
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.requestId - 请求唯一标识，用于过滤过期响应
 * @returns {Promise} 搜索结果，包含歌曲列表和总数
 */
export function searchSongs(params) {
  return request.post('/song/search', params)
}

/**
 * 获取专辑封面图片
 * @param {string[]} albumIdList - 专辑 MID 列表
 * @returns {Promise} 封面图片 URL 列表
 */
export function getAlbumImages(albumIdList) {
  return request.post('/song/albumImg', { albumIdList })
}

/**
 * 获取歌曲播放链接
 * @param {string[]} songIdList - 歌曲 MID 列表
 * @returns {Promise} 歌曲播放链接列表，包含 URL、格式、文件大小等信息
 */
export function getSongUrls(songIdList) {
  return request.post('/song/songUrl', { songIdList })
}
