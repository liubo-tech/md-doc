# Feign 与 Hystrix  [返回](/ "首页")

Feign是一个声明式的web服务客户端，它使得web服务调用非常的简单，当我们使用Feign时，Spring Cloud
整合了Ribbon和Eureka，从而为我们提供了一个负载均衡的Http客户端。

## 一、Feign的使用

首先我们引入Feign的依赖，由于Feign要通过Eureka去获取服务，所以也要引入Eureka-client：
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-openfeign</artifactId>
    </dependency>
</dependencies>
```
然后再Spring Boot启动类上打上`@EnableFeignClients`注解，使得应用可以使用FeignClient，如下：
```java
@SpringBootApplication
@EnableFeignClients
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

}
```
最后编写远程调用接口，调用上一篇中提到的Order服务，如下：
```java
@FeignClient(value = "SERVICE-ORDER")
public interface RemoteOrder {

    @RequestMapping("/order/detail")
    Order getRemoteOrder();
}
```
其中，`@FeignClient`指明这个接口是一个FeignClient，value值是我们要从eureka注册中心获取的服务，由于eureka-client-order项目中
的`spring.application.name`是SERVICE-ORDER，所以我们这里写SERVICE-ORDER。

我们再写个controller使用Feign去调用远程服务，如下：
```java
@RestController
@RequestMapping("feign")
public class FeignController {
    @Autowired
    private RemoteOrder remoteOrder;

    @RequestMapping("order")
    public Order feignOrder(){
        return remoteOrder.getRemoteOrder();
    }
}
```
最后，我们修改一下eureka-client-order，启动两个服务，两个服务的订单状态不同，如下：
```yaml
spring:
  profiles: node-1
server:
  port: 8100
order:
  status: '已付款'

---
spring:
  profiles: node-2
server:
  port: 8300
order:
  status: '未支付'
```
大功告成，我们启动4个服务：eureka注册中心，order-node-1，order-node-2，feign。访问我们的controller，并刷新，显示结果如下：
```json
{"id":123123,"totalPrice":87.98,"orderStatus":"已付款"}

{"id":123123,"totalPrice":87.98,"orderStatus":"未支付"}
```
说明feign的负载均衡已经启用。

## 二、Hystrix熔断

首先我们引入Hystrix的依赖：
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
</dependency>
```
并启用Feign的Hystrix，
```yaml
feign:
  hystrix:
    enabled: true
```
Feign封装了所有方法的熔断方法，Hystrix支持fallback的概念，在FeignClien中指定即可
```java
@FeignClient(value = "SERVICE-ORDER",fallback = OrderHystrix.class)
public interface RemoteOrder {

    @RequestMapping("/order/detail")
    Order getRemoteOrder();
}
```
指定fallback的类为OrderHystrix，我们新建OrderHystrix类并实现RemoteOrder接口：
```java
@Service
public class OrderHystrix implements RemoteOrder {
    @Override
    public Order getRemoteOrder() {
        Order order = new Order();
        order.setOrderStatus("熔断order");
        return order;
    }
}
```
这样我们在调用远程的/order/detail时，如果发生超时或者错误，就会调用`getRemoteOrder()`方法。
我们可以把eureka-client-order的两个服务都停掉，然后进行访问，结果如下：
```json
{"id":123123,"totalPrice":87.98,"orderStatus":"熔断order"}
```
说明熔断机制起作用了。

项目示例地址：[https://github.com/liubo-tech/spring-cloud-eureka](https://github.com/liubo-tech/spring-cloud-eureka)。