# RocketMQ系列（二）环境搭建

RocketMQ的基本概念在上一篇中给大家介绍了，这一节将给大家介绍环境搭建。RocketMQ中最基础的就是NameServer，我们先来看看它是怎么搭建的。

## NameServer

RocketMQ要求的环境是JDK8以上，我们先检查一下环境，

```shell
[root@centOS-1 ~]# java -version
openjdk version "11.0.3" 2019-04-16 LTS
OpenJDK Runtime Environment 18.9 (build 11.0.3+7-LTS)
OpenJDK 64-Bit Server VM 18.9 (build 11.0.3+7-LTS, mixed mode, sharing)

```

我的这个机器并没有刻意的安装JDK，而是系统自带的OpenJDK 11，这应该也是没有问题的。然后我们从RocketMQ官网下载最新的安装包，并且上传到`/opt`目录下，

```shell
[root@centOS-1 opt]# ll
-rw-r--r--.  1 root  root 13838456 6月   3 08:49 rocketmq-all-4.7.0-bin-release.zip

```

然后我们解压这个zip包，

```shell
[root@centOS-1 opt]# unzip rocketmq-all-4.7.0-bin-release.zip
```

这里使用的是unzip命令，如果你的机器里没有这个命令，可以使用`yum install`安装一个。解压以后，进入到RocketMQ的主目录，并且启动一下NameServer。

```shell
[root@centOS-1 opt]# cd rocketmq-all-4.7.0-bin-release
[root@centOS-1 rocketmq-all-4.7.0-bin-release]# ./bin/mqnamesrv
OpenJDK 64-Bit Server VM warning: Option UseConcMarkSweepGC was deprecated in version 9.0 and will likely be removed in a future release.
Unrecognized VM option 'UseCMSCompactAtFullCollection'
Error: Could not create the Java Virtual Machine.
Error: A fatal exception has occurred. Program will exit.

```

这里出了一个错误`Error: Could not create the Java Virtual Machine`，这是由于RocketMQ的启动文件都是按照JDK8配置的，而我们这里使用的是OpenJDK11，有很多命令参数不支持导致的，如果小伙伴们使用的是JDK8，正常启动是没有问题的。

在这里我们改一下RocketMQ的启动文件，

```shell
[root@centOS-1 rocketmq-all-4.7.0-bin-release]# vim bin/runserver.sh 
```

```shell
export JAVA_HOME
export JAVA="$JAVA_HOME/bin/java"
export BASE_DIR=$(dirname $0)/..
#在CLASSPATH中添加RocketMQ的lib目录
#export CLASSPATH=.:${BASE_DIR}/conf:${CLASSPATH}
export CLASSPATH=.:${BASE_DIR}/lib/*:${BASE_DIR}/conf:${CLASSPATH}
```

修改的地方我们增加了注释，在ClassPath里添加了lib目录，然后在这个文件的末尾，注释掉升级JDK后不支持的几个参数，

```shell
JAVA_OPT="${JAVA_OPT} -server -Xms4g -Xmx4g -Xmn2g -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=320m"
#JAVA_OPT="${JAVA_OPT} -XX:+UseConcMarkSweepGC -XX:+UseCMSCompactAtFullCollection -XX:CMSInitiatingOccupancyFraction=70 -XX:+CMSParallelRemarkEnabled -XX:SoftRefLRUPolicyMSPerMB=0 -XX:+CMSClassUnloadingEnabled -XX:SurvivorRatio=8  -XX:-UseParNewGC"
JAVA_OPT="${JAVA_OPT} -verbose:gc -Xloggc:${GC_LOG_DIR}/rmq_srv_gc_%p_%t.log -XX:+PrintGCDetails"
#JAVA_OPT="${JAVA_OPT} -XX:+UseGCLogFileRotation -XX:NumberOfGCLogFiles=5 -XX:GCLogFileSize=30m"
JAVA_OPT="${JAVA_OPT} -XX:-OmitStackTraceInFastThrow"
JAVA_OPT="${JAVA_OPT} -XX:-UseLargePages"
#JAVA_OPT="${JAVA_OPT} -Djava.ext.dirs=${JAVA_HOME}/jre/lib/ext:${BASE_DIR}/lib"
#JAVA_OPT="${JAVA_OPT} -Xdebug -Xrunjdwp:transport=dt_socket,address=9555,server=y,suspend=n"
JAVA_OPT="${JAVA_OPT} ${JAVA_OPT_EXT}"
JAVA_OPT="${JAVA_OPT} -cp ${CLASSPATH}"

```

