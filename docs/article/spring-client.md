# Spring Cloud 服务端注册与客户端调用  [返回](/ "首页")

上一篇中，我们已经把Spring Cloud的服务注册中心Eureka搭建起来了，这一章，我们讲解如何将服务注册到Eureka，以及客户端如何调用服务。

## 一、注册服务

首先要再项目中引入Eureka Client，在pom.xml中加入如下配置：
```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>Edgware.SR3</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
</dependencies>
```
然后再我们的application.properties中配置好Eureka注册中心的地址，如下：
```properties
eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
```
http://localhost:8761/eureka/是默认地址，你可以进行修改。程序上我们正常开发即可，使用Spring MVC。如下：
```java
@SpringBootApplication
@RestController<br>@RequestMapping("demo")
public class Application {
 
    @RequestMapping("home")
    public String home() {
        return "Hello world";
    }
 
    public static void main(String[] args) {
        new SpringApplicationBuilder(Application.class).web(true).run(args);
    }
 
}
```
这样/demo/home就会注册到Eureka注册中心。接下来我们要说一说如何调用。

## 二、使用Feign进行调用，Hystrix熔断

首先我们将Feign引入到项目中，并将Hystrix一并引入，这样可以在服务不可用时进行熔断。在pom.xml中加入如下配置：

```xml
<dependency>
     <groupId>org.springframework.cloud</groupId>
     <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-feign</artifactId>
</dependency>
```
然后在application.properties中加入
```properties
feign.hystrix.enabled=true
```
将feign的熔断开启了。然后在main class中加上注解
```java
@SpringBootApplication
@EnableCircuitBreaker
@EnableFeignClients
public class SpringCloudClientApplication {
 
    public static void main(String[] args) {
        SpringApplication.run(SpringCloudClientApplication.class, args);
    }
}
```
接下来我们编写Feign的调用接口，ITempService，如下：
```java
@FeignClient(name = "EUREKA-SERVER",fallback = TempService.class)
public interface ITempService {
    @RequestMapping(method = RequestMethod.GET, value = "/demo/home")
    public String index();
}
```
@FeignClient说明这个接口是一个FeignClient，其中name指向的是服务的名字，在前面的服务中，我们应用的名字叫EUREKA-SERVER，我们这里将name指向这个服务，fallback是熔断后执行的类，我们的熔断执行类为TempService。

@RequestMapping指向EUREKA-SERVER服务中的具体接口，这里我们指向/demo/home，这样我们在调用index方法时，就会调用远程服务的/demo/home。但是如果远程服务不可用，我们该如何处理呢？这样就要用到Hystrix熔断。

我们编写ITempService接口的实现类TempService，如下：
```java
@Component
public class TempService implements ITempService {
 
    @Override
    public String index() {
        return "index error";
    }
}
```
这样，当远程服务/demo/home不可用时，就会执行index方法，返回“index error”。

最后，我们编写Controller，完成调用，如下：
```java
@RestController
@RequestMapping("feign")
public class TempController {
    @Autowired
    private ITempService tempService;
    @RequestMapping("call")
    public String call(){
        return tempService.index();
    }
}
```
这样我们的服务调用与服务注册的例子就讲解完了，是不是很简单，有问题，欢迎在评论区沟通。






