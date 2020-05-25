## 一、服务注册

注册Eureka的服务非常的简单，只需要引入`spring-cloud-starter-netflix-eureka-client`的jar包即可。
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```
当然，我们要在配置文件中指明注册中心的地址：
```yaml
server:
  port: 8100
spring:
  application:
    name: service-order
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```
我们为了简单，注册中心用的是单机，大家也可以使用集群方式。

我们启动这个应用，它就是将自己的ip地址、端口、应用名称等信息向注册中心注册。我们可以打开注册中心的管理后台看到：

![控制台](http://testimage.alwaysnb.com/blog/20180619161734.png)

我们service-user服务已经注册成功了。

**只要我们引入了`spring-cloud-starter-netflix-eureka-client`的jar包，它就使得我们的应用即是
Eureka实例（instance，是服务的提供者）又是Eureka的客户端（client，可以注册中心发现其他的服务地址）。**
Spring Cloud的服务提供和发现是在一起的，这有别于我们认识的其他的服务框架（如：dubbo）。既然服务的提供
和发现是在一起的，我们来看一看怎么发现其他服务，并完成调用。

## 二、服务的调用

我们已经引入了`spring-cloud-starter-netflix-eureka-client`的jar包，就可以从注册中心找到其他的服务。
我们这里写个远程调用的例子供大家参考：
```java
@RequestMapping("remote")
public class RemoteController {

    @Autowired
    private DiscoveryClient discoveryClient;

    @RequestMapping("order")
    public Order remoteOrder(){
        List<ServiceInstance> instances = discoveryClient.getInstances("SERVICE-ORDER");
        String url = instances.get(0).getUri()+"/order/detail";
        RestTemplate restTemplate = new RestTemplateBuilder().build();
        Order order = restTemplate.getForObject(url, Order.class);
        return order;
    }
}
```
其中，“SERVICE-ORDER”是我们order服务中的`spring.application.name`的名字，`discoveryClient`通过服务的名称找到对应的地址。
我们可以看到它返回的是一个List，这说明我们的服务可以搭建集群，我们取服务中的第一个地址，并通过`RestTemplate`进行调用。
这种方法是比较原始的方法，Spring Cloud给我们封装更简便的Feign，它可以更方便的调用服务，并提供了负载均衡策略，这是我们下一张要讲的内容。

至此，Eureka服务注册与发现就介绍完了，示例地址：[https://github.com/liubo-tech/spring-cloud-eureka](https://github.com/liubo-tech/spring-cloud-eureka)。



