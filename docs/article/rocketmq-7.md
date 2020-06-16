# RocketMQ系列（七）事务消息

终于到了今天了，终于要讲RocketMQ最牛X的功能了，那就是**事务消息**。为什么事务消息被吹的比较热呢？近几年微服务大行其道，整个系统被切成了多个服务，每个服务掌管着一个数据库。那么多个数据库之间的数据一致性就成了问题，虽然有像XA这种强一致性事务的支持，但是这种强一致性在互联网的应用中并不适合，人们还是更倾向于使用最终一致性的解决方案，在最终一致性的解决方案中，使用MQ保证各个系统之间的数据一致性又是首选。

RocketMQ为我们提供了事务消息的功能，它使得我们投放消息和其他的一些操作保持一个整体的原子性。比如：向数据库中插入数据，再向MQ中投放消息，把这两个动作作为一个原子性的操作。貌似其他的MQ是没有这种功能的。

但是，纵观全网，讲RocketMQ事务消息的博文中，几乎没有结合数据库的，都是直接投放消息，然后讲解事务消息的几个状态，虽然讲的也没毛病，但是和项目中事务最终一致性的落地方案还相距甚远。包括我自己在内，在项目中，服务化以后，用MQ保证事务的最终一致性，在网上一搜，根本没有落地的方案，都是侃侃而谈。于是，我写下这篇博文，结合数据库，来谈一谈RocketMQ的事务消息到底怎么用。

## 基础概念

要使用RocketMQ的事务消息，要实现一个TransactionListener的接口，这个接口中有两个方法，如下：

```java
/**
     * When send transactional prepare(half) message succeed, this method will be invoked to execute local transaction.
     *
     * @param msg Half(prepare) message
     * @param arg Custom business parameter
     * @return Transaction state
     */
LocalTransactionState executeLocalTransaction(final Message msg, final Object arg);

/**
     * When no response to prepare(half) message. broker will send check message to check the transaction status, and this
     * method will be invoked to get local transaction status.
     *
     * @param msg Check message
     * @return Transaction state
     */
LocalTransactionState checkLocalTransaction(final MessageExt msg);
```

RocketMQ的事务消息是基于两阶段提交实现的，也就是说消息有两个状态，prepared和commited。当消息执行完send方法后，进入的prepared状态，进入prepared状态以后，就要执行executeLocalTransaction方法，这个方法的返回值有3个，也决定着这个消息的命运，

* COMMIT_MESSAGE：提交消息，这个消息由prepared状态进入到commited状态，消费者可以消费这个消息；
* ROLLBACK_MESSAGE：回滚，这个消息将被删除，消费者不能消费这个消息；
* UNKNOW：未知，这个状态有点意思，如果返回这个状态，这个消息既不提交，也不回滚，还是保持prepared状态，而最终决定这个消息命运的，是checkLocalTransaction这个方法。

当executeLocalTransaction方法返回UNKNOW以后，RocketMQ会每隔一段时间调用一次checkLocalTransaction，这个方法的返回值决定着这个消息的最终归宿。那么checkLocalTransaction这个方法多长时间调用一次呢？我们在BrokerConfig类中可以找到，

```java
 /**
  * Transaction message check interval.
  */
@ImportantField
private long transactionCheckInterval = 60 * 1000;
```

这个值是在brokder.conf中配置的，默认值是60*1000，也就是1分钟。那么会检查多少次呢？如果每次都返回UNKNOW，也不能无休止的检查吧，

```java
/**
 * The maximum number of times the message was checked, if exceed this value, this message will be discarded.
 */
@ImportantField
private int transactionCheckMax = 5;
```

这个是检查的最大次数，超过这个次数，如果还返回UNKNOW，这个消息将被删除。

事务消息中，TransactionListener这个最核心的概念介绍完后，我们看看代码如何写吧。

## 落地案例

我们在数据库中有一张表，具体如下：

```sql
CREATE TABLE `s_term` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `term_year` year(4) NOT NULL ,
  `type` int(1) NOT NULL DEFAULT '1' ,
  PRIMARY KEY (`id`)
) 
```

字段的具体含义大家不用管，一会我们将向这张表中插入一条数据，并且向MQ中投放消息，这两个动作是一个原子性的操作，要么全成功，要么全失败。

