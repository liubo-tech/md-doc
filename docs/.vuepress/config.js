module.exports = {
  title: 'Java同学会',
  description: 'Java 技术 互联网 Spring Redis Mysql ',
  head: [
	['meta', { name: 'keywords', content: 'Java 技术 互联网 Spring SpringBoot SpringCloud Elastic Search MySQL MyCAT 分布式 集群' }]
  ],
  themeConfig: {
	sidebar: [
	  ['/article/oauth', 'OAuth授权'],
	  ['/article/sso', 'SSO单点登录流程'],
	  ['/article/front-back', '前后端分离 | 登录状态'],
	  ['/article/es-1', 'ES学习（一）ES的安装与启动'],
	  ['/article/es-2', 'ES学习（二）ES的集群原理'],
	  ['/article/es-3', 'ES学习（三）新建索引'],
	  ['/article/es-4', 'ES学习（四）字段类型（mapping）'],
	  ['/article/es-5', 'ES学习（五）动态映射'],
	  ['/article/es-6', 'ES学习（六）分析器'],
	  ['/article/es-7', 'ES学习（七）IK中文分词器'],
	  ['/article/es-8', 'ES学习（八）数据的增删改'],
	  ['/article/es-9', 'ES学习（九）搜索'],
	  ['/article/mysql-ms', 'MySQL主从同步配置'],
	  ['/article/mysql-huan', 'MySQL中的幻读，你真的理解吗？'],
	  ['/article/db-pool', '数据库连接池数量设置为多少？'],
	  ['/article/CSRF', 'CSRF的原理与防御'],
	  ['/article/redis-lock', 'Redis分布式锁'],
	  ['/article/limit', 'MySql分页查询慢'],
	  ['/article/taglib', '自制权限框架（一）jsp标签'],
	  ['/article/annotation', '自制权限框架（二）注解'],
	  ['/article/jmeter-1', 'JMeter测试（一）'],
	  ['/article/jmeter-2', 'JMeter测试（二）'],
	  ['/article/spring-security', 'Spring Security实现RBAC权限管理'],
	  ['/article/nginx1', 'Nginx简介（一）'],
	  ['/article/nginx2', 'Nginx简介（二）'],
	  ['/article/string', 'String是值传递还是引用传递'],
	  ['/article/redis-cluster', 'Redis集群'],
	  ['/article/cas', 'CAS与OAuth2的区别'],
	  ['/article/spring-eureka-2', 'Eureka服务注册与发现'],
	  ['/article/spring-mobile', 'Spring Mobile']
    ],
	nav: [
      { text: '首页', link: '/' },
      { text: '公众号', link: '/gzh/gzh' },
      { text: '慕课课程', 
		items: [
		  { text: '精讲分布式定时任务', link: 'https://coding.imooc.com/class/341.html' },
		  { text: 'Java架构师直通车', link: 'https://class.imooc.com/sale/javaarchitect' }
		]
	  },
    ]
  }
}