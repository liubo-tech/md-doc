# 使用solr6.0搭建solrCloud [返回](/ "首页")

## 一、搭建zookeeper集群

1. 下载zookeeper压缩包到自己的目录并解压（本例中的目录在/opt下），zookeeper的根目录我们在这里用${ZK_HOME}表示。
2. 在${ZK_HOME}/conf下创建zoo.cfg文件，可以复制zoo_sample.cfg文件：
```
cp zoo_sample.cfg zoo.cfg
```
修改zoo.cfg的内容如下：
```
vim zoo.cfg
tickTime=2000
initLimit=10
syncLimit=5
#zookeeper的data目录配置如下,可根据个人喜好更改
dataDir=/opt/zookeeper-3.4.9/dataDir
clientPort=2181
#由于zookeeper搭建集群时，具体的zookeeper服务应为奇数个，所以我们这里使用3台机器
server.1=192.168.2.233:2888:3888
server.2=192.168.2.234:2888:3888
server.3=192.168.2.235:2888:3888
```
3. 在dataDir的目录中，创建myid文件，文件内容为server.X中的X。

　　　　在192.168.2.233这台机器上，我们进入到dataDir目录，创建myid文件，内容为"1"；

　　　　同理，在192.168.2.234和192.168.2.235上创建myid文件，内容为“2”和“3”。

4. 启动3台zookeeper，命令：
```
./bin/zkServer.sh start
```
5. 查看zookeeper状态，命令：
```
./bin/zkServer.sh status
```

##  二、solr_cloud搭建

1. 从官网下载solr6.0的压缩包到安装目录，并解压，本例中目录为/opt，solr根目录为/opt/solr-6.1.0，我们这里用${SOLR_HOME}表示。

2. 由于solr_cloud是分布式集群，有shard，有replica，我们这里使用两台机器做例子，solr分别安装在192.168.2.233和192.168.2.234上。

3. 在两台机器上，使用solr_cloud的方式启动solr，命令如下：
```
#-c：以solr_cloud的方式启动
#-z:指定zookeeper集群的地址和端口，上面搭建zookeeper集群时的3台机器
./bin/solr start -c -z zk1:port,zk2:port,zk3:port
```
这样，solr_cloud就搭建成功了。但是里边并没有core和collection。在solr_cloud下，我们都是创建collection。
4. 创建collection时，是需要在一台机器上执行，命令如下：
```
#-c collection名称，例如这里我们要创建商品的collection
#-s shard数量，我们这里分片为2
#-rf 副本数量，我们这里副本设置为2
./bin/solr create -c product -s 2 -rf 2
```

这样，商品的collection就创建完成了。我们可以通过192.168.2.233:8983访问管理页面。

