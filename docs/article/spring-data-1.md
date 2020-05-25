# Spring Data（一）概念和仓库的定义 [返回](/ "首页")

Spring Data的主要任务是为数据访问提供一个相似的、一致的、基于Spring的编程模型，同时又保留着下面各个数据存储的特征。它使得使用数据访问技术非常的简单，包括关系型和非关系型数据库、map-reduce框架、云数据服务等。这是一个伞项目，它包含许多指定数据库的子项目。这个项目是许多公司和开发者一起开发而成的，他们是这项令人兴奋的技术的幕后作者。

特征：

* 强大的仓库和定制的实体映射抽象
* 从仓库方法名字衍生出的动态查询
* 提供了基础属性实现的基础类
* 支持透明的审计（创建、最终修改）
* 整合指定仓库代码的可能性
* 通过JavaConfig和指定的xml命名空间非常容易的进行Spring整合
* 用Spring MVC controller进行先进的整合
* 交叉存储持久化的实验性的支持

主要的模块

* Spring Data Commons 每一个Spring Data项目的核心基础概念
* Spring Data Gemfire 提供了从Spring应用的简单的配置和访问Gemfire
* Spring Data JPA 提供了非常简单的基于JPA仓库的实现
* Spring Data JDBC 基于JDBC的仓库
* Spring Data KeyValue 基于Map的仓库和非常简单的创建键-值存储的模块
* Spring Data LDAP 为Spring LDAP提供仓库支持
* Spring Data MongoDB 为MongoDB提供基于Spring的文档实体和存储
* Spring Data REST 作为超媒体RESTful资源输出Spring Data存储
* Spring Data Redis 提供简单的配置和从Spring应用到redis的访问
* Spring Data for Apache Cassandra ——Apache Cassandra的Spring Data模块
* Spring Data for Apache Solr ——Apache Solr 的Spring Data模块

社区模块

* Spring Data Aerospike
* Spring Data ArangoDB
* Spring Data Couchbase
* Spring Data Azure DocumentDB
* Spring Data DynamoDB
* Spring Data Elasticsearch
* Spring Data Hazelcast
* Spring Data Jest
* Spring Data Neo4j
* Spring Data Vault

相关模块

* Spring Data JDBC Extensions 在Spring框架内提供了JDBC的扩展
* Spring for Apache Hadoop 提供统一的配置模型、为HDFS, MapReduce, Pig,和 Hive提供API，简化了Hadoop。
* Spring Content 使内容和你的Spring Data实体发生联系，存储在不同的存储介质中，File-system, S3, Database 或者MongoDB
* Spring Boot 启动器

如果你正在使用SpringBoot，你将继承每一个项目的预定义版本。你可以配置spring-data-releasetrain.version 插入你想要的版本。

Spring Data显著减小了样板化代码的数量，为各个持久化存储实现了数据访问层。

## Spring Data Commons

Spring Data Commons项目是所有Spring Data子项目的基础，它为许多关系型和非关系型数据库提供开发解决方案。由于各个Spring Data模块的起始日期不同，他们中的大多数都有着主要版本和次要版本，找到适合的版本的最简单的方法是依赖Spring Data 版本串BOM，它是我们用最合适的版本定义的。在Maven项目中，你可以在\<dependencyManagement />中声明依赖，如下：
```xml
<dependencyManagement>
 <dependencies>
 　　<dependency>
 　　　　<groupId>org.springframework.data</groupId>
 　　　　<artifactId>spring-data-releasetrain</artifactId>
 　　　　<version>${release-train}</version>
 　　　　<scope>import</scope>
 　　　　<type>pom</type>
 　　</dependency>
 </dependencies>
</dependencyManagement>
```
如果你正在使用Spring Boot时，它已经给你选择了一个最近的Spring Data版本。

