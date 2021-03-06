<template>
  <div class="home">
    <van-nav-bar
      title="首页-搜索"
      fixed
      @click.native="$router.push({ name: 'search' })"
    />
    <van-tabs v-model="activeChannelIndex" class="channel-tabs">
      <div slot="nav-right" class="wrap-nav" @click="isChannelShow = true">
        <van-icon name="wap-nav" />
      </div>
      <van-tab v-for="channelItem in channels" :key="channelItem.id" :title="channelItem.name">
        <!-- 下拉列表 -->
        <van-pull-refresh
          v-model="channelItem.drownPullLoading"
          @refresh="onRefresh"
          :success-text="channelItem.drownPullSuccessText"
          :success-duration="1000"
        >
          <!-- list列表 -->
          <van-list
            v-model="channelItem.upPullLoading"
            :finished="channelItem.upPullFinished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <!-- 展示文章列表更多内容 -->
            <van-cell
              v-for="articleItem in channelItem.articles"
              :key="articleItem.art_id.toString()"
              :title="articleItem.title"
            >
              <div slot="label">
                <!-- 如果有封面图片。则显示 -->
                <template v-if="articleItem.cover.type">
                  <van-grid :column-num="3" :border="false">
                    <van-grid-item
                      v-for="(img, index) in articleItem.cover.images"
                      :key="index"
                    >
                    <!-- 原生用v-lazy,vant用lazt-load -->
                      <van-image :src="img"  lazy-load />
                    </van-grid-item>
                  </van-grid>
                </template>
                <p>
                  <span>{{ articleItem.aut_name }}</span>
                  &nbsp;
                  <span>{{ articleItem.comm_count }}评论</span>
                  &nbsp;
                  <!-- 把后端返回的数据转换成另一种格式输出 -->
                  <!-- 1. 从数据的源头来转换，重用麻烦 -->
                  <!-- 2.使用一个方法，重用麻烦 -->
                  <!-- 3.使用过滤器 -->
                  <!-- 局部过滤器,filters选项，只能在当前组件使用 -->
                  <!-- 全局过滤器，Vue.filter(...)任何组件都可以使用 -->
                  <!-- 什么情况下建议使用过滤器？一般都是一些简单的文本格式操作 -->
                  <span>{{ articleItem.pubdate | relativeTime }}</span>
                  <van-icon class="question" name="question" @click="handleShowMoreAction(articleItem)"/>
                </p>
              </div>
            </van-cell>
          </van-list>
        </van-pull-refresh>
      </van-tab>
    </van-tabs>
    <!-- 频道管理组件 -->
    <!-- v-model实际上是
      v-bind:value="数据"
      v-on:input="数据=$event" 的结合

      :active-index.sync="activeChannelIndex"相当于两句代码的简写
      .sync修饰符
      :active-index="activeChannelIndex"
      @update:active-index="activeChannelIndex=$event"

      当你给一个属性加上.sync修饰符的时候，它会自动监听
        @update:绑定的字段="绑定的字段=$event"
        其中的事件名称中的update:是固定的语法
        所以你在你的子组件中发布自定义事件的时候务必要发送一个名字叫update:绑定的字段的事件
    -->
    <HomeChannel
      v-model="isChannelShow"
      :user-channels="channels"
      :active-index.sync="activeChannelIndex"
    ></HomeChannel>
    <!-- 更多操作 -->
    <more-action
      v-model="isMoreActionShow"
      :current-articel="currentArticel"
      @dislike-success="handleDislikeSuccess"
      @add-blacklist-success="handleDislikeSuccess"
    />
  </div>
</template>

<script>
// 引入封装的频道列表的js
import { getUserChannels } from '@/api/channel.js'
// 引入封装的文章接口文档列表
import { getArticles } from '@/api/article'
// 引入弹出层组件
import HomeChannel from './components/channel'
// 引进更多操作组件
import MoreAction from './components/more-action'

