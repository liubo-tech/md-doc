# Nacos配置中心和服务的注册发现

在上一篇中，我们已经把Nacos的集群搭建好了，那么既然已经搭建好了，就要在咱们的项目中去使用。Nacos既可以做配置中心，也可以做注册中心。我们先来看看在项目中如何使用Nacos做配置中心。

## Nacos配置中心

在项目中使用Nacos做配置中心还是比较简单的，我们先创建SpringBoot项目，然后引入nacos-config的jar包，具体如下：

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
```

如果你不想使用SpringBoot默认的nacos-config版本，也可以指定版本号。

首先，我们进入到nacos的管理后台，第一步要创建命名空间，如图：

![image-20201104155920161](D:\Vue-Project\vue-press\docs\article\nacos-1.assets\image-20201104155920161.png)

我们创建了user的服务配置，以后user相关的微服务都在这个命名空间中拉取配置。我们点击保存，命名空间的id会自动生成，这个id是十分重要的，我们要在项目中配置这个id。命名空间创建好以后，我们再创建配置文件，

![image-20201104160412542](D:\Vue-Project\vue-press\docs\article\nacos-1.assets\image-20201104160412542.png)

在配置列表中，我们先选中刚才新建的命名空间：user服务配置。然后再点击新建，我的截图中已经把user-provider的配置文件创建好了。我们可以看一下如何新建，如图：

![image-20201104161632192](D:\Vue-Project\vue-press\docs\article\nacos-1.assets\image-20201104161632192.png)

其中Data ID我们叫做user-provider，group我们用来区分本地环境、测试环境、生产环境。配置格式我们选择yaml，内容我们先配置一个username看看能不能生效。

然后在resources目录下创建bootstrap.yml，这个bootstrap.yml和application.yml是不一样的，它优先加载于application.yml，大家一定要注意他们的区别。我们要在bootstrap.yml文件中，要配置nacos的地址、命名空间、文件名等信息，具体如下：

```yaml
spring:
  cloud:
    nacos:
      server-addr: nacos-host:80
      config:
        file-extension: yml
        name: user-provider
        group: ${spring.profiles.active}
        namespace: e5aebd28-1c15-4991-a36e-0865bb5af930
  application:
    name: user-provider
```

* spring.application.name，这个不用说了，就是你应用的名称，我们叫做user-provider，用户服务的提供者。
* 再看上面的部分server-addr，这个是nacos的地址，我们配置为nacos-host:80。其中nacos-host需要配置host，指向nacos的ip，而端口80也是需要指定的，如果不指定端口，会默认8848端口。
* 再看config的部分，file-extension，文件的扩展名，这里我们使用yml，相应的，在nacos配置中心中，配置格式选择yaml。
* config.name对应着nacos管理后台的Data ID。
* group，在这里是分组，我们用作区分不同环境的标识，通过项目启动时传入的参数${spring.profiles.active}获得。
* namespace，命名空间，这里要填写命名空间的id，这个id在nacos后台中获取。这里我们填写的是user配置服务的命名空间id。

到这里，在项目中使用nacos做配置中心就搭建好了。我们在项目当中写个属性类，测试一下，看看能不能取到值。

```java
@RefreshScope
@Setter@Getter
@Configuration
public class DatabaseConfig {

    @Value("${username}")
    private String username;
    @Value("${server.port}")
    private String port;
}
```

* 我们写了个DatabaseConfig类，先注意一下类上面的注解，@RefreshScope这个注解可以使我们在nacos管理后台修改配置以后，项目不用重启，就可以更改变量的值。
* @Setter@Getter这个是Lombok的注解，可以省去setget方法。
* @Configuration标识这个类是一个配置类，项目启动时会实例化。
* 在类里边，我们定义了两个变量，username和port，两个变量上面的注解@Value，可以取到对应的，属性的值。${username}这个我们在nacos管理后台已经设置了，${server.port}这个我们可以通过项目启动参数获取到，一会带着大家试一下。

我们在写个controller，把变量的值打印出来，如下：

```java
@RestController
@RequestMapping("user")
public class UserController {
    @Autowired
    private DatabaseConfig databaseConfig;


