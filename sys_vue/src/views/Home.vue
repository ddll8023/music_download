<script setup>

import { computed, nextTick, reactive, ref } from "vue";
import { Search } from "@element-plus/icons-vue";
import request from "@/utils/request.js";
import DefaultImg from '@/assets/img/init_img.jpg'
import { ElMessage } from "element-plus";
// 用于存储当前选中的歌曲
const selectedSongs = ref([])

// 获取表格实例，用于全选/全不选
const tableRef = ref(null)
const data = reactive({
  DefaultImg
})
// =========== 核心：唯一请求标识 ===========
let currentRequestId = 0; // 记录当前页面的最新请求ID
function generateRequestId() {
  return Date.now() + "_" + Math.random();
}
const searchData = reactive({
  urlType: 'playlist',
  searchUrl: '',
  searchUrlType: [
    {
      index: 0,
      label: '歌曲链接',
      value: 'song'
    },
    {
      index: 1,
      label: '歌单链接',
      value: 'playlist'
    }
  ]
})
const songData = reactive({
  songList: [
  ],
  total: 0,
  page: 1,
  pageSize: 20
})

// 查询歌曲（异步版本）
const handleSearch = async () => {
  try {
    // 重置数据
    songData.songList = [];
    // 1. 生成新的 requestId 并把它保存为 currentRequestId
    const requestId = generateRequestId();
    currentRequestId = requestId;
    // songData.total = 0;

    // 执行搜索请求
    const searchResponse = await request.post('/song/search', {
      urlType: searchData.urlType,
      searchUrl: searchData.searchUrl,
      page: songData.page,
      pageSize: songData.pageSize,
      requestId
    });
    // 3. 服务器返回后，对比 requestId 是否仍是当前最新
    if (searchResponse.data.requestId !== currentRequestId) {
      console.log("本次响应已过期，丢弃");
      return;
    }

    // 处理响应数据
    songData.songList = searchResponse.data.result;
    songData.total = searchResponse.data.total;

    // 提取专辑ID并获取封面
    const songAlbumIdList = songData.songList.map(item => item.album.albumMid.toString());
    await getAlbumImg(songAlbumIdList);

  } catch (error) {
    console.error('歌曲搜索失败:', error);
    // 这里可以添加错误处理逻辑，例如显示错误提示

  }
};

// 查询歌曲封面（异步版本）
const getAlbumImg = async (songAlbumIdList) => {
  try {
    const requestId = currentRequestId; // 跟搜索同一个 requestId
    // 过滤空值
    let validIds = songAlbumIdList.filter(Boolean);
    if (validIds.length === 0) return;

    // 发送请求获取封面
    const imgResponse = await request.post('/song/albumImg', {
      albumIdList: validIds,
      requestId
    });
    // 检查返回是否过期
    if (imgResponse.data.requestId !== currentRequestId) {
      console.log("albumImg 响应已过期，不处理");
      return;
    }
    imgResponse.data = imgResponse.data.result;
    console.log('封面数据:', imgResponse);
    console.log('歌曲列表:', songData.songList);
    // 处理封面数据
    if (imgResponse.data) {
      // 将封面数据映射到歌曲列表
      for (let i = 0; i < songData.songList.length; i++) {
        // console.log('封面数据:', imgResponse.data[i]);
        songData.songList[i].album.albumCoverUrl = imgResponse.data[i];
      }
    }
    // 提取歌曲ID并获取链接
    validIds = songData.songList.map(item => item.songMid.toString());
    await getSongUrl(validIds);
    // console.log('歌曲封面列表:', songData.songList);

  } catch (error) {
    console.error('封面获取失败:', error);
    // 这里可以添加错误处理逻辑
  }
};

//获取歌曲链接
const getSongUrl = async (validIds) => {
  try {
    const requestId = currentRequestId;

    // 发送请求获取歌曲链接
    const songUrlResponse = await request.post('/song/songUrl', {
      songIdList: validIds,
      requestId
    });
    if (songUrlResponse.data.requestId !== currentRequestId) {
      console.log("songUrl 响应已过期，不处理");
      return;
    }
    songUrlResponse.data = songUrlResponse.data.result;
    console.log('歌曲链接:', songUrlResponse);
    if (songUrlResponse.data) {
      for (let i = 0; i < songData.songList.length; i++) {
        songData.songList[i].songUrl = songUrlResponse.data[i];
      }
    }
    console.log('歌曲链接列表:', songData.songList);
    ElMessage.success('音乐链接获取成功');
  } catch (error) {
    console.error('封面获取失败:', error);
    // 这里可以添加错误处理逻辑
  }
};

