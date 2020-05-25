# Zuul 网关路由  [返回](/ "首页")

路由是微服务架构中不可或缺的一部分，例如：/api/user映射到user服务，/api/shop映射到shop服务。
Zuul是一个基于JVM的路由和服务端的负载均衡器。Zuul的规则引擎是用JVM语言写的，支持Java和Groovy。

## 一、如何使用Zuul

首先我们引入zuul的jar包，由于zuul要从注册中心寻找服务，所以也要引入eureka-client的jar包。
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-zuul</artifactId>
    </dependency>
</dependencies>
```
并且在启动类上加上注解`@EnableZuulProxy`。
```java
@SpringBootApplication
@EnableZuulProxy
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class,args);
    }
}
```
接下来，我们看看如何配置我们的路由，在yml中配置如下：
```yaml
zuul:
  routes:
    service-order: /myorders/**
```
所有/myorders的请求都会转发到service-order服务，例如：/myorders/order/detail会转发到/order/detail。
zuul.routes是一个map，上面这种方式是简便的写法，key对应服务id，value对应访问路径。
为了获得细粒度的控制，配置应按照如下的方式写：
```yaml
zuul:
  routes:
    service-order:
      path: /myorders/**
      serviceId: service-order
```
routes的key可以任意，只要保证唯一即可，routes的value中，path对应访问路径，serviceId对应服务id。

为了防止服务被自动的添加，我们增加如下配置：
```yaml
zuul:
  ignoredServices: '*'
  routes:
    service-order:
      path: /myorders/**
      serviceId: service-order
```
上面配置的意思是除了service-order服务，其他服务都忽略掉。

除了映射服务，我们也可以映射url，如下：
```yaml
zuul:
  ignoredServices: '*'
  routes:
    service-order:
      path: /myorders/**
      url: http://order.example.com/order_service
```

如果我们在转发时，不想忽略前缀，可以设置`zuul.stripPrefix=false`。

我们启动之前的eureka注册中心、service-order-1、service-order-2和这次的zuul服务，我们访问
http://localhost:8080/myorders/order/detail，并不断刷新，返回结果如下：
```json
{"id":123123,"totalPrice":87.98,"orderStatus":"未支付"}
{"id":123123,"totalPrice":87.98,"orderStatus":"已付款"}
```
说明zuul已经将请求转发到了service-order服务，并实现了负载均衡。

## 二、Cookie和敏感头部信息的转发

你可以在同一个系统的服务之间共享header信息，但不想将敏感的header信息转发到外部系统，你可以在routes中配置忽略的header信息。
Cookie是一个重要的角色，因为它是被认为敏感的。在做转发时，我们可以设置不转发。
其中，Cookie,Set-Cookie,Authorization是默认不转发的。如果后台服务需要，我们可以设置一个空的List
```yaml
zuul:
  ignoredServices: '*'
  routes:
    service-order:
      path: /myorders/**
      serviceId: service-order
  sensitiveHeaders:
```
sensitiveHeaders放在zuul下，是通用的配置，对所有的转发都生效。也可以放在routes的每一个entry下，只对当前的转发规则有效。
我们改造一下service-order，将cookie打印出来。
```java
@RequestMapping("detail")
public Order getOrderInfo(HttpServletRequest request, HttpServletResponse response){
    System.out.println("cookie : "+request.getCookies());
    if (request.getCookies()!=null&&request.getCookies().length>0){
        for (Cookie cookie : request.getCookies()) {
            System.out.println(cookie.getName()+":"+cookie.getValue());
        }
    }

    Cookie cookie = new Cookie("zuul","test");
    response.addCookie(cookie);
    return order;
}
```
重启两个service-order，访问zuul，后台打印结果如下：
```
cookie : [Ljavax.servlet.http.Cookie;@5ddaf631
zuul:test
UM_distinctid:1635c7498fc835-0e31e368c7058d-f373567-fa000-1635c7498fd31c
Hm_lvt_843ed5a4bd8ee47602fc045103b88cd7:1526264538
CNZZDATA1256538031:1367993951-1526263181-null%7C1526280080
Idea-12589d:10a72288-7f81-410b-9b97-b5fb28153a0d
JSESSIONID:6D27CF78C556DD7DFFD5422E71951BAA
```
说明cookie转发成功，我们将`sensitiveHeaders`注释掉，重启zuul服务并访问
后台结果如下：
```
cookie : null
```
说明cookie并没有转发。

项目示例：[https://github.com/liubo-tech/spring-cloud-eureka](https://github.com/liubo-tech/spring-cloud-eureka)。