    @RequestMapping("config")
    public String config() {
        return databaseConfig.getUsername()+":"+databaseConfig.getPort();
    }
}
```

我们将username和port两个变量打印出来。好了，程序相关的部分就都写好了，然后，我们添加项目启动参数，如图：

![image-20201105102408670](D:\Vue-Project\vue-press\docs\article\nacos-1.assets\image-20201105102408670.png)

* spring.profiles.active=local，这个参数很重要，项目要用这个local值去nacos管理后台找对应的分组group是local的配置。
* server.port=8080，这个是项目的启动端口，同时，我们也将这个值打印出来了。

好了，我们现在启动项目，并且在浏览器中访问我们刚才写的controller，浏览器返回的结果如下：

```
user:8080
```

* user，是我们在nacos中配置的值，8080是我们添加的启动参数。

返回结果没有问题。然后我们再去nacos管理后台将user改成tom，项目不重启，再看看返回的结果，如图：

![image-20201105110025531](D:\Vue-Project\vue-press\docs\article\nacos-1.assets\image-20201105110025531.png)

确认发布以后，我们刷新一下浏览器，

```
tom:8080
```

我们并没有重启项目，但是返回的结果变成了tom。怎么样？使用nacos做配置中心还是比较好用的吧~

## Nacos注册中心

通常情况下，我们一般会选择Zookeeper、Eureka做注册中心，其实Nacos也是可以做注册中心的。既然我们项目使用了Nacos做配置中心，那么使用Nacos做注册中心也是非常好的选择。下面让我们看看在项目中如何使用Nacos做注册中心。

首先，还是在项目中引入Nacos注册中心的jar包，如下：

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

我们引入了nacos-discovery的jar包，如果您不想使用默认的版本，可以指定需要引入的版本。

然后，我们就要配置Nacos注册中心的地址了，通常情况下，我们是在application.yml文件中进行配置。但是，这次我们使用了Nacos做配置中心，就可以在Nacos的管理后台进行配置了，如下：

```yaml
username: tom
spring:
  cloud:
    nacos:
      discovery:
        server-addr: nacos-host:80
        namespace: e5aebd28-1c15-4991-a36e-0865bb5af930
        group: ${spring.profiles.active}
```

* 我们需要在nacos.discovery节点下进行配置，server-addr，这个属性和前面的配置是一样的，nacos-host是配置了HOST，指向Nacos的ip，80端口也是需要指定的，默认端口是8848。
* namespace，命名空间，我们复用前面的就可以了。
* group，同样，我们用来区分不同的环境，它的值也是从启动参数中获取。

最后，我们在项目的启动类中添加@EnableDiscoveryClient的注解，如下：

```java
@SpringBootApplication
@EnableDiscoveryClient
public class UserProviderApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserProviderApplication.class, args);
    }
}
```

好了，到这里，服务提供者的配置以及代码上的改动都调整完毕了，我们启动一下项目，然后去Nacos管理后台看看服务是否已经注册到Nacos当中。

![image-20201105113948039](D:\Vue-Project\vue-press\docs\article\nacos-1.assets\image-20201105113948039.png)

我们在Nacos管理后台选择服务列表菜单，可以看到我们启动的项目已经注册到nacos中了。如果我们再启动一个服务提供者会是什么样子呢？我们刚启动的项目指定的端口是8080，我们再启动一个项目，将端口指定为8081，看看服务列表是什么样子。

![image-20201110090555246](D:\Vue-Project\vue-press\docs\article\nacos-1.assets\image-20201110090555246.png)

我们看到实例数由原来的1变为了2。说明我们的user-provider服务有了两个，我们再点右边的详情看一下，

![image-20201110090713954](D:\Vue-Project\vue-press\docs\article\nacos-1.assets\image-20201110090713954.png)

服务的详情以及具体的实例都给我们列了出来，我们还可以编辑和下线具体的实例，这个我们后面再介绍。

好了，到这里，服务提供者的就搭建好了，我们分别访问两个服务提供者的具体连接得到的结果如下：

```
# http://localhost:8080/user/config
tom:8080

# http://localhost:8081/user/config
tom:8081
```

接下来，我们再看看服务的消费者如何搭建。我们新建一个SpringBoot项目user-consumer，这个项目我们同样使用Nacos作为配置中心，而且要从Nacos这个注册中心获取服务列表，所以引入jar包如下：

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

然后在bootstrap.yml中，填写nacos配置中心的相关配置，这个和前面的配置的差不多的，只需要改一下相应的文件名称就可以了。

```yaml
spring:
  cloud:
    nacos:
      server-addr: nacos-host:80
      config:
        file-extension: yml
        name: user-consumer
        group: ${spring.profiles.active}
        namespace: e5aebd28-1c15-4991-a36e-0865bb5af930
  application:
    name: user-consumer