export default {
  name: 'homeIndex',
  components: {
    HomeChannel,
    MoreAction
  },
  data () {
    return {
      activeChannelIndex: 0,
      // 频道列表
      channels: [],
      // 弹出层显示状态
      isChannelShow: false,
      // 更多操作组件状态
      isMoreActionShow: false,
      // 默认文件记录
      currentArticel: null
    }
  },
  computed: {
    // 当前激活的频道
    // 因为频道列表是一个数组，为获得当前激活的频道的ID
    activeChannel () {
      return this.channels[this.activeChannelIndex]
    }
  },
  watch: {
    // 监视容器中的user用户
    // 记住：凡是能this点出来的成员都可以直接在这里监视
    // 由于路由缓存了，所以这里监视用户的登录状态，如果登录了，则加载用户的频道列表
    '$store.state.user' () {
      // 重新加载用户频道列表
      this.loadChannels()
      // 频道数据改变，重新加载当前激活频道的数据
      // 只需将上拉加载更多设置为true,它就会自动去调用onLoad请求函数
      this.activeChannel.upPullLoading = true
    }
  },
  created () {
    this.loadChannels()
  },
  methods: {
    async loadChannels () {
      // console.log(123)
      // 获取用户信息
      const { user } = this.$store.state
      // 定义一个频道列表
      let channels = []
      // 已登录,自我理解，如果已登录，发送请求时，或携带token令牌，
      // 所以获取的频道列表不一样
      if (user) {
        const data = await getUserChannels()
        channels = data.channels
      } else {
        // 未登录
        // 如果有本地存储数据则使用本地存储中的频道列表
        const localChannels = JSON.parse(
          window.localStorage.getItem('channels')
        )
        if (localChannels) {
          channels = localChannels
        } else {
          // 如果没有本地存储频道数据则请求获取默认推荐频道列表
          const data = await getUserChannels()
          channels = data.channels
        }
      }
      // 修改channels,将这个数据结构修改为满足我们使用的需求
      channels.forEach(item => {
        // 用来存储文章的列表
        item.articles = []
        // 控制当前频道的下拉刷新loading状态
        item.drownPullLoading = false
        // 控制当前频道的上啦加载更多的loading状态
        item.upPullLoading = false
        // 控制当前频道数据是否加载完毕
        item.upPullFinished = false
        // 存放下一页的时间戳
        item.timestamp = Date.now()
      })
      // 将自定义的频道列表赋值给data中的频道列表
      this.channels = channels
    },
    // 上拉加载更多数据
    async onLoad () {
      // console.log('onload')

      // 缓冲加载
      await this.$sleep(800)

      let data = []
      data = await this.loadArticles()

      // 如果没有pre_timestamp,且数数组是空的，则意味着没有数据了
      if (!data.pre_timestamp && !data.results.length) {
        // 设置该频道数据已记载完毕，组件自动给出提示，并且不再onLoad
        this.activeChannel.upPullFinished = true
        // 取消loading
        this.activeChannel.upPullLoading = false
        // 代码不往后执行了
        return
      }
      // console.log(data)
      // pre_timestamp 下一页的页码
      // results 文章列表
      // 解决初始化的时候没有最新推荐数据的问题（没有最新数据，那就加载上一次推荐数据）
      // 加载的是上一页数据（自我理解）
      if (data.pre_timestamp && !data.results.length) {
        this.activeChannel.timestamp = data.pre_timestamp

        // 加载下一页数据
        data = await this.loadArticles()
      }

      // 数据加载好以后，将pre_timestamp更新到当前频道中，用于加载下下页数据
      this.activeChannel.timestamp = data.pre_timestamp
      // 将文章数据更新到频道中（注意：是push追加，不是覆盖）
      this.activeChannel.articles.push(...data.results)

      // 数据加载完毕，取消上拉loading
      this.activeChannel.upPullLoading = false
    },
    // 下拉刷新
    async onRefresh () {
      const { activeChannel } = this
      // 备份下一页数据的时间戳
      const timestamp = activeChannel.timestamp
      // 使用最新时间戳去请求最新的推荐数据
      activeChannel.timestamp = Date.now()
      const data = await this.loadArticles()
      // 如果有最新数据，将数据额更新到频道的文章列表中
      if (data.results.length) {
        // 将当前最新的推荐内容重置到频道文章中
        activeChannel.articles = data.results
        // 由于你重置了文章列表，那么当前的pre_timestamp就是上拉加载更多的下一页数据的时间戳
        activeChannel.timestamp = data.pre_timestamp
        activeChannel.drownPullSuccessText = '更新成功'
        // 当下拉刷新有数据并重置以后数据无法满足一屏，所以我们使用onload再多加一页数据
        this.onLoad()
      } else {
        // 如果没有最新数据，提示已是最新内容
        activeChannel.drownPullSuccessText = '已是最新数据'
      }
      // 下拉刷新结束，取消loading
      activeChannel.drownPullLoading = false
      // 没有最新数据，将原来的用于请求下一页的时间戳恢复过来
      activeChannel.timestamp = timestamp
    },
    async loadArticles () {
      const { id: channelId, timestamp } = this.activeChannel
      const data = await getArticles({
        // 当前激活频道ID
        channelId,
        // 当前频道下一页数据的时间戳
        timestamp,
        // 是否包含置顶数据
        withTop: 1
      })
      return data
    },
    handleShowMoreAction (article) {
      // 当执行更多操作的文章记录起来，通过组件传值传给MoreAction组件
      this.currentArticel = article
      // 显示出弹框
      this.isMoreActionShow = true
    },
    handleDislikeSuccess () {
      // 获得当前激活频道的文章
      const articles = this.activeChannel.articles
      // 获得当前激活频道文章的索引
      const delIndex = articles.findIndex(item => item === this.currentArticel)
      // 从指定索引删除1个
      articles.splice(delIndex, 1)
      // 关闭弹出层
      this.isMoreActionShow = false
      this.$toast('操作成功')
    }
  }
}
</script>

<style lang='less' scoped>
// 设备里看到的是50px,但我们需要100px;
// 为看到下面的没有更多了
.channel-tabs {
  margin-bottom: 100px;
}
// 因为有scoped作用域，我们加不上类名，两种方案：
// 1.去掉scoped
// 2.用深度作用域 /deep/   vue官方提供的
// 固定list列表
.channel-tabs /deep/ .van-tabs__wrap {
  position: fixed;
  top: 92px;
}
// 为显示全列表对应的tabs内容
.channel-tabs /deep/ .van-tabs__content {
  margin-top: 100px;
}
.wrap-nav {
  position: fixed;
  right: 0;
}
.question {
  float: right;
  font-size: 40px;
}
</style>
