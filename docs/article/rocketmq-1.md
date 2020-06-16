# RocketMQ系列（一）基本概念

RocketMQ是阿里出品的一款开源的消息中间件，让其声名大噪的就是它的事务消息的功能。在企业中，消息中间件选择使用RocketMQ的还是挺多的，这一系列的文章都是针对RocketMQ的，咱们先从RocketMQ的一些基本概念和环境的搭建开始聊起。

RocketMQ由4部分组成，分别是：名称服务（Name Server）、消息队列（Brokers）、生产者（producer）和消费者（consumer）。这4部分都可以进行水平扩展，从而避免单点故障，如下图，

![rmq-basic-arc](D:%5CVue-Project%5Cvue-press%5Cdocs%5Carticle%5Crocketmq-1.assets%5Crmq-basic-arc.png)

这是RocketMQ官网上的一张图，非常清晰的列出了4个部分，并且都是集群模式。下面我们就分别说一说这4部分。

## 名称服务（NameServer）

Name Server扮演的角色是一个注册中心，和Zookeeper的作用差不多。它的主要功能有两个，如下：

* broker的管理：broker集群将自己的信息注册到NameServer，NameServer提供心跳机制检测每一个broker是否正常。
* 路由管理：每一个NameServer都有整个broker集群和队列的信息，以便客户端（生产者和消费者）查询。

NameServer协调着分布式系统中的每一个组件，并且管理着每一个Topic的路由信息。

## Broker

Broker主要是存储消息，并且提供Topic的机制。它提供推和拉两种模式，还有一些容灾的措施，比如可以配置消息副本。下面我们看一看Brokcer的主从机制。

Broker的角色分为“异步主”、“同步主”和“从”三个角色。如果你不能容忍消息的丢失，你可以配置一个“同步主”和“从”两个Broker，如果你觉得消息丢失也无所谓，只要队列可用就ok的话，你可以配置“异步主”和“从”两个broker。如果你只是想简单的搭建，只配置一个“异步主”，不配置“从”也是可以的。

上面提到的是broker之间的备份，broker里的信息也是可以保存到磁盘的，保存到磁盘的方式也有两种，推荐的方式是异步保存磁盘，同步保存磁盘是非常损耗性能的。

## 生产者

生产者支持集群部署，它们向broker集群发送消息，而且支持多种负载均衡的方式。

当生产者向broker发送消息时，会得到发送结果，发送结果中有一个发送状态。假设我们的配置中，消息的配置`isWaitStoreMsgOK = true`，这个配置默认也是`true`，如果你配置为`false`，在发送消息的过程中，只要不发生异常，发送结果都是`SEND_OK`。当`isWaitStoreMsgOK = true`，发送结果有以下几种，

* `FLUSH_DISK_TIMEOUT`：保存磁盘超时，当保存磁盘的方式设置为SYNC_FLUSH（同步），并且在syncFlushTimeout配置的时间内（默认5s），没有完成保存磁盘的动作，将会得到这个状态。
* `FLUSH_SLAVE_TIMEOUT`：同步“从”超时，当broker的角色设置为“同步主”时，但是在设置的同步时间内，默认为5s，没有完成主从之间的同步，就会得到这个状态。
* `SLAVE_NOT_AVAILABLE`：“从”不可用，当我们设置“同步主”，但是没有配置“从”broker时，会返回这个状态。
* `SEND_OK`：消息发送成功。

再来看看消息重复与消息丢失，当你发现你的消息丢失时，通常有两个选择，一个是丢就丢吧，这样消息就真的丢了；另一个选择是消息重新发送，这样有可能引起消息重复。通常情况下，还是推荐重新发送的，我们在消费消息的时候要去除掉重复的消息。

发送message的大小一般不超过512k，默认的发送消息的方式是同步的，发送方法会一直阻塞，直到等到返回的响应。如果你比较在意性能，也可以用`send(msg, callback)`异步的方式发送消息。

## 消费者

多个消费者可以组成**消费者组（consumer group）**，不同的**消费者组**可以订阅相同的Topic，也可以独立的消费Topic，每一个消费者组都有自己的消费偏移量。

消息的消费方式一般有两种，顺序消费和并发消费。

* 顺序消费：消费者将锁住消息队列，确保消息按照顺序一个一个的被消费掉，顺序消费会引起一部分性能损失。在消费消息的时候，如果出现异常，不建议直接抛出，而是应该返回`SUSPEND_CURRENT_QUEUE_A_MOMENT `这个状态，它将告诉消费者过一段时间后，会重新消费这个消息。
* 并发消费：消费者将并发的消费消息，这种方式的性能非常好，也是推荐的消费方式。在消费的过程中，如果出现异常，不建议直接抛出，而是返回`RECONSUME_LATER `状态，它告诉消费者现在不能正确的消费它，过一段时间后，会再次消费它。

在消费者内部，是使用`ThreadPoolExecutor`作为线程池的，我们可以通过`setConsumeThreadMin `和`setConsumeThreadMax `设置最小消费线程和最大消费线程。

当一个新的消费者组建立以后，它要决定是否消费之前的历史消息，`CONSUME_FROM_LAST_OFFSET`将忽略历史消息，消费新的消息。`CONSUME_FROM_FIRST_OFFSET`将消费队列中的每一个消息，之前的历史消息也会再消费一遍。`CONSUME_FROM_TIMESTAMP`可以指定消费消息的时间，指定时间以后的消息会被消费。

如果你的应用不能容忍重复消费，那么在消费消息的过程中，要做好消息的校验。

好了，今天就到这里吧，下一篇我们将介绍RocketMQ的环境搭建。