```

* 注意config.name，我们改为了user-consumer。并且应用的名称改为了user-consumer。

然后，我们再去Nacos管理后台添加user-consumer的配置，如图：

![image-20201110091827535](D:\Vue-Project\vue-press\docs\article\nacos-1.assets\image-20201110091827535.png)

* DataID就是我们配置的user-consumer，group我们同样配置为local，标识着本地。
* 具体的配置内容是nacos服务的地址，如图。这样我们的服务消费者项目user-consumer就可以从nacos配置中心获取到注册中心的地址和命名空间，并且可以从命名空间获取服务的地址。

配置的部分就到这里了，然后再去启动类中，添加@EnableDiscoveryClient注解，如下：

```java
@SpringBootApplication
@EnableDiscoveryClient
public class UserConsumerApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserConsumerApplication.class, args);
    }
}
```

最后，我们写个Controller，从Nacos获取服务提供者的地址，并调用服务提供者，如下：

```java
@RestController
@RequestMapping("user")
public class UserController {
    @Autowired
    private LoadBalancerClient loadBalancerClient;

    @RequestMapping("consumer")
    public String consumer() {
        ServiceInstance provider = loadBalancerClient.choose("user-provider");
        String url = "http://"+provider.getHost()+":"+provider.getPort()+"/user/config";

        RestTemplate restTemp = new RestTemplate();
        String result = restTemp.getForObject(url, String.class);

        return result;
    }
}
```

* 这个是SpringCloud Alibaba官网给出的调用示例，使用的是LoadBalancerClient，我们先将其注入。
* 在方法里边，我们调用choose方法，选择user-provider服务，这个是我们服务提供者的名称，在nacos管理后台的服务列表中可以查看到的，这个方法会返回具体的服务实例，我们的服务实例有2个，分别是8080端口和8081端口的两个服务，在这里，默认是轮询的负载均衡策略。
* 选择了具体的服务实例，我们就来拼装请求地址，从服务实例中获取地址和端口。
* 最后使用RestTemplate完成调用。

最后，我们配置项目启动，设置spring.profiles.active=local，并且指定端口为9090，如图：

![image-20201110094714366](D:\Vue-Project\vue-press\docs\article\nacos-1.assets\image-20201110094714366.png)

最后，我们启动项目，访问http://localhost:9090/user/consumer，访问结果如下：

```
tom:8080
```

很明显，我们调用到了8080端口的服务提供者，我们再刷新一下，看看返回结果，

```
tom:8081
```

这次又调用到了8081端口的服务提供者，我们多次刷新，发现它会在8080和8081之间切换，这说明我们的负载均衡策略应该是轮询。

### 使用Feign完成服务的调用

上面的例子中，我们使用的是LoadBalancerClient完成服务的调用，接下来，我们分别看看Feign和Ribbon怎么调用服务。我们先来看看Feign，要使用Feign完成服务的调用，先要引入Feign的jar包，如下：

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
    <version>2.2.2.RELEASE</version>
</dependency>
```

然后再启动类上添加@EnableFeignClients的注解，如下：

```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class UserConsumerApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserConsumerApplication.class, args);
    }
}
```

接下来，我们写一个interface来完成feign的服务调用和熔断，如下：

```java
@FeignClient(name = "user-provider",fallback = UserServiceFallback.class)
public interface UserService {
    @RequestMapping("/user/config")
    String config();
}
```

* 我们写了一个UserService的接口，在接口上添加@FeignClient的注解，注解里有两个属性，name指定服务的名称，这里我们指定为user-provider，这是我们前面服务提供者的名称，fallback指定发生熔断时，调用的类。当我们的服务提供者不能正常提供服务时，就会触发熔断机制，会调用熔断服务类的逻辑，返回结果。
* 在接口中，我们写了一个config()方法，方法上添加@RequestMapping的注解，并配置具体的路径。这样，我们在调用服务的时候，通过Feign调用到具体的服务提供者了。

我们再来看看熔断实现类UserServiceFallback的具体内容，如下：