Spring Data仓库抽象化的中心接口是Repository，它使用域的类和ID的类型作为泛型参数。这个接口作为标记接口的角色，捕获你要使用的类型，并帮助你发现继承此类型的接口，CrudRepository为管理的实体类提供了复杂的CRUD功能。

```java
public interface CrudRepository<T, ID extends Serializable> extends Repository<T, ID> {
    <S extends T> S save(S entity);
    Optional<T> findById(ID primaryKey);
    Iterable<T> findAll();
    long count();
    void delete(T entity);
    boolean existsById(ID primaryKey);
 // … more functionality omitted.
}
```
我们也提供了特殊技术的持久化抽象，例如：JpaRepository、MongoRepository等。这些接口都继承了CrudRepository，并且输出了各自持久化技术的能力。

PagingAndSortingRepository接口继承了CrudRepository，并添加了一些额外的分页功能：
```java
public interface PagingAndSortingRepository<T, ID extends Serializable> extends CrudRepository<T, ID> {
    Iterable<T> findAll(Sort sort);
    Page<T> findAll(Pageable pageable);
}
```
访问一个实体第二页的例子如下：
```
PagingAndSortingRepository<User, Long> repository = // … get access to a bean Page<User>
users = repository.findAll(new PageRequest(1, 20));
```
通过这些方法，还衍生出了删除和统计的功能，如下：
```java
interface UserRepository extends CrudRepository<User, Long> {
    long countByLastname(String lastname);
}
interface UserRepository extends CrudRepository<User, Long> {
    long deleteByLastname(String lastname);
    List<User> removeByLastname(String lastname);
}
```
## 查询方法：

标准的CRUD方法在底层的数据存储上都有对应的查询，使用SpringData，声明这些查询分为4步：
### 1、声明接口继承Repository或者Repository的子类，并标注实体类型和ID类型
```java
interface PersonRepository extends Repository<Person, Long> { … }
```
### 2、在接口中声明方法：
```java
interface PersonRepository extends Repository<Person, Long> {
    List<Person> findByLastname(String lastname);
}
```
### 3、设置Spring生成接口代理
```java
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
@EnableJpaRepositories
class Config {}
```
或者使用xml的方式：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:jpa="http://www.springframework.org/schema/data/jpa"
    xsi:schemaLocation="http://www.springframework.org/schema/beans
    http://www.springframework.org/schema/beans/spring-beans.xsd
    http://www.springframework.org/schema/data/jpa
    http://www.springframework.org/schema/data/jpa/spring-jpa.xsd">
  
 　　<jpa:repositories base-package="com.acme.repositories"/>
</beans>
```
上面的例子中，使用了Jpa的命名空间，如果你使用其他仓库的抽象，换成其他仓库对应的命名空间即可，例如：你正在使用MongoDB，可以换成MongoDB对应的命名空间。

值得注意的是，JavaConfig并没有默认配置注解类的路径作为包路径，在xml中，扫描包路径的参数配置在base-package参数中，对应的javaConfig将使用注解@Enable-*。

### 4、获取注入的Repository实例，并使用它

```java
class SomeClient {
    private final PersonRepository repository;
    SomeClient(PersonRepository repository) {
        this.repository = repository;
    }
    void doSomething() {
        List<Person> persons = repository.findByLastname("Matthews");
    }
}
```
接下来我们将详细介绍每一步。

## 定义仓库接口

第一步，你定义一个指定实体类的仓库接口，这个接口必须继承Repository并且定义了实体类型和ID类型，如果你想输出Crud方法，你要继承CrudRepository，不要继承Repository。

典型的，你的仓库接口继承Repository, CrudRepository 或者 PagingAndSortingRepository。要不然，如果你不想继承Spring Data的接口，你也可以使用@RepositoryDefinition注解你自己的仓库接口。继承CrudRepository将输出一套完成的方法集来操作你的实体，如果你想选择一些方法输出，最简单的方法是从CrudRepository中复制你想要输出的方法到你自己的仓库中。这些将允许你在Spring Data仓库方法中的最顶端定义你自己的抽象。

```java
@NoRepositoryBean
 interface MyBaseRepository<T, ID extends Serializable> extends Repository<T, ID> {
     Optional<T> findById(ID id);
     <S extends T> S save(S entity);
 }
 
