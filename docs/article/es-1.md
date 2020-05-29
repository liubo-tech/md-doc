# ES7学习笔记（一）Elasticsearch的安装与启动

Elasticsearch是一个非常好用的搜索引擎，和Solr一样，他们都是基于倒排索引的。今天我们就看一看Elasticsearch如何进行安装。

## 下载和安装

**今天我们的目的是搭建一个有3个节点的Elasticsearch集群**，所以我们找了3台虚拟机，ip分别是：

* 192.168.73.130
* 192.168.73.131
* 192.168.73.132

然后我们要下载ES，这里我们采用的版本是`7.6.0`。我们进入到`/opt`目录下，下载elasticsearch7.6.0

```shell
curl -L -O https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.6.0-linux-x86_64.tar.gz
```

下载的过程比较慢。下载完成后，我们解压：

```shell
tar -zxvf elasticsearch-7.6.0-linux-x86_64.tar.gz
```

在启动elasticsearch之前，这里有一个**重点：ES在启动的时候是不允许使用root账户的**，所以我们要新建一个elasticsearch用户：

```shell
useradd elasticsearch
```

然后把`elasticsearch-7.6.0`这个目录和目录下所有的文件的拥有者都改成elasticsearch:

```shell
chown elasticsearch:elasticsearch -R elasticsearch-7.6.0
```

然后，我们切换到`elasticsearch`用户：

```shell
su - elasticsearch
```

我们将ES安装在`/opt`目录下，先进入到`/opt`目录，

```shell
cd /opt/elasticsearch-7.6.0
```

我们启动一下，看看单机版能不能启动成功。

```shell
./bin/elasticsearch
```

可以启动成功。但是我们通过浏览器访问这个ip的9200端口时，是不成功的。我们需要对elasticsearch进行配置，才可以在别的机器上访问成功。

## ES的配置

es的所有配置文件都在`${ES_HOME}/config`这个目录下，首先我们设置一下jvm参数，打开jvm.options文件，

```shell
vim jvm.options
```

```shell
################################################################
## IMPORTANT: JVM heap size
################################################################
##
## You should always set the min and max JVM heap
## size to the same value. For example, to set
## the heap to 4 GB, set:
##
## -Xms4g
## -Xmx4g
##
## See https://www.elastic.co/guide/en/elasticsearch/reference/current/heap-size.html
## for more information
##
################################################################

# Xms represents the initial size of total heap space
# Xmx represents the maximum size of total heap space

-Xms256m
-Xmx256m

```

我们改一下堆内存的大小，我这里使用的虚拟机，只分配了1g的内存，所以，我这里统一调整为256m内存，大家可以根据自己机器的内存情况进行调整。

然后，我们再打开`elasticsearch.yml`文件，配置一下这里边的参数。

```shell
# ======================== Elasticsearch Configuration =========================
#
# NOTE: Elasticsearch comes with reasonable defaults for most settings.
#       Before you set out to tweak and tune the configuration, make sure you
#       understand what are you trying to accomplish and the consequences.
#
# The primary way of configuring a node is via this file. This template lists
# the most important settings you may want to configure for a production cluster.
#
# Please consult the documentation for further information on configuration options:
# https://www.elastic.co/guide/en/elasticsearch/reference/index.html
#
# ---------------------------------- Cluster -----------------------------------
#
# Use a descriptive name for your cluster:
#
cluster.name: cluster-a
#
# ------------------------------------ Node ------------------------------------
#
# Use a descriptive name for the node:
#
node.name: node-130
#
# Add custom attributes to the node:
#
#node.attr.rack: r1
#
# ----------------------------------- Paths ------------------------------------
#

```

我们先配置一下集群的名字，也就是`cluster.name`，在这里，我们叫做`cluster-a`。在另外两台机器上，集群的名字也要叫做`cluster-a`，这样才能够组成一个集群。**在ES中，集群名字相同的节点，会组成ES集群。**

然后，我们再修改`node.name`节点名称，这个名称是每一个节点的，**所以，每个节点的名称都不能相同。**这里我们以ip命名，130这台机器，节点名称就叫`node-130`，另外两台叫做`node-131`和`node-132`。

我们再接着看后面的配置，

```shell
# ----------------------------------- Paths ------------------------------------
#
# Path to directory where to store the data (separate multiple locations by comma):
#
#path.data: /path/to/data
#
# Path to log files:
#
#path.logs: /path/to/logs
#
# ----------------------------------- Memory -----------------------------------
#
# Lock the memory on startup:
#
#bootstrap.memory_lock: true
#
# Make sure that the heap size is set to about half the memory available
# on the system and that the owner of the process is allowed to use this
# limit.
#
# Elasticsearch performs poorly when the system is swapping the memory.
#
# ---------------------------------- Network -----------------------------------
#
# Set the bind address to a specific IP (IPv4 or IPv6):
#
network.host: 192.168.73.130
#
# Set a custom port for HTTP:
#
#http.port: 9200

```