```java
@Service
public class UserServiceFallback implements UserService {
    @Override
    public String config() {
        return "user-fallback";
    }
}
```

* 首先，它是UserService接口，也就是Feign接口的实现类，然后实现接口中的方法，我们直接返回user-fallback字符串。

Feign的接口和熔断的实现类都写好了，但是这还不算完，要使熔断生效，还要添加额外的配置，我们直接去nacos管理后台去配置，进入到user-consumer的配置中，添加如下配置：

```yaml
feign:
  hystrix:
    enabled: true
```

* 这个就是feign的熔断开关，默认是关闭的，现在打开。

最后，我们在controller中，调用UserService接口，如下：

```java
@Autowired
private UserService userService;

@RequestMapping("consumer-feign")
public String userService() {
    String result = userService.config();

    return result;
}
```

* 将UserService，注入进来，然后直接调用方法即可。

我们访问一下http://localhost:9090/user/consumer-feign，看看返回的结果。如下：

```
tom:8080
tom:8081
```

返回的结果和前面是一样的，我们不断的刷新，它也会在8080和8081之间轮询。

### 使用Ribbon完成服务的调用

同样，我们也可以使用Ribbon完成服务的调用，Ribbon和RestTemplate在内部是紧密结合的。我们只需要将RestTemplate实例化，并添加@LoadBalanced注解就可以了，如下：

```java
@Bean
@LoadBalanced
public RestTemplate restTemplate(){
    return new RestTemplate();
}
```

然后在，controller中，我们使用这个实例化好的RestTemplate，就可以了，具体实现如下：

```java
@Autowired
private RestTemplate restTemplate;

@RequestMapping("consumer-ribbon")
public String consumerribbon() {
    String url = "http://user-provider/user/config";
    String result = restTemplate.getForObject(url, String.class);

    return result;
}
```

* 我们将restTemplate注入进来。
* 在具体方法中，url的地址，我们直接写服务名称user-provider加路径的方式，大家可以参照第一种调用方式，看看区别。

我们重启项目，访问http://localhost:9090/user/consumer-ribbon，结果如下：

```
tom:8080
tom:8081
```

返回的结果和前面是一样的，我们不断的刷新，它也会在8080和8081之间轮询。

### 使用Nacos权重负载均衡

三种服务的调用方法都给大家介绍完了，但是，他们的负载均衡策略都是轮询，这有点不符合我们的要求，我们进入到Nacos的管理后台，调节一下服务的权重，如图：

![image-20201110113637147](D:\Vue-Project\vue-press\docs\article\nacos-1.assets\image-20201110113637147.png)

**我们将8080接口的服务权重由1改为10，点击确认，再多次刷新一下我们的访问地址，发现服务的调用还是在8080和8081之间轮询。**这是什么情况？这里就不和大家卖关子了，这是因为LoadBalancerClient、Feign和Ribbon3种方式，它们的底层都是使用Ribbon做负载均衡的，而Ribbon负载均衡默认使用的策略是ZoneAvoidanceRule，我们要修改Ribbon的默认策略，让它使用nacos的权重，那么该如何配置呢？

我们进入到nacos管理后台，修改user-consumer的配置，添加如下配置：

```yaml
user-provider:
  ribbon:
    NFLoadBalancerRuleClassName: com.alibaba.cloud.nacos.ribbon.NacosRule
```

* user-provider是我们服务的名称，你配置哪个服务的负载均衡策略，就写哪个服务的名字。
* 后面ribbon.NFLoadBalancerRuleClassName需要配置负载均衡策略的具体实现，这个实现类要实现IRule接口，在这里，我们指定实现类为com.alibaba.cloud.nacos.ribbon.NacosRule。这是nacos的负载均衡规则，它是实现了IRule接口的。

我们重启项目，调用我们之前的3个链接，调用哪个效果都是一样的，**我们发现返回tom:8080的次数明显增多，说明Nacos服务的权重配置生效了。**小伙伴们还可以将权重改成其他的值试一下。这里就不给大家演示了。

## 总结

Nacos的配置中心和服务注册中心就给大家介绍完了，还是很好用的，这为我们搭建微服务提供了另外一种选择。当然消费端的调用还是首推Feign+hystrix熔断的，功能很强大，小伙伴们在项目中多实践吧~