interface UserRepository extends MyBaseRepository<User, Long> {
     User findByEmailAddress(EmailAddress emailAddress);
 }
```
在第一步中，你定义了一个公用的基础接口，并且输出了findById和save方法。这些方法将路由到你选择的存储的基础仓库实现中。这个例子中，如果你定义了SimpleJpaRepository，因为它匹配了CrudRepository方法中的特性，所以UserRepository可以保存users，通过id查找users或者通过email查找users。值得注意的是，中间仓库接口使用@NoRepositoryBean注解，确保你给所有的仓库接口添加注解，Spring Data在运行期将不会创建实例。

### 仓库方法中的null处理

作为Spring Data2.0，CRUD方法返回一个使用java8的Optional的独立的聚合实例，标明值的潜在缺少。除此之外，Spring Data支持在查询方法上返回其他的封装类型。或者，查询方法可以选择根本不使用封装类型。缺少查询接口将通过返回null标明。仓库方法返回集合、封装类型和流来保护不返回null。

空值注解

你可以使用Spring的空值注解来表达仓库的空值约束。它提供了在运行期的空值检查。

* @NonNullApi 在包级别使用，标明参数的默认行为，返回的结果不接受和生成null值。
* @NonNull 在参数或者返回值上使用，他们不允许为null。
* @Nullabe 在参数或者返回值上使用，他们允许为null。

Spring注解是用JSR305的元注解，JSR 305允许工具方IDEA、Eclipse等在通用的方法中提供空安全性的支持，不必提供Spring注解的硬编码支持。为了提供运行期的空值约束检查，你需要使非空值活动在包级别中，在package-info.java中使用@NonNullApi。
```java
@org.springframework.lang.NonNullApi 
package com.acme;
```
一旦非空定义在这个地方，仓库的查询方法在运行期将得到一个空约束的验证。如果查询结果违反了约束，将会抛出异常，例如，在一些条件下方法返回了null，但是已经声明了非空。如果你想选择性的使用空结果，选择@Nullable注解，使用前面提到的封装类型将继续按照希望的那样工作，例如空结果将会转入到那个值中。

使用不同空约束的例子：
```java
package com.acme;                                                              
import org.springframework.lang.Nullable;
interface UserRepository extends Repository<User, Long> {
    User getByEmailAddress(EmailAddress emailAddress);                             
    @Nullable User findByEmailAddress(@Nullable EmailAddress emailAdress); 
    Optional<User> findOptionalByEmailAddress(EmailAddress emailAddress); 
}
```
在前面的例子中，我们已经在package-info.java中，定义了非空的行为。

第一个方法，查询的执行没有产生结果，将抛出EmptyResultDataAccessException异常，emailAddress如果传入空，将抛出IllegalArgumentException。

第二个方法如果没有查询结果将返回null，传入的参数也接受null。

第三个方法如果没有查询结果将返回Optional.empty()，如果传入空参数将抛出IllegalArgumentException。
### 多Spring Data模块中使用Repository

在你的项目中使用唯一的Spring Data模块是非常简单的，定义范围内的所有仓库接口都绑定到Spring Data模块。有时，应用需要使用多个Spring Data模块。这种情况下，需要仓库定义区分不同的持久化技术。Spring Data记录严格的仓库配置模型，因为它在类路径下检测到多个仓库配置元素。严格的配置需要在仓库或者实体类上的细节决定Spring Data绑定哪个仓库定义。

如果仓库定义继承了指定的模块仓库，它是一个有效的特殊的Spring Data模块的申请者。

如果实体类中使用了指定模块的注解，它是一个有效的特殊的Spring Data模块的申请者。Spring Data接受第三方的注解（如：jpa）或者自己提供的注解（如：mongodb）。

仓库定义使用指定模块接口：

```java
interface MyRepository extends JpaRepository<User, Long> { } 
@NoRepositoryBean
interface MyBaseRepository<T, ID extends Serializable> extends JpaRepository<T, ID> { … } 
interface UserRepository extends MyBaseRepository<User, Long> { … }
```
MyBaseRepository和UserRepository都继承了JpaRepository，所以他们都是有效的Jpa模块的申请者。

仓库定义使用通用的接口：
```java
interface AmbiguousRepository extends Repository<User, Long> { … } 
@NoRepositoryBean
interface MyBaseRepository<T, ID extends Serializable> extends CrudRepository<T, ID> { … } 
interface AmbiguousUserRepository extends MyBaseRepository<User, Long> { … }
```

AmbiguousRepository和AmbiguousUserRepository只继承了Repository和CrudRepository，这种情况在使用了唯一的Spring Data模块时是可行的，在多模块的情况，它是不能区分使用哪个具体模块的。

仓库定义使用实体类注解:
```java
interface PersonRepository extends Repository<Person, Long> { … } 
@Entity
class Person { … } 
interface UserRepository extends Repository<User, Long> { … } 
@Document
class User { … }
```
PersonRepository相关的Person使用了Jpa的@Entity注解，所以，它的仓库属于Jpa。UserRepository使用注解了@Document的User，所以它属于MongoDB。

仓库定义使用混合注解实体类：
```java
interface JpaPersonRepository extends Repository<Person, Long> { … }
interface MongoDBPersonRepository extends Repository<Person, Long> { … }
 
