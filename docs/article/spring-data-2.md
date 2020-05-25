# Spring Data（二）查询  [返回](/ "首页")

接着上一篇，我们继续讲解Spring Data查询的策略。

## 查询的生成

查询的构建机制对于Spring Data的基础是非常有用的。构建的机制将截断前缀find…By、read…By、query…By、count…By、get…By等，从剩余的部分开始解析。省略号可以进一步使用distinct等关键字创建查询。第一个By作为分界符，后面的部分将开始解析。最基础的，你可以使用实体中的属性定义条件并且可以使用And或Or连接它们。

方法名字生成查询：

```java
interface PersonRepository extends Repository<User, Long> {
    List<Person> findByEmailAddressAndLastname(EmailAddress emailAddress, String lastname);
 
    // 使用distinct关键字构建查询
    List<Person> findDistinctPeopleByLastnameOrFirstname(String lastname, String firstname);
    List<Person> findPeopleDistinctByLastnameOrFirstname(String lastname, String firstname);
 
    // Enabling ignoring case for an individual property
    List<Person> findByLastnameIgnoreCase(String lastname);
 
    // Enabling ignoring case for all suitable properties
    List<Person> findByLastnameAndFirstnameAllIgnoreCase(String lastname, String firstname);
 
    // 在查询中使用OrderBy
    List<Person> findByLastnameOrderByFirstnameAsc(String lastname);
    List<Person> findByLastnameOrderByFirstnameDesc(String lastname);
}
```
解析方法的实际结果取决于持久化的存储，但是其中有一些通用的东西要告诉大家：

* 表达式通常遍历属性并且使用操作符连接。你可以连接属性使用表达式And或者Or，也可以使用其他的操作符Between、LessThan、GreaterThan、Like等。被支持的操作符非常的广泛，你可以查询适合的相关文档。
* 方法解析器支持单个属性设置IgnoreCase的标识（例如：findByLastnameIgnoreCase(…)），或者一个类型的所有属性设置ignoring case（例如：findByLastnameAndFirstnameAllIgnoreCase(…)）。不管ignoring cases是不是被广大的数据库支持，都要查询指定数据库的相关文档。
* 你可以使用OrderBy使方法查询排序。

## 属性表达式

属性表达式仅仅涉及一个被管理实体的属性。在查询生成时，你已经确定解析的属性就是你管理的实体类中的属性。你也可以通过嵌套属性定义约束，假设一个Person类有一个Address类，Address类有一个ZipCode类，方法的命名如下：
```java
List<Person> findByAddressZipCode(ZipCode zipCode);
```
生成的属性嵌套为：x.address.zipCode。解决的逻辑是从AddressZipCode开始，用这个名字（开头字母小写）去检查属性，如果找到了，就检查这个属性。如果没有找到，将从右侧按照驼峰规则进行分割，分割成一个头和一个尾，然后尝试找到合适的属性，我们的例子中，分割层AddressZip和Code。接着，如果用头找到了合适的属性，会用尾继续向下一层查找，将尾部按照上面的描述那样继续分割。如果第一次分割没有匹配成功，将分割点左移（Address和ZipCode）并继续。

虽然这中逻辑可以为大多数情况下工作，但是它也有可能选择错误的属性。假设Person也有一个addressZip的属性，这种逻辑将匹配第一次分割，选择了错误的属性并最终失败（addressZip没有code字段）。

为了解决中模糊不清的含义，我们可以在方法名字中使用“_”手动创建分割点。所以我们的方法名字如下：
```java
List<Person> findByAddress_ZipCode(ZipCode zipCode);
```
我们将下划线作为保留字段，我们强烈建议使用java标准的命名规则。

## 特殊参数的处理

为了在查询中处理参数，你可以按照上面例子中的那样，简单的定义方法参数。除了这些之外，它还可以认识特殊的类型如：Pageable和Sort，他们可以在查询中应用分页和排序。例子如下：
```java
Page<User> findByLastname(String lastname, Pageable pageable);
Slice<User> findByLastname(String lastname, Pageable pageable);
List<User> findByLastname(String lastname, Sort sort);
List<User> findByLastname(String lastname, Pageable pageable);
```

