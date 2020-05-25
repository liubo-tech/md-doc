## Mybatis Generator 使用com.mysql.cj.jdbc.Driver遇到的问题 [返回](/ "首页")

今天闲来无事，准备搭一套SSM的环境，当然所有的jar包都用最新的。
Mybatis使用3.4.6，Mysql使用最新的8.0，mysql-connector-java用的8.0.11。

安装好数据库后，新建了一个test库，并创建了一张user表。配置好Mybatis的配置文件，如下：
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE generatorConfiguration PUBLIC "-//mybatis.org//DTD MyBatis Generator Configuration 1.0//EN" 
"http://mybatis.org/dtd/mybatis-generator-config_1_0.dtd" >
<generatorConfiguration>

<!-- 指定数据连接驱动jar地址 -->
<classPathEntry location="D:\.m2\repository\mysql\mysql-connector-java\8.0.11\mysql-connector-java-8.0.11.jar" />

<!-- 一个数据库一个context -->
<context id="infoGuardian" targetRuntime="MyBatis3DynamicSql">
    <!-- 注释 -->
    <commentGenerator >
        <property name="suppressAllComments" value="true"/><!-- 是否取消注释 -->
        <property name="suppressDate" value="true" /> <!-- 是否生成注释代时间戳-->
    </commentGenerator>

    <!-- jdbc连接 -->
    <jdbcConnection driverClass="com.mysql.cj.jdbc.Driver"
                    connectionURL="jdbc:mysql://localhost:3306/test?useSSL=false&amp;characterEncoding=utf8
                    &amp;serverTimezone=Asia/Shanghai"
                    userId="root"
                    password="xxxxx" />

    <!-- 类型转换 -->
    <javaTypeResolver>
        <!-- 是否使用bigDecimal， false可自动转化以下类型（Long, Integer, Short, etc.） -->
        <property name="forceBigDecimals" value="false"/>
    </javaTypeResolver>

    <!-- 生成实体类地址 -->
    <javaModelGenerator targetPackage="com.example.xxx.model"
                        targetProject="src\main\java" >
        <property name="enableSubPackages" value="false"/>
        <!-- 是否针对string类型的字段在set的时候进行trim调用 -->
        <property name="trimStrings" value="true"/>
    </javaModelGenerator>

    <!-- 生成mapxml文件 -->
    <sqlMapGenerator targetPackage="mybatis"
                     targetProject="src\main\resources" >
        <property name="enableSubPackages" value="false" />
    </sqlMapGenerator>

    <!-- 生成mapxml对应client，也就是接口dao -->
    <javaClientGenerator targetPackage="com.example.xxx.dao"
                         targetProject="src\main\java" type="XMLMAPPER" >
        <property name="enableSubPackages" value="false" />
    </javaClientGenerator>
    
    <table tableName="user" domainObjectName="User"></table>

</context>
</generatorConfiguration>
```
安装好Mybatis Generator的maven插件后，直接运行，运行后，生成了`User`和`User.java.1`两个文件，打开一看，
User是test库中的表，只有4个字段，而User.java.1则是mysql库（Mysql的系统用户库）中的user表。怎么会扫描了两个
库（mysql和test）？再看看我的connectionURL，确实指到了/test了，怎么会扫描mysql库呢？
于是我翻阅资料，终于找到了问题。
`org.mybatis.generator.internal.db.DatabaseIntrospector`的509行，代码如下：
```java
ResultSet rs = databaseMetaData.getColumns(localCatalog, localSchema,
                localTableName, "%");
```
变量localCatalog是上面配置文件中table中的元素，我们并没有配置，这里localCatalog是null，在底层会执行SHOW DATABASES
得到所有的数据库，但是我们已经在`connectionURL="jdbc:mysql://localhost:3306/test?useSSL=false&amp;characterEncoding=utf8&amp;serverTimezone=Asia/Shanghai"`
中指定了数据test呀，查看源码发现在连接中少配置了一个属性`nullCatalogMeansCurrent=true`,加上这个属性，再执行，就没有问题了。

尤其是使用`com.mysql.cj.jdbc.Driver`这个驱动的时候，更要加上这个属性。在项目中不需要加，但是在使用Mybatis Generator时要加上。
`com.mysql.cj.jdbc.Driver`是mysql官方比较推荐的，旧的驱动`com.mysql.jdbc.Driver`已经不用了。
