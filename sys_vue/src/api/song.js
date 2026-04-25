import request from '@/utils/request'

export function searchSongs(params) {
  return request.post('/song/search', params)
}

export function getAlbumImages(albumIdList) {
  return request.post('/song/albumImg', { albumIdList })
}

export function getSongUrls(songIdList) {
  return request.post('/song/songUrl', { songIdList })
}
