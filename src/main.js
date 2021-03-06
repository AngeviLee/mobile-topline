import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
// 导入vant,导入图片懒加载
import Vant, { Lazyload } from 'vant'
import 'vant/lib/index.css'
// 引入适配所需要的lib-fiexible
import 'amfe-flexible'
// 引入自定义全局样式
import './styles/index.less'
// 引入表单验证插件
// 1.引入语言包
import zhCN from 'vee-validate/dist/locale/zh_CN'
import VeeValidate, { Validator } from 'vee-validate'
// 引入dayjs处理时间格式
import dayjs from 'dayjs'
// 加载中文语言包
import 'dayjs/locale/zh-cn'
// dayjs的相对时间插件
import relativeTime from 'dayjs/plugin/relativeTime'
// 把插件注册到dayjs中
dayjs.extend(relativeTime)

// 配置中文使用的语言包
dayjs.locale('zh-cn')

// 注册一个全局过滤器来处理日期格式的展示
// 过滤器就是一个函数，我们可以在模板中通过{{ 数据 | 过滤器 }} 来调用这个过滤器函数
// 过滤器函数接收的参数就是你的数据，返回值就会绑定输出到使用的位置
// {{ 数据 | relativeTime }}
// 好处：任何组件的模板都可以通过 {{ 数据 | 过滤器 }} 来使用这里定义的过滤器
// 说白了就是一个全局函数
Vue.filter('relativeTime', value => {
  return dayjs().from(value)
})

Vue.use(VeeValidate, {
  // 配置触发时机
  // 配置改变的时候去触发校验，默认是input
  events: ''
})

// 配置语言
Validator.localize('zh_CN', zhCN)

Vue.use(Vant)
Vue.use(Lazyload)

Vue.config.productionTip = false

// 给Vue原型上添加一个方法
Vue.prototype.$sleep = time => {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      resolve()
    }, time)
  })
}

Vue.prototype.$isLogin = () => {
  // 校验登录状态

  // 如果没有登录，则跳转到登录页
  if (!store.state.user) {
    router.push({
      name: 'login'
    })
    return false
  }
  // 如果登录了执行后续逻辑操作
  return true
}

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
