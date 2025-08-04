import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useCurSongDataStore = defineStore('curSong', () => {
    const curSonglist = ref([])
    const currentSong = ref(null)
    const isPlaying = ref(false)
    const bufferedProgress = ref(0)
    const currentTime = ref(0)
    const duration = ref(0)
    const playMode = ref('order') // 'order' 或 'shuffle'
    const shuffledList = ref([])    // 随机播放列表
    const currentShuffleIndex = ref(-1) // 当前随机索引
    // 切换播放模式
    const togglePlayMode = () => {
        playMode.value = playMode.value === 'order' ? 'shuffle' : 'order'
        if (playMode.value === 'shuffle') {
            generateShuffledList()
        }
    }

    // 生成随机播放列表
    const generateShuffledList = () => {
        shuffledList.value = [...curSonglist.value]
        // Fisher-Yates 洗牌算法
        for (let i = shuffledList.value.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledList.value[i], shuffledList.value[j]] =
                [shuffledList.value[j], shuffledList.value[i]]
        }
        updateShuffleIndex()
    }

    // 更新随机索引
    const updateShuffleIndex = () => {
        currentShuffleIndex.value = shuffledList.value.findIndex(
            song => song === currentSong.value
        )
    }
    const resetCurSongCurrentTime = () => {
        currentTime.value = 0
    }

    const setCurSonglist = (list) => {
        curSonglist.value = list
    }

    const setCurrentSong = (song) => {
        currentSong.value = song
        isPlaying.value = true
    }

    const resetCurSonglist = () => {
        curSonglist.value = []
    }
    const togglePlay = () => {
        isPlaying.value = !isPlaying.value
    }

    // 修改后的 nextSong 方法
    const nextSong = () => {
        if (playMode.value === 'order') {
            const index = curSonglist.value.findIndex(song => song === currentSong.value)
            const newIndex = index < curSonglist.value.length - 1 ? index + 1 : 0
            currentSong.value = curSonglist.value[newIndex]
        } else {
            currentShuffleIndex.value =
                currentShuffleIndex.value < shuffledList.value.length - 1 ?
                    currentShuffleIndex.value + 1 : 0
            currentSong.value = shuffledList.value[currentShuffleIndex.value]
        }
        currentTime.value = 0
        isPlaying.value = true
    }

    // 修改后的 prevSong 方法
    const prevSong = () => {
        if (playMode.value === 'order') {
            const index = curSonglist.value.findIndex(song => song === currentSong.value)
            const newIndex = index > 0 ? index - 1 : curSonglist.value.length - 1
            currentSong.value = curSonglist.value[newIndex]
        } else {
            currentShuffleIndex.value =
                currentShuffleIndex.value > 0 ?
                    currentShuffleIndex.value - 1 : shuffledList.value.length - 1
            currentSong.value = shuffledList.value[currentShuffleIndex.value]
        }
        currentTime.value = 0
        isPlaying.value = true
    }


    const seek = (time) => {
        currentTime.value = time
    }

    return {
        curSonglist,
        currentSong,
        isPlaying,
        bufferedProgress,
        currentTime,
        duration,
        playMode,
        setCurSonglist,
        setCurrentSong,
        resetCurSonglist,
        togglePlay,
        nextSong,
        prevSong,
        seek,
        resetCurSongCurrentTime,

        togglePlayMode
    }
})