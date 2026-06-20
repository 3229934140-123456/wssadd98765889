export default defineAppConfig({
  pages: [
    'pages/calendar/index',
    'pages/writing/index',
    'pages/warning/index',
    'pages/mine/index',
    'pages/onboarding/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#2D5A7B',
    navigationBarTitleText: '码字课表',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#2D5A7B',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/calendar/index',
        text: '课表'
      },
      {
        pagePath: 'pages/writing/index',
        text: '写作'
      },
      {
        pagePath: 'pages/warning/index',
        text: '预警'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
