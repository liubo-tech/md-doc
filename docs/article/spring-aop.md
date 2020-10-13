# 温故知新——Spring AOP（一）

Spring AOP 面向切面编程，相信大家都不陌生，它和Spring IOC是Spring赖以成名的两个最基础的功能。在咱们平时的工作中，使用IOC的场景比较多，像咱们平时使用的@Controller、@Service、@Repository、@Component、@Autowired等，这些都和IOC相关。但是，使用AOP的场景却非常少，也就是在事务控制这里使用到了AOP，随着SpringBoot的流行，事务控制这块也不用自己配置了，SpringBoot内部已经给咱们配置好了，我们只需要使用@Transactional这个注解就可以了。

Spring AOP作为Spring的基础功能，大家在学习的时候肯定都学过，但是由于平时使用的比较少，渐渐的就遗忘了，今天我们就再来看看Spring AOP，全面的给大家讲一下，我本人也忘记的差不多了，在面试的时候，人家问我Spring AOP怎么使用，我回答：呵呵，忘得差不多了。对方也是微微一笑，回了一个呵呵。好了，咱们具体看看Spring AOP吧。

## Spring AOP解决的问题

面向切面编程，通俗的讲就是将你执行的方法横切，在方法前、后或者抛出异常时，执行你额外的代码。比如：你想要在执行所有的方法前，要验证当前的用户有没有权限执行这个方法。如果没有AOP，你的做法是写个验证用户权限的方法，然后在所有的方法中，都去调用这个公共方法，如果有权限再去执行后面的方法。这样做是可以的，但是显得比较啰嗦，而且硬编码比较多，如果哪个小朋友忘了这个权限验证，那就麻烦了。

现在我们有了AOP，只需要几个简单的配置，就可以在所有的方法之前，去执行我们的验证权限的公共方法。

## Sping AOP的核心概念

在AOP当中，核心的术语非常多，有8个，而且理解起来也是晦涩难懂，在这里给大家罗列一下，大家如果感兴趣可以去查阅一下其他的资料。

> AOP的8个术语：切面（Aspect）、连接点（Join point）、通知（Advice）、切点（Pointcut）、引入（Introduction）、目标对象（Target object）、AOP代理（AOP proxy）、编织（Weaving）。

在这里，我个人觉得Spring AOP总结成以下几个概念就可以了。

* 切面（Aspect）：在Spring AOP的实际使用中，只是标识的这一段是AOP的配置，没有其他的意义。
* 切点（Pointcut）：就是我们的方法中，哪些方法需要被代理，它需要一个表达式，凡是匹配成功的方法都会执行你定义的通知。
* 通知（Advice）：就是你要另外执行的方法，在前面的例子中，就是权限校验的方法。

好了，知道这几个概念，我个人觉得在平时工作中已经足够了。

## Sping AOP的具体配置——注解

我们的实例采用SpringBoot项目搭建，首先我们要把Spring AOP的依赖添加到项目中，具体的maven配置如下：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

具体的版本我们跟随SpringBoot的版本即可。既然它是个starter，我比较好奇它在配置文件中有哪些配置，我们到application.properties中去看一下，

```properties
spring.aop.auto=true
spring.aop.proxy-target-class=true
```

* spring.aop.auto：它的默认值是true，它的含义是：Add @EnableAspectJAutoProxy，也就是说，我们在配置类上不再需要标注@EnableAspectJAutoProxy了。这个算是Spring AOP中的一个知识点了，我们重点说一下。

我们在Spring中使用AOP，需要两个条件，**第一个，要在我们的项目中引入`aspectjweaver.jar`，这个，我们在引入`spring-boot-starter-aop`的时候已经自动引入了。第二个，就是我们我们的配置类中，标注@EnableAspectJAutoProxy 这个注解，如果你使用的是xml的方式，需要你在xml文件中标明`<aop:aspectj-autoproxy/>`。这样才能在我们的项目使用Spring-AOP。**

* spring.aop.proxy-target-class：AOP代理的实现，这个值默认也是true。它的含义是是否使用CGLIB代理。这也是AOP中的一个知识点。

