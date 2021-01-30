# 注册中心Nacos集群搭建

一提到注册中心，大家往往想到Zookeeper、或者Eureka。今天我们看看阿里的一款配置中心+注册中心的中间件——Nacos。有了它以后，我们的项目中的配置就可以统一从Nacos中获取了，而且Spring Cloud的提供者和消费者还可以使用它做注册发现中心。

在搭建Nacos的时候，为了保证高可用，我们要采用的集群的方式搭建。

首先，我们要在数据库中创建一些Nacos的表，Sql文件可以点击下面的链接下载，

[Sql文件](https://github.com/alibaba/nacos/blob/master/distribution/conf/nacos-mysql.sql)

然后，我们再下载Nacos的压缩包，连接如下：

[tar.gz包](https://github.com/alibaba/nacos/releases/download/1.3.0/nacos-server-1.3.0.tar.gz)

将下载好的压缩包分别上传到3个服务器上，在我们这里3台机器分别是192.168.73.141，192.168.73.142，192.168.73.143，然后进行解压，

```shell
tar -zxvf nacos-server-1.3.2.tar.gz
```

然后，我们进入到conf目录，修改配置，如下：

```shell
vim application.properties

#*************** Config Module Related Configurations ***************#
### 数据源指定MySQL
spring.datasource.platform=mysql

### 数据库的数量:
db.num=1

### 数据库连接 IP 端口 数据库名称需要改成自己的
db.url.0=jdbc:mysql://192.168.73.150:3306/nacos_config?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTC
### 用户名
db.user=user
### 密码
db.password=youdontknow
```

这里我们主要修改数据库的配置，然后再看看集群的配置，如下：

```shell
### 将示例文件改为集群配置文件
cp cluster.conf.example cluster.conf

vim cluster.conf

### 将3个机器的IP和端口写到集群配置文件中
192.168.73.141:8848
192.168.73.142:8848
192.168.73.143:8848
```

好了，到这里，Nacos的集群就配置好了，简单吧，然后我们分别启动3台机器上的Nacos，进入到Nacos的主目录，执行如下命令，

```shell
./bin/start.sh

### 查看每台机器上的启动日志
tail -500f logs/start.log
```

我们可以看到Nacos启动成功的日志。好了，到这里Nacos集群就搭建完成了。

剩下的事情就是在这3台机器之间做负载均衡了，方案也有很多，可以使用Nginx、HAProxy、Keepalived+LVS等。这里就不给大家做过多的介绍了，比较简单的，我们可以使用Nginx，然后配置HOST进行访问。