路径和内存，咱们使用默认的就好，咱们重点看一下网络。我们需要指定一下ES绑定的地址，如果不设置，那么默认绑定的就是localhost，也就是127.0.0.1，这样就只有本机能够访问了，其他机器是访问不了的。所以这里我们要绑定每台机器的地址，分别是`192.168.73.130`，`192.168.73.131`，`192.168.73.132`。

接下来，我们看一下集群的相关配置，

```shell
# --------------------------------- Discovery ----------------------------------
#
# Pass an initial list of hosts to perform discovery when this node is started:
# The default list of hosts is ["127.0.0.1", "[::1]"]
#
discovery.seed_hosts: ["192.168.73.130", "192.168.73.131","192.168.73.132"]
#
# Bootstrap the cluster using an initial set of master-eligible nodes:
#
cluster.initial_master_nodes: ["node-130", "node-131", "node-132"]
#
# For more information, consult the discovery and cluster formation module documentation.
#

```

也就是Discovery这一段的配置，我们先设置一下集群中节点的地址，也就是`discovery.seed_hosts`这一段，我们把3台机器的ip写在这里。然后再把3台机器的节点名称写在`cluster.initial_master_nodes`，好了，集群的配置到这里就告一段落了。

## 系统配置

接下来我们再看看重要的系统配置。在ES的官网上，有这样一句话，

> Ideally, Elasticsearch should run alone on a server and use all of the resources available to it.

翻译过来是，合理的做法是，ES应该在一个服务中单独运行，并且可以使用这个机器中所有的可用资源。

只要你在配置文件中配置了`network.host`，ES就认为你将发布生产环境，如果你的一些配置不正确，那么ES就不会启动成功。在这里，ES也要求我们对系统的一些配置做出修改。

### ulimit调整

首先，我们要修改Linux系统的文件打开数，将其调到65535。

```shell
su -
ulimit -n 65535 
exit
```

然后再修改`limits.conf`文件，我们同样切换到root用户，打开`limits.conf`文件，

```shell
vim /etc/security/limits.conf
```

在文件的最后添加`elasticsearch  -  nofile  65535`，然后保存退出。

### 关闭swapping

其次，在ES的官方文档上，要求`Disabled Swapping `，我们要关掉它。执行以下命令：

```shell
sudo swapoff -a
```

这只是临时的关闭swapping，重启linux后，会失效。如果要永久的关闭swapping，需要编辑`/etc/fstab`文件，将包含swap的行的注释掉。

```shell
/dev/mapper/centos-root /                       xfs     defaults        0 0
UUID=6a38540f-2ba9-437b-ac8b-8757f5754fff /boot                   xfs     defaults        0 0
# /dev/mapper/centos-swap swap                    swap    defaults        0 0

```

### 调整mmapfs的数值

由于ES是使用`mmapfs`存储索引，但是系统的默认值太低了，我们调高一点。

```she
sysctl -w vm.max_map_count=262144
```

### 线程的数量

确保elasticsearch用户最少可创建4096个线程。我们还是要以root用户去设置。

```shell
su -
ulimit -u 4096
```

同样，这知识临时的方案，linux重启后会失效，我们需要修改配置文件`/etc/security/limits.conf`，将`nproc`设置为4096。

```shell
elasticsearch  -  nproc 4096
```

好，到这里我们所有的配置就完成了，现在依次启动3个节点的ES。启动完成后，我们在浏览器中检查以下集群的状态，`http://192.168.73.130:9200/_cluster/health`，

```json
{"cluster_name":"cluster-a","status":"green","timed_out":false,"number_of_nodes":3,"number_of_data_nodes":3,"active_primary_shards":0,"active_shards":0,"relocating_shards":0,"initializing_shards":0,"unassigned_shards":0,"delayed_unassigned_shards":0,"number_of_pending_tasks":0,"number_of_in_flight_fetch":0,"task_max_waiting_in_queue_millis":0,"active_shards_percent_as_number":100.0}
```

我们看到status是green。说明我们的ES集群搭建成功了。

## 向集群中添加节点

当你启动一个ES实例的时候，你正在启动了一个ES节点。一个ES集群是一组有着相同`cluster.name`参数的节点。当节点加入或离开集群时，集群会自动重组，甚至在可用的节点间重新分配数据。

如果你正在运行一个单一的ES实例，那么你就有了一个单节点的集群。所有的基础分片都在这个单节点上，没有副本节点。因此集群的状态是黄色，集群处于可用状态，但是在事故中有丢失数据的风险。

向集群中添加节点可以提升集群的容量和可靠性，默认的，一个节点既是一个数据节点，也是一个有资格被选举成master节点，从而控制整个集群的节点。你也可以为了一些特殊的用途配置一个新的节点，例如，处理接收的请求。

当你向集群中添加更多的节点，集群会自动分配副本分片。当所有的基础分片和副本分片都处于激活状态，集群的状态会变为绿色。

向集群中添加节点：

1. 配置一个新的ES实例；
2. 在`cluster.name`变量中指定相同的集群名称；
3. 在`discovery.seed_hosts`中填写上集群的ip地址；
4. 启动ES，这个节点会被自动的发现，并且加入集群。

到这里，向集群中添加节点就完成了。