好了，修改完以后，我们保存退出，再次启动，这次我们在后台启动NameServer，

```shell
[root@centOS-1 rocketmq-all-4.7.0-bin-release]# nohup ./bin/mqnamesrv &

[root@centOS-1 rocketmq-all-4.7.0-bin-release]# tail -500f ~/logs/rocketmqlogs/namesrv.log 

```

然后查看一下日志，在日志中看到`main - The Name Server boot success. serializeType=JSON`，说明NameServer启动成功了。

单点的NameServer肯定是不能满足我们的要求的，怎么也要做个集群吧。NameServer是一个无状态的服务，节点之间没有任何数据往来，所以NameServer的集群搭建不需要任何的配置，只需要启动多个NameServer服务就可以了，它不像Zookeeper集群搭建那样，需要配置各个节点。在这里我们就启动3个NameServer节点吧，对应我们的3台机器，`192.168.73.130,192.168.73.131,192.168.73.132`。

## Broker

NameServer集群搭建完成，下面就搭建Broker了，Broker呢，我们要搭建一个两主两从结构的，主从之间异步备份，保存磁盘也是使用异步的方式。如果你对主从同步和保存磁盘的方式还不了解，看看上一节的内容吧。异步两主两从这种结构的配置，在RocketMQ中已经有例子了，我们先一下配置文件。

```shell
[root@centOS-1 rocketmq-all-4.7.0-bin-release]# vim conf/2m-2s-async/broker-a.properties 
```

这个配置文件是`broker-a`“主”的配置文件，

```shell
brokerClusterName=RocketMQ-Cluster
brokerName=broker-a
brokerId=0
deleteWhen=04
fileReservedTime=48
brokerRole=ASYNC_MASTER
flushDiskType=ASYNC_FLUSH
```

其中，

* brokerClusterName是MQ集群的名称，我们改为RocketMQ-Cluster。
* brokerName是队列的名字，配置为broker-a。
* brokerId是队列的id，0代表是“主”，其他正整数代表着“从”。
* deleteWhen=04 代表着commitLog过期了，就会被删除。
* fileReservedTime是commitLog的过期时间，单位是小时，这里配置的是48小时。
* brokerRole，队列的角色，ASYNC_MASTER是异步主。
* flushDiskType，保存磁盘的方式，异步保存。

再看看broker-a的从配置，

```shell
brokerClusterName=RocketMQ-Cluster
brokerName=broker-a
brokerId=1
deleteWhen=04
fileReservedTime=48
brokerRole=SLAVE
flushDiskType=ASYNC_FLUSH
```

其中，集群的名字一样，队列的名字一样，只是brokerId和brokerRole不一样，这里的配置代表着它是队列broker-a的“从”。broker-b的配置和broker-a是一样的，只是brokerName不一样而已，在这里就不贴出来了。

两主两从的配置文件都已经配置好了，我们来规划一下，我们的NameServer是3台`192.168.73.130,192.168.73.131,192.168.73.132`，broker按照如下部署：

* broker-a（主）：192.168.73.130
* broker-a（从）：192.168.73.131
* broker-b（主）：192.168.73.131
* broker-b（从）：192.168.73.130

接下来，我们启动broker，在`192.168.73.130`上启动 broker-a（主）和broker-b（从）。和NameServer一样，我们需要修改一下启动的脚本，否则也会报错误。我们修改的是`runbroker.sh`这个文件，修改的内容和前面是一样的，这里就不赘述了。在启动文件中，内存大小配置的是8g，如果机器的内存不够，可以适当减少一下内存。

