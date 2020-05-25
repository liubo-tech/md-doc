## 一、前言
 
 在我们的项目当中，使用定时任务是避免不了的，我们在部署定时任务时，通常只部署一台机器。部署多台机器时，同一个任务会执行多次。比如短信提醒，每天定时的给用户下发短信，如果部署了多台，同一个用户将发送多条。只部署一台机器，可用性又无法保证。今天向大家介绍一款开源产品，分布式定时任务解决方案---- elastic-job。
 
## 二、简介

Elastic-Job是一个分布式调度解决方案，由两个相互独立的子项目Elastic-Job-Lite和Elastic-Job-Cloud组成。在我们的项目中使用了轻量级无中心化解决方案，Elastic-Job-Lite。

### 1、分片概念

任务的分布式执行，需要将一个任务拆分为多个独立的任务项，然后由分布式的服务器分别执行某一个或几个分片项。

例如：有一个遍历数据库某张表的作业，现有2台服务器。为了快速的执行作业，那么每台服务器应执行作业的50%。 为满足此需求，可将作业分成2片，每台服务器执行　　1片。作业遍历数据的逻辑应为：服务器A遍历ID以奇数结尾的数据；服务器B遍历ID以偶数结尾的数据。 如果分成10片，则作业遍历数据的逻辑应为：每片分到的分片项应为ID%10，而服务器A被分配到分片项0,1,2,3,4；服务器B被分配到分片项5,6,7,8,9，直接的结果就是服务器A遍历ID以0-4结尾的数据；服务器B遍历ID以5-9结尾的数据。

Elastic-Job并不直接提供数据处理的功能，框架只会将分片项分配至各个运行中的作业服务器，开发者需要自行处理分片项与真实数据的对应关系。

### 2、作业高可用

上述作业中，如果有一个应用挂掉，分片项将会重新分片，没有挂掉的应用将获得分片项0-9。

## 三、实际应用

这里我们采用大家都比较熟悉的基于spring配置文件的配置。

### 1、引入jar包

```xml
<!-- 引入elastic-job-lite核心模块 -->
<dependency>
    <groupId>com.dangdang</groupId>
    <artifactId>elastic-job-lite-core</artifactId>
    <version>${latest.release.version}</version>
</dependency>

<!-- 使用springframework自定义命名空间时引入 -->
<dependency>
    <groupId>com.dangdang</groupId>
    <artifactId>elastic-job-lite-spring</artifactId>
    <version>${latest.release.version}</version>
</dependency>
```
### 2、作业程序

```java
public class MyElasticJob implements SimpleJob {
    
    @Override
    public void execute(ShardingContext context) {
        switch (context.getShardingItem()) {
            case 0: 
                // do something by sharding item 0
                break;
            case 1: 
                // do something by sharding item 1
                break;
            case 2: 
                // do something by sharding item 2
                break;
            // case n: ...
        }
    }
}
```
我们的定时任务要实现SimpleJob接口，并实现execute方法。在写程序时，我们通常不会用case区分不同的分片，context.getShardingItem() 可以获得当前的分片项，context.getShardingTotalCount()获得总分片数。我们把当前分片项，总分片数传入到sql中，按照规则字段取模，检索出该分片处理的数据，再进行处理。

### 3、spring配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:reg="http://www.dangdang.com/schema/ddframe/reg"
    xmlns:job="http://www.dangdang.com/schema/ddframe/job"
    xsi:schemaLocation="http://www.springframework.org/schema/beans
                        http://www.springframework.org/schema/beans/spring-beans.xsd
                        http://www.dangdang.com/schema/ddframe/reg
                        http://www.dangdang.com/schema/ddframe/reg/reg.xsd
                        http://www.dangdang.com/schema/ddframe/job
                        http://www.dangdang.com/schema/ddframe/job/job.xsd
                        ">
    <!--配置作业注册中心 -->
    <reg:zookeeper id="regCenter" server-lists="yourhost:2181" namespace="dd-job" base-sleep-time-milliseconds="1000" max-sleep-time-milliseconds="3000" max-retries="3" />
    
    <!-- 配置作业-->
    <job:simple id="oneOffElasticJob" overwrite="true" class="xxx.MyElasticJob" registry-center-ref="regCenter" cron="0/10 * * * * ?" sharding-total-count="3" sharding-item-parameters="0=A,1=B,2=C" /> </beans>
```
作业中心我们采用zookeeper，我们项目中采用做小的zk集群，3台。在作业中心配置中，server-lists填写3台zk地址，用“,”隔开，zk1:port1,zk2:port2,zk3:port3。下面就是我们作业的具体实现的配置规则，class实现类、registry-center-ref配置中心zk的id（regCenter）、cron定时任务规则、sharding-total-count总分片数。

overwrite="true"这个配置很重要，因为这些配置都要上传到zk中，当你改变了配置之后，zk中并没有改变，执行的任务还是旧的。所以要加上这个配置。

这样，我们的分布式定时任务就配置好了，剩下的就是部署，上面的例子中，我们的总分片数是4，如果我们部署2台机器，每台机器将获得2个分片，部署4台机器，每台机器获得一个分片。如果出现宕机情况，分片将重新分配，从而做到高可用。

## 四、总结

当当的这款开源产品是非常棒的，解决了我的项目中定时任务的单点问题，使系统有了高可用的保证。要说缺点嘛，也有一个，就是每一个任务都需要新写一个类实SimpleJob接口。