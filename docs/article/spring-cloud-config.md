# Spring Cloud配置中心（Config）

Spring Cloud是现在流行的分布式服务框架，它提供了很多有用的组件。比如：配置中心、Eureka服务发现、
消息总线、熔断机制等。

配置中心在Spring Cloud的众多组件中是比较基础的，它提供了配置文件的统一管理，可以很轻松的切换不通的环境。
它的具体结构如下：

* 存储配置文件的文件系统（通常使用git）
* 配置中心服务端（从文件系统获取最新的配置文件，为客户端提供配置信息）
* 配置客户端（从配置中心获取配置信息）

**_Spring Cloud是建立在Spring Boot基础上的，Spring Cloud离不开Spring Boot，所以我们的项目都是基于Spring Boot的。_**

配置文件一般我们放在git上，也好做版本控制。接下来我们讲一下配置中心的搭建。

## 配置中心搭建

首先，引入Spring Boot和Spring Cloud的依赖BOM：
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
        <dependency>
            <!-- Import dependency management from Spring Boot -->
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>1.5.9.RELEASE</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```
**_这里我们需要仔细看一下官方文档，Spring Cloud的Finchley版本是基于Spring Boot2.0的，在Spring Boot1.5下
是不能工作的。而Edgware版本是基于1.5的，在2.0下不能正常工作。这点大家要注意，以免出现不必要的麻烦。
这里我们采用Spring Cloud 的Edgware和Spring Boot的1.5版本。_**

然后倒入必须的依赖，如下：
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-config-server</artifactId>
    </dependency>
</dependencies>
```
最后编写配置中心的启动类，如下：
```java
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```
`@EnableConfigServer`标志着这个服务是一个配置中心服务，具体的信息在`application.properties`文件中配置：
```properties
#服务端口
server.port=9000
#配置文件的git地址
spring.cloud.config.server.git.uri=https://github.com/liubo-tech/spring-cloud-properties
#配置文件的临时文件目录
spring.cloud.config.server.git.basedir=/d:/config-repo
```
服务端口和git地址大家都比较明白，第三个是配置临时文件的目录。在配置中心被调用后，配置中心会从git
上拉取配置文件，并在本地缓存，这个就是配置缓存的目录，也可以不配置，使用系统默认的。
这样配置中心就搭好了，也可以通过Nginx搭建集群做的高可用。

访问配置文件格式的如下：
```
/{application}/{profile}[/{label}]
/{application}-{profile}.yml
/{label}/{application}-{profile}.yml
/{application}-{profile}.properties
/{label}/{application}-{profile}.properties
```
其中：
* `{application}`对应客户端的应用名称（spring.application.name）
* `{profile}`对应客户端的spring.profiles.active
* `{label}`是可选的git标签（默认为“master”）。

## 客户端调用

以前配置文件都是放在项目中，这使得我们在切换不同环境时非常麻烦，一些配置的敏感信息也对开发人员暴露了。
使用统一的配置中心就可以避免这些，让我们看一看客户端是如何调用的。

首先，导入必须依赖的jar包，如下：
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-config</artifactId>
    </dependency>
</dependencies>
```
只要Spring Cloud Config Client的jar在项目的classpath下，它就会在项目启动时从配置中心获取配置，通过
bootstrap配置文件中的spring.cloud.config.uri属性指定配置中心。

**_这使得客户端的项目必须有一个bootstrap.yml或者bootstrap.properties文件，否则客户端是不会从配置中心加载配置文件的。_**

我们创建bootstrap.properties，如下：
```properties
#配置中心地址
spring.cloud.config.uri=http://localhost:9000
```
指定配置中心的地址，上面的例子中，配置中心的端口我们指定9000。我们在application.properties文件中配置应用的名称：
```properties
spring.application.name=eg-config
```
我们应用叫作“eg-config”，项目启动时会从配置中心加载eg-config的文件。接下来我们做个例子，创建一个Bean，并从配置中心注入值
```java
@Component
public class MyBean {
    @Value("${my.name}")
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
```
其中，name会从配置中心加载属性my.name。启动类如下：

```java
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        ConfigurableApplicationContext applicationContext = SpringApplication.run(Application.class, args);
        //获取bean并打印name字段
        MyBean bean = applicationContext.getBean(MyBean.class);
        System.out.println(bean.getName());
    }

}
```
启动后，控制台打印的结果如下：
```
test
```

这样配置中心就介绍完了，具体请参考项目示例：[https://github.com/liubo-tech/spring-cloud-config](https://github.com/liubo-tech/spring-cloud-config)。
