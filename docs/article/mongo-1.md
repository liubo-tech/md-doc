# MongoDB之副本集   [返回](/ "首页")

## 一、简介

MongoDB 是一个基于分布式文件存储的数据库。由 C++ 语言编写。旨在为 WEB 应用提供可扩展的高性能数据存储解决方案。

MongoDB 是一个介于关系数据库和非关系数据库之间的产品，是非关系数据库当中功能最丰富，最像关系数据库的。

### 1.1副本集（replication）

MongoDB 副本集是一组mongod的进程，它们保存着相同的数据集。副本集提供了冗余和高可用，这是所有生产环境部署的基础。在不同的数据库服务中，存在着相同的数据，它提供了一定级别的容灾，避免了单点故障。在一些情况下副本可以提供读的能力，客户端发来的读请求可以分配到不同的服务上。一个副本集包含几个数据承载节点和随意的一个仲裁节点。数据承载节点中，只能有一个成员是主节点（primary），其他的节点都是从节点（secondary）。一个副本集中只用主节点有确认写的能力，主节点在oplog中记录下所有数据的变化，从节点复制主节点的oplog，并执行这些操作。这样，从节点的数据与主节点保持一致。如果主节点不可用，从节点中将会选举出新的主节点。

![image1](https://images2017.cnblogs.com/blog/1191201/201802/1191201-20180208150129576-1480106071.png)

### 1.2仲裁者（arbiter）

你可以向副本集中添加额外的mongod实例作为仲裁者（arbiter）。仲裁者不保存数据，它只在心跳响应中和选举请求中作为一个法定人数。由于仲裁节点不保存数据，所以相比数据节点，它占用更少的资源。如果你的数据集有偶数个节点，添加一个仲裁者节点可以保持选举中的多数票。

![image2](https://images2017.cnblogs.com/blog/1191201/201802/1191201-20180208151306045-768907567.png)

### 1.3自动故障转移（Automatic Failover）

当主节点不能和其他成员节点通信，超过10秒时，一个合法的从节点将举行选举，选举它自己为新的主节点，第一个进行选举的从节点如果收到了大多数的选票，它将成为新的主节点。失效转移的过程大概会在1分钟内完成，例如，副本集中的成员发现主节点不可用将花费10-30秒时间，其余的从节点选举出新的主节点花费10-30秒时间。

![image3](https://images2017.cnblogs.com/blog/1191201/201802/1191201-20180208152448216-1282500041.png)

### 1.4 优先级为0的数据集成员

一个优先级为0的成员不能成为主节点，也不能触发选举。除了这个限制，它和其他的从节点功能一样，保持数据复制，接受读操作，在选举中投票。配置优先级为0的从节点，经常用于多数据中心的部署。例如，一个数据中心拥有一个主节点和一个从节点，第二个数据中心拥有一个优先级为0的从节点，这样，只有第一个数据中心的成员可以成为主节点。

![image4](https://images2017.cnblogs.com/blog/1191201/201802/1191201-20180208153632810-493957590.png)

### 1.5 隐藏的数据集成员

隐藏成员复制主节点的数据，但是它对于客户端的节点是不可见的。隐藏成员必须是优先级为0的，它不能成为主节点。db.isMaster()方法不能显示隐藏成员，但是隐藏成员可以在选举中进行选举。在下面5成员的副本集中，4个从节点复制主节点的数据，但是一个从节点是隐藏的。

![image5](https://images2017.cnblogs.com/blog/1191201/201802/1191201-20180208171115154-981676483.png)

## 二、部署副本集

### 2.1 部署副本集

3个成员的副本集提供了足够的冗余以避免更多的网络分裂和其他的系统失败。这个集合有足够的能力处理更多的分布读操作。副本集应该总是有奇数个成员，这可以使得选举过程更顺利。在生产环境部署时，你应该保持每一个mongod实例在一个单独的机器上，当使用虚拟机时，你应该保持每一个mongod实例在一个独立的主机服务上。

从MongoDB官网下载package，上传到3台机器上。我们这台机器的ip为192.168.2.233，192.168.2.234，192.168.2.235，上传的目录是/usr/local。

解压：
```
tar -zxvf mongodb-linux-x86_64-rhel70-3.6.2.tgz
``` 
MongoDB的数据存储在data目录的db目录下，但是这个目录在安装过程不会自动创建，所以你需要手动创建data目录，并在data目录中创建db目录。
```
mkdir -p /data/db
```
我们再创建/data/conf目录，存储MongoDB的配置文件
```
mkdir /data/confvim mongod.conf
```
配置的内容如下：
```yaml
replication:
   replSetName: "rs0"
net:
   bindIp: 192.168.2.233
```
replSetName设置副本集的名称，这里我们设置为“rs0”，bindIp设置为本机的ip，3台机器的mongod实例设置为自己的ip。

然后，我们在3台机器上，分别启动mongod实例

```
./bin/mongod --config /data/conf/mongod.conf
```
mongod启动的默认端口是27017。

使用mongo shell连接3个mongod实例中的一个
```
./bin/mongo --host 192.168.2.233
```
然后执行如下命令，设置副本集：
```
rs.initiate( {
   _id : "rs0",
   members: [
      { _id: 0, host: "192.168.2.233:27017" },
      { _id: 1, host: "192.168.2.234:27017" },
      { _id: 2, host: "192.168.2.235:27017" }
   ]
})
```
这样，3个成员的副本集就设置完成了。

查看副本集的配置，运行如下命令：
```
rs.conf()
```
返回的结果如下：
```json
{
   "_id" : "rs0",
   "version" : 1,
   "protocolVersion" : NumberLong(1),
   "members" : [
      {
         "_id" : 0,
         "host" : "192.168.2.233:27017",
         "arbiterOnly" : false,
         "buildIndexes" : true,
         "hidden" : false,
         "priority" : 1,
         "tags" : {
 
         },
         "slaveDelay" : NumberLong(0),
         "votes" : 1
      },
      {
         "_id" : 1,
         "host" : "192.168.2.234:27017",
         "arbiterOnly" : false,
         "buildIndexes" : true,
         "hidden" : false,
         "priority" : 1,
         "tags" : {
 
         },
         "slaveDelay" : NumberLong(0),
         "votes" : 1
      },
      {
         "_id" : 2,
         "host" : "192.168.2.235:27017",
         "arbiterOnly" : false,
         "buildIndexes" : true,
         "hidden" : false,
         "priority" : 1,
         "tags" : {
 
         },
         "slaveDelay" : NumberLong(0),
         "votes" : 1
      }
 
   ],
   "settings" : {
      "chainingAllowed" : true,
      "heartbeatIntervalMillis" : 2000,
      "heartbeatTimeoutSecs" : 10,
      "electionTimeoutMillis" : 10000,
      "catchUpTimeoutMillis" : -1,
      "getLastErrorModes" : {
 
      },
      "getLastErrorDefaults" : {
         "w" : 1,
         "wtimeout" : 0
      },
      "replicaSetId" : ObjectId("585ab9df685f726db2c6a840")
   }
}
```
确定副本集的主节点，运行如下命令：
```json
{
    "set" : "rs0",
    "date" : ISODate("2018-02-08T11:08:15.457Z"),
    "myState" : 1,
    "term" : NumberLong(2),
    "heartbeatIntervalMillis" : NumberLong(2000),
    "optimes" : {
        "lastCommittedOpTime" : {
            "ts" : Timestamp(1518088089, 1),
            "t" : NumberLong(2)
        },
        "readConcernMajorityOpTime" : {
            "ts" : Timestamp(1518088089, 1),
            "t" : NumberLong(2)
        },
        "appliedOpTime" : {
            "ts" : Timestamp(1518088089, 1),
            "t" : NumberLong(2)
        },
        "durableOpTime" : {
            "ts" : Timestamp(1518088089, 1),
            "t" : NumberLong(2)
        }
    },
    "members" : [
        {
            "_id" : 0,
            "name" : "192.168.2.233:27017",
            "health" : 1,
            "state" : 1,
            "stateStr" : "PRIMARY",
            "uptime" : 67,
            "optime" : {
                "ts" : Timestamp(1518088089, 1),
                "t" : NumberLong(2)
            },
            "optimeDate" : ISODate("2018-02-08T11:08:09Z"),
            "electionTime" : Timestamp(1518088058, 1),
            "electionDate" : ISODate("2018-02-08T11:07:38Z"),
            "configVersion" : 3,
            "self" : true
        },
        {
            "_id" : 1,
            "name" : "192.168.2.234:27017",
            "health" : 1,
            "state" : 2,
            "stateStr" : "SECONDARY",
            "uptime" : 46,
            "optime" : {
                "ts" : Timestamp(1518088089, 1),
                "t" : NumberLong(2)
            },
            "optimeDurable" : {
                "ts" : Timestamp(1518088089, 1),
                "t" : NumberLong(2)
            },
            "optimeDate" : ISODate("2018-02-08T11:08:09Z"),
            "optimeDurableDate" : ISODate("2018-02-08T11:08:09Z"),
            "lastHeartbeat" : ISODate("2018-02-08T11:08:14.473Z"),
            "lastHeartbeatRecv" : ISODate("2018-02-08T11:08:14.829Z"),
            "pingMs" : NumberLong(0),
            "syncingTo" : "192.168.2.233:27017",
            "configVersion" : 3
        },
        {
            "_id" : 2,
            "name" : "192.168.2.235:27017",
            "health" : 1,
            "state" : 2,
            "stateStr" : "SECONDARY",
            "uptime" : 24,
            "optime" : {
                "ts" : Timestamp(1518088089, 1),
                "t" : NumberLong(2)
            },
            "optimeDurable" : {
                "ts" : Timestamp(1518088089, 1),
                "t" : NumberLong(2)
            },
            "optimeDate" : ISODate("2018-02-08T11:08:09Z"),
            "optimeDurableDate" : ISODate("2018-02-08T11:08:09Z"),
            "lastHeartbeat" : ISODate("2018-02-08T11:08:14.474Z"),
            "lastHeartbeatRecv" : ISODate("2018-02-08T11:08:15.020Z"),
            "pingMs" : NumberLong(0),
            "syncingTo" : "192.168.2.234:27017",
            "configVersion" : 3
        }
    ],
    "ok" : 1,
    "operationTime" : Timestamp(1518088089, 1),
    "$clusterTime" : {
        "clusterTime" : Timestamp(1518088089, 1),
        "signature" : {
            "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
            "keyId" : NumberLong(0)
        }
    }
}
```
我们从返回的结果中，可以看到每个节点的状态。

### 2.2 添加仲裁者节点

警告：一个副本集的仲裁者节点不要超过一个。

首先，为仲裁者节点创建数据库目录
```
mkdir /data/arb
```
以副本集的方式启动仲裁者节点，并制定数据库目录：
```
mongod --port 27017 --dbpath /data/arb --replSet rs0 --bind_ip 192.168.2.236
```
向副本集中加入仲裁者，只有连接主节点才能加入仲裁者节点，前面的例子中，我们的主节点是192.168.2.233，然后执行如下命令：
```
rs.addArb("192.168.2.236:27017")
```
至此，创建副本集就介绍完了，希望对大家有帮助。