第一个方法将通过Pageable实例在查询中添加分页，Page接口知道元素的总数和可用的分页。它是通过底层触发count方法进行总数查询，这将会依赖数据库的使用，我们可以使用Slice替换Page。Slice仅仅知道是否有下一个可用的Slice，这样在遍历大结果集是非常足够的。

排序选项也可以通过Pageable实例处理，如果仅仅需要排序，你可以简单在方法中加入Sort参数，返回的是一个简单List。为了找到你的查询有多少页，你必须触发一个额外的count查询，默认的，这个查询是从你触发的那个查询衍生出来的。

## 限制查询结果

查询方法的结果可以被关键字限制，如：first，top，它们可以被交换使用。后面跟随的数值将制定最大的结果集，如果数字没有设置，将返回一个结果。

用Top和First限制查询结果大小
```java
User findFirstByOrderByLastnameAsc();
User findTopByOrderByAgeDesc();
Page<User> queryFirst10ByLastname(String lastname, Pageable pageable);
Slice<User> findTop3ByLastname(String lastname, Pageable pageable);
List<User> findFirst10ByLastname(String lastname, Sort sort);
List<User> findTop10ByLastname(String lastname, Pageable pageable);
```
限制的表达式也支持Distinct关键字，限制查询的结果集设置到一个实例中，将结果封装到Optional中也是支持的。

如果pagination或者slicing应用到限制的查询分页中，他们也是在限制的结果集中应用。

## 查询结果流

查询的结果也可以用java8的Stream<T>处理，这样可以使用stream的良好性能。

```java
@Query("select u from User u")
Stream<User> findAllByCustomQueryAndStream();
 
Stream<User> readAllByFirstnameNotNull();
 
@Query("select u from User u")
Stream<User> streamAllPaged(Pageable pageable);
```
由于stream使用了底层的资源，在使用后必须关闭，你可以使用close手动关闭，也可以使用java7的try-with-resources 块。
```java
try (Stream<User> stream = repository.findAllByCustomQueryAndStream()) {  
    stream.forEach(…);
}
```
现在并不是所有的Spring Data模块都支持Stream。

## 异步查询结果

仓库的查询方法可以异步执行，这意味着查询会提交到Spring TaskExecutor，并不会立即执行。
```java
@Async
Future<User> findByFirstname(String firstname); 
 
@Async
CompletableFuture<User> findOneByFirstname(String firstname); 
 
@Async
ListenableFuture<User> findOneByLastname(String lastname);
```
第一个方法使用Future作为返回结果。

第二个方法使用java8的CompletableFuture作为返回结果。

第三个方法使用了Spring的ListenableFuture作为返回结果。

## 生成仓库实例

每一个Spring Data模块都包含一个repositories元素指定Spring 扫描的包路径。

Spring Data的xml配置方式
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans:beans xmlns:beans="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns="http://www.springframework.org/schema/data/jpa"
    xsi:schemaLocation="http://www.springframework.org/schema/beans    
    http://www.springframework.org/schema/beans/spring-beans.xsd    
    http://www.springframework.org/schema/data/jpa    
    http://www.springframework.org/schema/data/jpa/spring-jpa.xsd">
     
    <repositories base-package="com.acme.repositories" />
</beans:beans>
```
在上面的例子中，Spring扫描com.acme.repositories和它所有子包中，所有继承了Repository和它子类的所有几口，并将它们构造成仓库。每一个接口被发现，spring都将注册指定的持久化技术并生成合适的代理处理查询方法。每一个bean都是通过接口的名字注册而成，所以UserRepository接口将会注册成userRepository。base-package参数可以使用正则表达式。

使用JavaConfig注解的方式也可以配置包的扫描
```java
@Configuration
@EnableJpaRepositories("com.acme.repositories")
class ApplicationConfiguration {
    @Bean
    EntityManagerFactory entityManagerFactory() { // … }
}
```
在这里，我们使用Jpa作为例子。

Spring Data的Common模块就介绍到这里，欢迎大家在评论区多多交流