Spring AOP的代理有两种，一种是标准的JDK动态代理，它只能代理接口，也即是我们在使用的时候，必须写一个接口和实现类，在实现类中写自己的业务逻辑，然后通过接口实现AOP。另外一种是使用CGLIB 代理，它可以实现对类的代理，这样我们就不用去写接口了。

Spring AOP默认使用的是JDK动态代理，只能代理接口，而我们在开发的时候为了方便，希望可以直接代理类，这就需要引入CGLIB ，spring.aop.proxy-target-class默认是true，使用CGLIB，我们可以放心大胆的直接代理类了。

通过前面的步骤，我们已经可以在项目中使用Spring AOP代理了，下面我们先创建个Service，再写个方法，如下：

```java
@Service
public class MyService {

    public void gotorun() {
        System.out.println("我要去跑步！");
    }

}
```

我们写了个“我要去跑步”的方法，然后再通过AOP，在方法执行之前，打印出“我穿上了跑鞋”。下面重点看一下这个AOP代理怎么写，

```java
@Component
@Aspect
public class MyAspect {

    @Pointcut("execution(public * com.example.springaopdemo.service.*.*(..))")
    private void shoes() {}

    @Before("com.example.springaopdemo.aspect.MyAspect.shoes()")
    public void putonshoes() {
        System.out.println("我穿上跑步鞋。");
    }
}
```

首先，要创建一个切面，我们在类上使用@Aspect注解，标识着这个类是一个切面，而@Component注解是将这个类实例化，这样这个切面才会起作用。如果只有@Aspect而没有被Spring实例是不起作用的。当然Spring实例化的方法有很多，不一定就非要使用@Component。

再来看看切点的声明，切点的作用是匹配哪些方法要使用这个代理，我们使用@Pointcut注解。@Pointcut注解中有个表达式就是匹配我们的方法用到，它的种类也有很多，这里我们给大家列出几个比较常用的execution表达式吧，

```java
execution(public * *(..))      //匹配所有的public方法
execution(* set*(..))          //匹配所有以set开头的方法
execution(* com.xyz.service.AccountService.*(..))     //匹配所有AccountService中的方法
execution(* com.xyz.service.*.*(..))    //匹配所有service包中的方法
execution(* com.xyz.service..*.*(..))   //匹配所有service包及其子包中的方法
```

示例中，我们匹配的是service包中的所有方法。

**有没有同学比较好奇@Pointcut下面的那个方法？这个方法到底有没有用？方法中如果有其他的操作会不会执行？答案是：方法里的内容不会被执行。那么它有什么用呢？它仅仅是给@Pointcut一个落脚的地方，仅此而已。但是，Spring对一个方法也是有要求的，这个方法的返回值类型必须是void。原文是这么写的：**

> the method serving as the pointcut signature must have a `void` return type

最后我们再来看看通知，通知的种类有5种，分别为：

* @Before：前置通知，在方法之前执行；
* @AfterReturning：返回通知，方法正常返回以后，执行通知方法；
* @AfterThrowing：异常通知，方法抛出异常后，执行通知方法；
* @After：也是返回通知，不管方法是否正常结束，都会执行这个方法，类似于finally；
* @Around：环绕通知，在方法执行前后，都会执行通知方法；

在示例中，使用的是@Before前置通知，我们最关心的是@Before里的内容：

```java
@Before("com.example.springaopdemo.aspect.MyAspect.shoes()")
public void putonshoes() {
    System.out.println("我穿上跑步鞋。");
}
```

@Before里的内容是切点的方法，也就是我们定义的shoes()方法。那么所有匹配了shoes()切点的方法，都会执行@Before这个注解的方法，也就是putonshoes()。

在@Before里除了写切点的方法，还可以直接写切点表达式，例如：

```java
@Before("execution(public * com.example.springaopdemo.service.*.*(..))")
public void putonshoes() {
    System.out.println("我穿上跑步鞋。");
}
```

**如果我们使用这种表达式的写法，就可以省去前面的@Pointcut了，这种方法还是比较推荐的。**我们再写个测试类运行一下，看看效果吧，

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

运行结果如下：

```shell
我穿上跑步鞋。
我要去跑步！
```

没有问题，在执行“我要去跑步”之前，成功的执行了“我穿上跑步鞋”的方法。

好了，今天先到这里，下一篇我们看看如何使用xml的方式配置Spring AOP。