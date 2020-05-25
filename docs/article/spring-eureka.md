# Spring Cloud 服务的注册与发现（Eureka） [返回](/ "首页")

服务发现是微服务架构下最核心的概念。Eureka是服务发现的服务端和客户端，服务端是服务的注册中心，客户端是每一个服务。
服务端可以部署成为高可用，每一个节点都可以将其注册的服务备份到其他节点。

## 一、Eureka Server

Eureka Server是服务的注册中心，这是分布式服务的基础，我们看看这一部分如何搭建。

首先，Spring Cloud是基于Spring Boot的，所以我们的项目都是Spring Boot项目。需要引入最基础的Spring Boot的jar包，如下：
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
</dependencies>
```
然后，再引入Eureka Server的jar包：
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
</dependency>
```
接下来我们编写启动类：
```java
@SpringBootApplication
@EnableEurekaServer
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class,args);
    }
}
```
其中`@EnableEurekaServer`标志着这个服务是一个Eureka Server。

下面就是最重要的`application.yml`的配置，我们先从最简单的单例模式说起。

### 单例模式

这种模式下，Eureka Server是一个单点，如果发生故障，则整个注册中心不可用，只适用于测试环境，具体配置如下：
```yaml
spring:
  profiles: standalone
eureka:
  instance:
    hostname: localhost
  client:
    service-url:
      defaultZone: http://localhost:8761
    fetch-registry: false
    register-with-eureka: false
server:
  port: 8761
```
在单例模式下，我们关掉客户端的行为。其中`fetch-registry`是抓取注册的服务，`register-with-eureka`是将自己本身向其他的Eureka Server 注册。
这两项在集群配置时是必须打开的，这样才能使注册的服务同步到其他节点上。

在单例模式下，`eureka.instance.hostname`必须是localhost，而且`defaultZone`不能使用ip，要使用`eureka.instance.hostname`且走域名解析才可以。
这里我们配置的是localhost，不需要修改hosts文件。这块不知道为什么Spring Cloud要这么设计，小编在搭建集群时折腾了好长时间。
我们启动服务，访问http://localhost:8761，可以看到Eureka的管理页面。


### 集群模式

我们可以通过创建多个Eureka Server实例，并让他们相互注册来实现集群。相互注册就是我们前面提到的`fetch-registry`和`register-with-eureka`,
它们默认都是true，所以不需要配置，我们需要制定其他节点的url就可以了，我们以3个节点为例：
```yaml
spring:
  application:
    name: eureka-server

---
spring:
  profiles: peer1
eureka:
  instance:
    hostname: peer1
  client:
    service-url:
      defaultZone: http://peer2:9200/eureka/,http://peer3:9300/eureka/
server:
  port: 9100
---
spring:
  profiles: peer2
eureka:
  instance:
    hostname: peer2
  client:
    service-url:
      defaultZone: http://peer1:9100/eureka/,http://peer3:9300/eureka/
server:
  port: 9200
---

spring:
  profiles: peer3
eureka:
  instance:
    hostname: peer3
  client:
    service-url:
      defaultZone: http://peer1:9100/eureka/,http://peer2:9200/eureka/
server:
  port: 9300
```
我们在一台机器上起3个实例，peer1、peer2、peer3，端口分别为：9100、9200、9300。
这里我们还是要注意一下`instance.hostname`和`service-url`
* 3个实例的instance.hostname不能重复，否则集群搭建失败
* service-url不能使用ip+端口直接访问，否则也会失败

在单机情况下，我们需要配置hosts来解析peer1、peer2、peer3
```
127.0.0.1 peer1
127.0.0.1 peer2
127.0.0.1 peer3
```
集群搭建成功：

![管理页面](http://testimage.alwaysnb.com/blog/20180615171553.png)

DS Replicas显示两个副本节点，available-replicas显示两个可用的副本节点。

如果在真实的物理机上，我们可以不通过配置hosts的方式也是可以的，记住这是 **真实的物理机的情况下，
每台机器的ip都不一样**。配置如下：
```yaml
spring:
  application:
    name: eureka-server

---
spring:
  profiles: peer1
eureka:
  instance:
    prefer-ip-address: true
  client:
    service-url:
      defaultZone: http://ip2:9200/eureka/,http://ip3:9300/eureka/
server:
  port: 9100
---
spring:
  profiles: peer2
eureka:
  instance:
    hostname: peer2prefer-ip-address: true
  client:
    service-url:
      defaultZone: http://ip1:9100/eureka/,http://ip3:9300/eureka/
server:
  port: 9200
---

spring:
  profiles: peer3
eureka:
  instance:
    prefer-ip-address: true
  client:
    service-url:
      defaultZone: http://ip1:9100/eureka/,http://ip2:9200/eureka/
server:
  port: 9300
```
实例的名称可以使用ip去注册，当然每个ip不一样，也不会重复，不会导致失败。

至此，我们的Eureka Server就搭建完了，具体参照GitHub地址：[https://github.com/liubo-tech/spring-cloud-eureka](https://github.com/liubo-tech/spring-cloud-eureka)