// 新增下载处理方法
const handleDownload = async (song) => {
  try {
    if (!songData.songList[0]?.songUrl?.url) {
      ElMessage.warning('请等待音乐链接获取完成');
      return;
    }
    if (!song.songUrl.url) {
      ElMessage.warning('音乐链接获取失败');
      return;
    }
    // 使用fetch获取文件流
    const response = await fetch(song.songUrl.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${song.songName} - ${song.singer}.${song.songUrl.urlType}`; // 现在可以自定义文件名
    document.body.appendChild(link);
    link.click();

    // 5秒后清理内存
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 5000);

  } catch (error) {
    console.error('下载失败:', error);
    ElMessage.error('文件下载失败');
  }
};

//切换页码
const handlePageChange = async (page) => {
  songData.page = page;
  await handleSearch();
};

//切换每页显示数量
const handlePageSizeChange = async (pageSize) => {
  songData.pageSize = pageSize;
  await handleSearch();
};
// 全选或取消全选
const handleSelectAll = () => {
  if (tableRef.value) {
    tableRef.value.toggleAllSelection();
  }
};
// 选中行变化时获取选中列表
const handleSelectionChange = (selection) => {
  selectedSongs.value = selection;
};

// 全部下载
const handleAllDownload = async () => {
  if (!selectedSongs.value.length) {
    ElMessage.warning('请选择要下载的歌曲');
    return;
  }
  if (!songData.songList[0]?.songUrl?.url) {
    ElMessage.warning('请等待音乐链接获取完成');
    return;
  }

  // 过滤出有效链接的歌曲
  const validSongs = selectedSongs.value.filter(song => song.songUrl?.url && song.songUrl?.url !== 'null');

  if (validSongs.length === 0) {
    ElMessage.warning('选中的歌曲均无法下载，请重新选择');
    return;
  }

  if (validSongs.length < selectedSongs.value.length) {
    ElMessage.warning(`共选择了${selectedSongs.value.length}首歌曲，其中${selectedSongs.value.length - validSongs.length}首因链接无效无法下载`);
  }

  for (const song of validSongs) {
    await handleDownload(song);
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '未知';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};


</script>

<template>
  <el-container>
    <el-header>
      <span class="title">音乐下载平台</span>
      <div class="search">
        <div class="download-area">
          <el-button type="primary" size="large" @click="handleSelectAll">一键全选</el-button>
          <el-button type="primary" size="large" @click="handleAllDownload">全部下载</el-button>
        </div>
        <el-select v-model="searchData.urlType" class="select" size="large">
          <el-option v-for="item in searchData.searchUrlType" :label="item.label" :value="item.value"></el-option>
        </el-select>
        <el-input :prefix-icon="Search" clearable v-model="searchData.searchUrl" size="large"
          placeholder="请输入链接"></el-input>
        <el-button size="large" type="primary" @click="handleSearch">查询</el-button>
      </div>
    </el-header>
    <el-main>

      <el-table ref="tableRef" :data="songData.songList" show-overflow-tooltip @selection-change="handleSelectionChange"
        fit>
        <!-- 使用type="selection"自动生成多选列并支持表头全选 -->
        <el-table-column type="selection" width="40" fixed />
        <!--        序号-->
        <el-table-column type="index" width="40" fixed />
        <el-table-column width="80" fixed>
          <template #default="{ row }">
            <el-image class="song-cover" :src="row.album.albumCoverUrl || data.DefaultImg"></el-image>
          </template>
        </el-table-column>
        <el-table-column prop="songName" label="歌名" min-width="120" />
        <el-table-column prop="singer" label="歌手" min-width="100" />
        <el-table-column prop="album.albumName" label="专辑" min-width="120" />
        <el-table-column prop="createTime" label="出版时间" min-width="100" />
        <el-table-column prop="duration" label="时长" min-width="60" />
        <el-table-column label="格式" min-width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.songUrl?.urlType" type="primary" size="small">
              {{ row.songUrl.urlType.toUpperCase() }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="大小" min-width="90" align="center">
          <template #default="{ row }">
            <span>{{ formatFileSize(row.songUrl?.fileSize) }}</span>
          </template>
        </el-table-column>
        <el-table-column min-width="60" fixed="right">
          <template #default="{ row }">
            <el-tooltip :content="row.songUrl?.url === 'null' || !row.songUrl?.url ? '该歌曲链接无效，无法下载' : '点击下载'"
              placement="top" :disabled="row.songUrl?.url && row.songUrl?.url !== 'null'">
              <el-button type="text" size="large" @click="handleDownload(row)"
                :disabled="row.songUrl?.url === 'null' || !row.songUrl?.url">
                下载
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页控制器 -->
      <div class="pagination-container">
        <span class="total">共 {{ songData.total }} 条</span>
        <el-pagination v-model:current-page="songData.page" v-model:page-size="songData.pageSize"
          :page-sizes="[10, 20, 30, 50]" :total="songData.total" layout="sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange" @current-change="handlePageChange" />
      </div>
    </el-main>

  </el-container>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/Home';
</style>