这里还要做个说明，由于我们在一台机器上启动了两个broker实例，监听端口和日志存储的路径都会有冲突。那么我们在`192.168.73.130`的broker-b（从）的配置文件中，增加配置，如下：

```shell
brokerClusterName=RocketMQ-Cluster
brokerName=broker-b
brokerId=1
deleteWhen=04
fileReservedTime=48
brokerRole=SLAVE
flushDiskType=ASYNC_FLUSH

listenPort=11911
storePathRootDir=~/store-b                       
```

broker-b（从）的端口改为11911，区别默认的10911；storePathRootDir改为`~/store-b`，区分默认的`~/store`。

同样在`192.168.73.131`的broker-a（从）也要做修改，如下：

```shell
brokerClusterName=RocketMQ-Cluster
brokerName=broker-a
brokerId=1
deleteWhen=04
fileReservedTime=48
brokerRole=SLAVE
flushDiskType=ASYNC_FLUSH

listenPort=11911
storePathRootDir=~/store-a

```

然后，我们在`192.168.73.130`上启动，如下，

```shell
nohup ./bin/mqbroker -c conf/2m-2s-async/broker-a.properties -n '192.168.73.130:9876;192.168.73.131:9876;192.168.73.132:9876' &

nohup ./bin/mqbroker -c conf/2m-2s-async/broker-b-s.properties -n '192.168.73.130:9876;192.168.73.131:9876;192.168.73.132:9876' &

```

* -c 指定的是配置文件，分别指定的是broker-a（主）和broker-b（从）。
* -n 指定的是NameServer的地址，指定了3个，用`,`隔开。

再在`192.168.73.131`上启动，如下，

```shell
nohup ./bin/mqbroker -c conf/2m-2s-async/broker-b.properties -n '192.168.73.130:9876;192.168.73.131:9876;192.168.73.132:9876' &

nohup ./bin/mqbroker -c conf/2m-2s-async/broker-a-s.properties -n '192.168.73.130:9876;192.168.73.131:9876;192.168.73.132:9876' &
```

好，如果没有出现错误，到这里，集群就搭建成功了。**这里边有个小坑，大家一定要注意，就是-n后面的地址一定要用''括起来，并且地址之间要用`;`，否则，我们在查看集群列表时，是看不到的。**

## mqadmin

集群已经搭建好了，我们可以查看一下集群的状态，查看集群的状态，我们可以使用mqadmin，命令如下：

```shell
./bin/mqadmin clusterlist -n '192.168.73.130:9876;192.168.73.131:9876;192.168.73.132:9876'
```

* clusterlist 是查看集群的命令
* -n 后面是NameServer的地址，**注意这里也要用''括起来，并且地址之间要用；隔开**

执行结果如下：

```shell
#Cluster Name     #Broker Name            #BID  #Addr                  #Version                #InTPS(LOAD)       #OutTPS(LOAD) #PCWait(ms) #Hour #SPACE
RocketMQ-Cluster  broker-a                0     192.168.73.130:10911   V4_7_0                   0.00(0,0ms)         0.00(0,0ms)          0 442039.47 -1.0000
RocketMQ-Cluster  broker-a                1     192.168.73.131:11911   V4_7_0                   0.00(0,0ms)         0.00(0,0ms)          0 442039.47 0.2956
RocketMQ-Cluster  broker-b                0     192.168.73.131:10911   V4_7_0                   0.00(0,0ms)         0.00(0,0ms)          0 442039.47 0.2956
RocketMQ-Cluster  broker-b                1     192.168.73.130:11911   V4_7_0                   0.00(0,0ms)         0.00(0,0ms)          0 442039.47 -1.0000

```

我们可以看到在这个NameServer中心中，只有一个broker集群`RocketMQ-Cluster`，有两个broker，`broker-a`和`broker-b`，而且每一个broker都有主从，broker的ip我们也可以看到。

好了~ 到这里RocketMQ的集群就搭建好了，有问题评论区留言哦~~