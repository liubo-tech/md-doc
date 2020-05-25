# kafka集群搭建 [返回](/ "首页")

## 一、zookeeper集群搭建

略，请参考其他文档，这里不再赘述。

## 二、下载kafka

从kafka官网下载kafka_2.11-0.11.0.0.tgz，并解压。
```jshelllanguage
tar -zxvf kafka_2.11-0.11.0.0
```
## 三、kafka配置修改

这里我们仅以两台kafka实例做集群。

打开kafka属性文件
```jshelllanguage
vim ${kafka_home}/config/server.properties
```
修改其中的关键属性
```properties
# The id of the broker. This must be set to a unique integer for each broker.
broker.id=0

# Zookeeper connection string (see zookeeper docs for details).
# This is a comma separated host:port pairs, each corresponding to a zk
# server. e.g. "127.0.0.1:3000,127.0.0.1:3001,127.0.0.1:3002".
# You can also append an optional chroot string to the urls to specify the
# root directory for all kafka znodes.
zookeeper.connect=192.168.2.233:2181,192.168.2.234:2181,192.168.2.235:2181

# The default number of log partitions per topic. More partitions allow greater
# parallelism for consumption, but this will also result in more files across
# the brokers.
num.partitions=1
```
>broker.id 第一台机器写0，第二台机器写1，以此类推。

>zookeeper.connect ：将zookeeper集群的地址和端口写上。

>num.partitions=1 ：每个topic的partition默认数量。可根据自己项目的情况进行配置。

>其他属性请参照官网。

## 四、kafka集群启动

```jshelllanguage
nohup ${kafka_home}/bin/kafka-server-start.sh ${kafka_home}/config/server.properties &
```

将两台机器的kafka启动，集群搭建完毕。

集群搭建就是这么简单。