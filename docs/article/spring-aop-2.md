# 温故知新——Spring AOP（二）

上一篇我们介绍Spring AOP的注解的配置，也叫做Java Config。今天我们看看比较传统的xml的方式如何配置AOP。整体的场景我们还是用原来的，“我穿上跑鞋”，“我要去跑步”。Service层的代码我们不变，还是用原来的，如下：

```java
@Service
public class MyService {
    public void gotorun() {
        System.out.println("我要去跑步！");
    }
}
```

再看看上一篇中的MyAspect代码，里边都是使用注解配置的，我们AOP相关的配置全部删除掉，只留下“我床上跑鞋“这样一个方法，如下：

```java
public class MyAspect {
    public void putonshoes() {
        System.out.println("我穿上跑步鞋。");
    }
}
```

类中没有任何的注解，我们将全部通过xml的方式配置AOP。首先，我们要在xml中引入aop的schema，如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:aop="http://www.springframework.org/schema/aop"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd
       http://www.springframework.org/schema/aop
       https://www.springframework.org/schema/aop/spring-aop.xsd">

</beans>
```

有了aop的schema，我们就可以使用Spring的aop的标签了，我们先将MyAspect实例化，因为我们的通知方法”我穿上跑鞋“在这个类中，如下：

```xml
<bean id="myAspect" class="com.example.springaopdemo.aspect.MyAspect" />
```

其中，id我们配置为myAspect。然后，我们就要配置\<aop:config\>了，这个标签说明这是一段aop配置，具体的aop内容都在这个标签内，如下：

```xml
<aop:config proxy-target-class="true">
    ……
</aop:config>
```

其中，我们还可以配置proxy-target-class这个属性，还记得这个属性是什么意思吗？对了，它代表着是否使用CGLIB代理，由于我们项目引入的依赖是spring-boot-starter-aop，默认是使用CGLIB的，所以这里配置不配置都可以。

然后在里边我们配置切面\<aop:aspect\>，它标识着这是一个切面配置，在标签里还要指定我们的切面的bean，也就是myAspect，如下：

```xml
<aop:aspect id="aopAspect" ref="myAspect">
    ……
</aop:aspect>
```

切面的id叫做aopAspect，ref指定我们切面的bean，就是前面实例化的myAspect。好了，切面就配置好了，然后就是切点和通知。切点和通知的配置一定要在\<aop:aspect\>内，说明这个切点和通知属于当前这个切面的。

先来看看切点\<aop:pointcut\>的配置吧，如下：

```xml
<aop:pointcut id="pointcut" 
     expression="execution(* com.example.springaopdemo.service.*.*(..))">
</aop:pointcut>
```

是不是很熟悉，我们看到了匹配方法的表达式。同样，我们要给切点定义一个id叫做pointcut，然后expression就是匹配的表达式，这个和上一篇是一样的，没有区别。在这里，我们还是匹配service包下的所有类的所有方法。好了，到这里切点就配置完成了。

最后，再来看看通知，通知是和\<aop:pointcut\>并列的，都在\<aop:aspect\>内，具体如下：

```xml
<aop:before method="putonshoes" pointcut-ref="pointcut"></aop:before>
```

通知的5种类型，分别对应着5个不同的标签，在这里我们还是使用前置通知\<aop:before\>，在标签的内部，要指定它对应的切点，pointcut-ref="pointcut"，切点我们指定前面配置的，id是pointcut。然后就要指定方法method了，这个方法是哪个类中的方法呢？还记得我们再配置\<aop:aspect\>时指定的bean吗？ref指定了myAspect，那么method指定的方法就是myAspect这个bean中的方法。这里我们配置putonshoes方法。

好了，到这里，aop的配置就全部配置完了，我们看一下全貌吧，

```xml
<bean id="myAspect" class="com.example.springaopdemo.aspect.MyAspect" />

<aop:config proxy-target-class="true">
    <aop:aspect id="aspect" ref="myAspect">
        <aop:pointcut id="pointcut" 
             expression="execution(* com.example.springaopdemo.service.*.*(..))">
        </aop:pointcut>
        <aop:before method="putonshoes" pointcut-ref="pointcut"></aop:before>
    </aop:aspect>
</aop:config>
```

最后，我们在SpringBoot的启动类中，使用@ImportResource("spring-aop.xml") 引入这个xml文件，如下：

```java
@SpringBootApplication
@ImportResource("spring-aop.xml")
public class SpringAopDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringAopDemoApplication.class, args);
    }
}
```

测试类的程序和上一篇是一致，没有变化，如下：

```java
@SpringBootTest
class SpringAopDemoApplicationTests {
    @Autowired
    private MyService myService;

    @Test
    public void testAdvice() {
        myService.gotorun();
    }
}
```

运行一下看看结果，

```shell
我穿上跑步鞋。
我要去跑步！
```

没有问题，符合预期。

在上一篇中，我们可以使用简单的配置，也就是不配置切点，在通知中直接配置匹配表达式，如果忘记的同学可以翻一翻上一篇的内容。在xml的aop配置中，也是可以省略掉切点pointcut的配置的，我们在通知中，直接配置表达式，如下：

```xml
<aop:config proxy-target-class="true">
    <aop:aspect id="aspect" ref="myAspect">
        <aop:before method="putonshoes" 
             pointcut="execution(* com.example.springaopdemo.service.*.*(..))">
        </aop:before>
    </aop:aspect>
</aop:config>
```

是不是比前面的配置看起来清爽一些了。小伙伴们自己运行一下吧，结果是没有问题的。

好了，Spring AOP的Java Config和Schema-based 两种的方式的配置都介绍完了。我们拓展一下思维，Spring的事务管理也是AOP吧，在方法执行之前打开事务，在方法执行后提交事务。但是大家有没有留意，Spring的事务配置和咱们的AOP配置是不一样的，这是为什么呢？咱们下一篇再聊吧。