@Entity
@Document
class Person { … }
```
这个例子中，实体类即使用了Jpa注解，又使用了MongoDB注解。它定义了两个仓库：JpaPersonRepository和MongoDBPersonRepository。一个给Jpa使用，另一个给MongoDB使用。这种导致未定义的行为使Spring Data不再有能力区分仓库的类型。

仓库类型详情和指定实体类注解，用来严格区分仓库指向哪一个Spring Data模块。在一个实体类中使用多个实体技术注解可以服用实体类，但是Spring Data将不能指定仓库绑定哪一个Spring Data模块。区分仓库的最后一个方法是规范仓库基础包的路径。基础包定义了扫描的开始点，仓库接口都在适合的包中。

基础包的注解驱动配置：
```java
@EnableJpaRepositories(basePackages = "com.acme.repositories.jpa")
@EnableMongoRepositories(basePackages = "com.acme.repositories.mongo")
interface Configuration { }
```
## 定义查询方法

仓库代理有两种方式导出指定仓库的查询。它可以从名字直接导出查询，或者使用手工定义的查询。可用的选项取决于实际的存储。可是，它有一个策略决定哪一个查询被生成。

查询查找策略

下面的策略是可用的仓库解决查询的基础。你可以在命名空间配置策略，通过xml文件中的query-lookup-strategy参数或者Enable*的注解中的queryLookupStrategy参数。一些策略在特殊的存储中不被支持。

CREATE尝试从方法名中构造指定仓库的查询方法，大概的方法是从方法名中移除一个给定的众所周知的前缀，然后解析剩余的部分。

USE_DECLARED_QUERY尝试找到声明的查询，如果找不到，将抛出异常。查询通过注解或其他方法的声明定义。查看指定存储的文档找到可用的选项。如果仓库不能找到存储声明的查询，它将失败。

CREATE_IF_NOT_FOUND结合了CREATE和USE_DECLARED_QUERY。它首先查找声明的查询，如果不能找到，它将生成一个基于命名的查询。这是默认的查询策略。它可以通过方法名字快速的生成查询，也可以通过查询的声明生成查询。

​这一章我们先介绍到这里，具体的方法命名规则将在下一篇中介绍。











