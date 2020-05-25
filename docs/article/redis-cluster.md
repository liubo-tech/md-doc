## Redis Cluster（集群）的搭建 [返回](/ "首页")

### 一、Redis的下载、安装、启动（单实例）

我们统一将Redis安装在/opt目录下，执行命令如下：
```jshelllanguage
$ cd /opt
$ wget http://download.redis.io/releases/redis-4.0.9.tar.gz
$ tar zxvf redis-4.0.9.tar.gz
$ cd redis-4.0.9
$ make
```
安装完成，下面我们启动Redis服务：
```jshelllanguage
$ cd /opt/redis-4.0.9
$ ./src/redis-server
```
Redis启动成功，将采用Redis的默认配置。也可修改Redis根目录下的redis.conf文件，并在Redis启动时，指定配置文件，如下：
```jshelllanguage
$ ./src/redis-server redis.conf
```
>注意，由于Redis的保护模式，只绑定了本机的127.0.0.1，从其他机器是不能访问的。所以我们需要添加本机的ip
192.168.xxx.xxx。

### 二、Redis Cluster（集群）的搭建

由于我们的机器有限，我们将采用一台机器多个端口的方式搭建我们的Redis集群。

首先我们创建Redis的配置文件目录，如下：
```jshelllanguage
$ cd /opt
$ mkdir redis-cluster
```
并在redis-cluster目录下创建6个节点的配置文件。分别为：
* redis-7000.conf
* redis-7001.conf
* redis-7002.conf
* redis-7003.conf
* redis-7004.conf
* redis-7005.conf

后面的7000,7001等是redis启动的端口号。接下来编辑文件的内容：
```
#该集群阶段的端口
port 7000
#为每一个集群节点指定一个pid_file
pidfile /var/run/redis_7000.pid
#在bind指令后添加本机的ip
bind 127.0.0.1 149.28.37.147
#找到Cluster配置的代码段，使得Redis支持集群
cluster-enabled yes
#每一个集群节点都有一个配置文件，这个文件是不能手动编辑的。确保每一个集群节点的配置文件不通
cluster-config-file nodes-7000.conf
#集群节点的超时时间，单位：ms，超时后集群会认为该节点失败
cluster-node-timeout 5000
#最后将appendonly改成yes
appendonly yes
```
这样一个节点的配置就完成，其他的5个节点也做同样的配置。并将6个节点的Redis实例启动：
```jshelllanguage
$ nohup /opt/redis-4.0.9/src/redis-server /opt/redis-cluster/redis-7000.conf &
$ nohup /opt/redis-4.0.9/src/redis-server /opt/redis-cluster/redis-7001.conf &
$ nohup /opt/redis-4.0.9/src/redis-server /opt/redis-cluster/redis-7002.conf &
$ nohup /opt/redis-4.0.9/src/redis-server /opt/redis-cluster/redis-7003.conf &
$ nohup /opt/redis-4.0.9/src/redis-server /opt/redis-cluster/redis-7004.conf &
$ nohup /opt/redis-4.0.9/src/redis-server /opt/redis-cluster/redis-7005.conf &
```
使用这6个节点创建集群：
```jshelllanguage
$ /opt/redis-4.0.9/src/redis-trib.rb create --replicas 1 149.28.37.147:7000 149.28.37.147:7001 149.28.37.147:7002 149.28.37.147:7003 149.28.37.147:7004 149.28.37.147:7005
```
>--replicas 1 表示我们希望为集群中的每个主节点创建一个从节点。

执行命令后会显示：
```jshelllanguage
>>> Creating cluster
>>> Performing hash slots allocation on 6 nodes...
Using 3 masters:
149.28.37.147:7000
149.28.37.147:7001
149.28.37.147:7002
Adding replica 149.28.37.147:7004 to 149.28.37.147:7000
Adding replica 149.28.37.147:7005 to 149.28.37.147:7001
Adding replica 149.28.37.147:7003 to 149.28.37.147:7002
>>> Trying to optimize slaves allocation for anti-affinity
[WARNING] Some slaves are in the same host as their master
M: 65625091304b0fa2dd75a00f62b6aceac1701094 149.28.37.147:7000
   slots:0-5460 (5461 slots) master
M: 4da569bf8402e4f75ab6e0fe7076919c22e3f900 149.28.37.147:7001
   slots:5461-10922 (5462 slots) master
M: b977680e24f23f8fec96876d9014803ca752e2e2 149.28.37.147:7002
   slots:10923-16383 (5461 slots) master
S: 7183e47a64bca23157140229352455d1a1407dc2 149.28.37.147:7003
   replicates b977680e24f23f8fec96876d9014803ca752e2e2
S: b2f916a643fefef1d43dbd1ef5d22f72c0ee43d6 149.28.37.147:7004
   replicates 65625091304b0fa2dd75a00f62b6aceac1701094
S: e362d9aae5fe3e9c343d266a5ab952272e0e37b0 149.28.37.147:7005
   replicates 4da569bf8402e4f75ab6e0fe7076919c22e3f900
Can I set the above configuration? (type 'yes' to accept): 
```
我们输入yes，回车：
```jshelllanguage
>>> Nodes configuration updated
>>> Assign a different config epoch to each node
>>> Sending CLUSTER MEET messages to join the cluster
Waiting for the cluster to join...
>>> Performing Cluster Check (using node 149.28.37.147:7000)
M: 65625091304b0fa2dd75a00f62b6aceac1701094 149.28.37.147:7000
   slots:0-5460 (5461 slots) master
   1 additional replica(s)
M: b977680e24f23f8fec96876d9014803ca752e2e2 149.28.37.147:7002
   slots:10923-16383 (5461 slots) master
   1 additional replica(s)
S: e362d9aae5fe3e9c343d266a5ab952272e0e37b0 149.28.37.147:7005
   slots: (0 slots) slave
   replicates 4da569bf8402e4f75ab6e0fe7076919c22e3f900
S: b2f916a643fefef1d43dbd1ef5d22f72c0ee43d6 149.28.37.147:7004
   slots: (0 slots) slave
   replicates 65625091304b0fa2dd75a00f62b6aceac1701094
M: 4da569bf8402e4f75ab6e0fe7076919c22e3f900 149.28.37.147:7001
   slots:5461-10922 (5462 slots) master
   1 additional replica(s)
S: 7183e47a64bca23157140229352455d1a1407dc2 149.28.37.147:7003
   slots: (0 slots) slave
   replicates b977680e24f23f8fec96876d9014803ca752e2e2
[OK] All nodes agree about slots configuration.
>>> Check for open slots...
>>> Check slots coverage...
[OK] All 16384 slots covered.
```
集群搭建完毕。我们可以使用Spring-Boot非常方便的去访问Redis集群了。
### 三、Ruby版本过低问题

在使用redis-trib.rb时，需要先安装ruby：
```jshelllanguage
$ yum -y install ruby ruby-devel rubygems rpm-build
$ gem install redis
```
这是出现redis requires Ruby version >= 2.2.2的报错，我们先安装rvm：
```jshelllanguage
$ curl -L get.rvm.io | bash -s stable
$ source /usr/local/rvm/scripts/rvm
```
查看版本
```jshelllanguage
rvm list known
```
安装2.4.1版本
```jshelllanguage
rvm install 2.4.1
```
使用2.4.1版本
```jshelllanguage
rvm use 2.4.1
```
移除2.0.0版本
```jshelllanguage
rvm remove 2.0.0
```
查看当前ruby版本
```jshelllanguage
ruby --version
```
再安装redis，就可以了
```jshelllanguage
gem install redis
```


