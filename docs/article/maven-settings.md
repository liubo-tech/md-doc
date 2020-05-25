# MAVEN简介之——settings.xml [返回](/ "首页")

## 概述

Maven的settings.xml配置了Maven执行的方式，像pom.xml一样，但是它是一个通用的配置，
不能绑定到任何特殊的项目。它通常包括本地仓库地址，远程仓库服务，认证信息等。

settings.xml存在于两个位置：

* maven目录下的`/conf/settings.xml`
* 用户目录下的`/.m2/settings.xml`

maven目录下的称为全局配置，用户目录下的称为用户配置。如果两个配置都存在，它们的内容将合并，有冲突的以用户配置优先。
通常情况下，用户目录下的`/.m2/settings.xml`是不存在的，如果你需要，可以从maven目录下的`/conf/settings.xml`复制过来。
maven的默认settings模板中，包含了所有的配置的例子，它们都被注释掉了，如果你需要，可以打开注释，配置你自己的信息。

下面是settings文件的顶层元素：

```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                          https://maven.apache.org/xsd/settings-1.0.0.xsd">
      <localRepository/>
      <interactiveMode/>
      <usePluginRegistry/>
      <offline/>
      <pluginGroups/>
      <servers/>
      <mirrors/>
      <proxies/>
      <profiles/>
      <activeProfiles/>
    </settings>
```
settings文件中的内容可以使用插值替换，例如:
1. `${user.home}`或者其他的系统属性（3.0以上）
2. `${env.HOME}`等环境变量

**注意：profile中定义的properties不能使用插值**

## 详细设置

### 简单值（simple value）

settings文件中，顶层元素中的一半以上都是简单值。接下来让我们看一看吧。
```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                      https://maven.apache.org/xsd/settings-1.0.0.xsd">
  <localRepository>${user.home}/.m2/repository</localRepository>
  <interactiveMode>true</interactiveMode>
  <usePluginRegistry>false</usePluginRegistry>
  <offline>false</offline>
  ...
</settings>
```

* localRepository:本地仓库路径，默认值为：`${user.home}/.m2/repository`。它允许所有的用户从这个公共的本地仓库构建系统。
* interactiveMode：默认为true，代表maven是否可以和用户通过输入进行交互。
* usePluginRegistry：默认为false，maven是否可以使用`${user.home}/.m2/plugin-registry.xml`管理插件版本。从2.0以后，我们是不需要使用这个属性的，可以认为它废弃了。
* offline：默认false，构建系统是否可以使用离线模式。在不能连接远程仓库的情况下，这个属性是非常有用的。

### 插件组（Plugin Groups）

`pluginGroups`包含了一组`pluginGroup`元素，每一个都包含一个`groupId`。当你在命令行使用插件，没有提供`groupId`时，maven将搜索这个列表。
列表默认包含`org.apache.maven.plugins`和`org.codehaus.mojo`。
```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                      https://maven.apache.org/xsd/settings-1.0.0.xsd">
  ...
  <pluginGroups>
    <pluginGroup>org.mortbay.jetty</pluginGroup>
  </pluginGroups>
  ...
</settings>
```
例如：我们执行`org.mortbay.jetty:jetty-maven-plugin:run`时，可以使用短命令：`mvn jetty:run`。

### 服务（Servers）

下载和部署的仓库通常在`pom.xml`中的`repositories`和`distributionManagement`元素中定义，但是像`username`和`password`时不应该在
单独的pom文件中定义，这种配置信息应该在settings中定义。
```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                      https://maven.apache.org/xsd/settings-1.0.0.xsd">
  ...
  <servers>
    <server>
      <id>server001</id>
      <username>my_login</username>
      <password>my_password</password>
      <privateKey>${user.home}/.ssh/id_dsa</privateKey>
      <passphrase>some_passphrase</passphrase>
      <filePermissions>664</filePermissions>
      <directoryPermissions>775</directoryPermissions>
      <configuration></configuration>
    </server>
  </servers>
  ...
</settings>
```
* id：server的id，它和maven连接的repository或mirror的id匹配。
* username, password：用户名和密码，这两个元素成对出现。
* privateKey, passphrase：私钥文件和私钥密码，也是成对出现。
* filePermissions, directoryPermissions：当通过maven部署到远程仓库的时候，文件和目录的权限通过这两个元素指定。

**当使用私钥文件的时候，不要使用`password`，要使用`passphrase`。**

### 镜像（Mirrors）

```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                      https://maven.apache.org/xsd/settings-1.0.0.xsd">
  ...
  <mirrors>
    <mirror>
      <id>planetmirror.com</id>
      <name>PlanetMirror Australia</name>
      <url>http://downloads.planetmirror.com/pub/maven2</url>
      <mirrorOf>central</mirrorOf>
    </mirror>
  </mirrors>
  ...
</settings>
```
* id, name：mirror的唯一标识和用户设置的别名。当连接镜像需要用户名密码或私钥时，id要和`<servers>`中配置的id一致。
* url：镜像的url。构建系统时将使用这个地址，而不是原始的仓库地址。
* mirrorOf：仓库镜像的id。例如：指向maven的中央仓库（https://repo.maven.apache.org/maven2/），设置为`center`。也可以使用一些高级的语法：
`repo1,repo2` 或 `*,!inhouse`。

### 代理（Proxies）

```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                      https://maven.apache.org/xsd/settings-1.0.0.xsd">
  ...
  <proxies>
    <proxy>
      <id>myproxy</id>
      <active>true</active>
      <protocol>http</protocol>
      <host>proxy.somewhere.com</host>
      <port>8080</port>
      <username>proxyuser</username>
      <password>somepassword</password>
      <nonProxyHosts>*.google.com|ibiblio.org</nonProxyHosts>
    </proxy>
  </proxies>
  ...
</settings>
```
* id：proxy的唯一标识。
* active：代理是否有效。多个代理的情况下，只能有一个代理有效。
* protocol, host, port：代理的`protocol://host:port`，分隔成了多个元素。
* username, password：代理的用户名和密码，成对出现。
* nonProxyHosts：不使用代理的主机。使用逗号“,”分隔也可以。

**镜像和代理的区别：镜像：改变原始的仓库地址；代理：有些公司是不能上网的，他们需要配置代理才能访问外网。**

### 用户配置（Profiles）

`settings.xml`文件中的`profile`是`pom.xml`中的删减版。它由`activation`, `repositories`, `pluginRepositories` 和 `properties`组成。
而且只包含这4个元素，因为settings中的是全局配置，不是单个项目的配置。

**如果settings中的profile是有效的，它将覆盖掉pom中的相同id的profile。**

#### 激活（Activation）

它是profile中的一个元素，会在满足`activation`的条件时，激活状态。
```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                      https://maven.apache.org/xsd/settings-1.0.0.xsd">
  ...
  <profiles>
    <profile>
      <id>test</id>
      <activation>
        <activeByDefault>false</activeByDefault>
        <jdk>1.5</jdk>
        <os>
          <name>Windows XP</name>
          <family>Windows</family>
          <arch>x86</arch>
          <version>5.1.2600</version>
        </os>
        <property>
          <name>mavenVersion</name>
          <value>2.0.3</value>
        </property>
        <file>
          <exists>${basedir}/file2.properties</exists>
          <missing>${basedir}/file1.properties</missing>
        </file>
      </activation>
      ...
    </profile>
  </profiles>
  ...
</settings>
```
当`activation`的条件满足时，该profile将激活。

* jdk：`activation`有一个内嵌的，在jdk元素中已java为中心的检查。当jdk的版本与配置的版本前缀匹配时，这个profile将被激活。
上面的例子中，jdk的版本1.5.0_06将匹配。范围配置也是可以的，这里不做详细介绍了。
* os：os可以定义一些运行系统的特殊属性。由于比较少用，不做过多介绍，有兴趣的可以查阅官方文档。
* property：如果maven探测到一个属性（这个属性的值可以在pom.xml中配置），它的值与配置的值匹配，这个profile将被激活。上面的例子中，
mavenVersion=2.0.3时，profile将激活。
* file：existence的文件存在，或者missing的文件不存在，条件将激活。

activation不是profile激活的唯一方式，`settings.xml`文件中的`activeProfile`元素包含了一个profile的id，可以同过命令行指定这个id来
激活profile。例如：-P test，将激活id为test的profile。

#### 属性（Properties）

maven的属性是一个占位符，它可以在pom文件中，通过${X}进行访问，X是属性的名称。它们有5中不同的形式：
1. `env.X`：前缀是一个env，它将返回系统的环境变量。例如：`${env.PATH}`将返回系统的环境变量$path。
2. `project.x`：访问pom嗯我那件，点（.）在pom中代表层级的分隔。例如：`<project><version>1.0</version></project>`可以通过`${project.version}`访问。
3. `settings.x`：同上，只是访问的是settings文件。例如：`<settings><offline>false</offline></settings>`可以通过`${settings.offline}`访问。
4. Java System Properties：java系统属性，所有通过`java.lang.System.getProperties()`可以访问到的属性，在pom文件中都可以访问。
例如：`${java.home}`。
5. `x`：`<properties>`元素里配置的属性。通过`${someVal}`访问。

```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                      https://maven.apache.org/xsd/settings-1.0.0.xsd">
  ...
  <profiles>
    <profile>
      ...
      <properties>
        <user.install>${user.home}/our-project</user.install>
      </properties>
      ...
    </profile>
  </profiles>
  ...
</settings>
```
上面的例子中，如果profile被激活，在pom中可以访问`${user.install}`。

#### 仓库（Repositories）

Repositories在这里不是本地仓库的意思，而是远程仓库的集合。它在本地仓库配置，maven通过它从远程下载插件或者依赖。
不同的仓库包含不同的项目，在激活的profile下，它们能被搜索到。

```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                      https://maven.apache.org/xsd/settings-1.0.0.xsd">
  ...
  <profiles>
    <profile>
      ...
      <repositories>
        <repository>
          <id>codehausSnapshots</id>
          <name>Codehaus Snapshots</name>
          <releases>
            <enabled>false</enabled>
            <updatePolicy>always</updatePolicy>
            <checksumPolicy>warn</checksumPolicy>
          </releases>
          <snapshots>
            <enabled>true</enabled>
            <updatePolicy>never</updatePolicy>
            <checksumPolicy>fail</checksumPolicy>
          </snapshots>
          <url>http://snapshots.maven.codehaus.org/maven2</url>
          <layout>default</layout>
        </repository>
      </repositories>
      <pluginRepositories>
        ...
      </pluginRepositories>
      ...
    </profile>
  </profiles>
  ...
</settings>
```
* releases, snapshots：稳定版本或快照版本对应的配置。
* enabled：true或者false。对应版本的仓库是否可用。
* updatePolicy：更新策略。它指定了多长时间更新一次，maven经常比较本地pom和远程pom的时间戳。它的选项有：`always`、`daily`(默认)、
`interval:X`(X是分钟)、`never`。
* checksumPolicy：当maven部署文件到仓库时，它还会部署相对应的checksum文件。选项有：`ignore`, `fail`, 或 `warn`，在checksum丢失或不正确的情况下执行。
* layout：在上面的配置中，它们都跟随一个公共的布局。这在大多数情况下是正确的。Maven 2有一个仓库的默认布局，但是maven 1.x有一个不同的布局。
使用这个元素可以选择使用哪个版本的布局，`default` 或 `legacy`。

#### 插件仓库（Plugin Repositories）

仓库有两种主要的类型。第一种是工件作为依赖，常说的jar包依赖。第二种是插件，maven的插件是一种特殊类型的工件，正因如此，maven把插件类型的仓库
单独提了出来。`pluginRepositories`的元素和`repositories`的元素非常的相似，它指定一个远程插件仓库的地址，可以在那里找到相应的maven插件。

### 激活profile（Active Profiles）

```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                      https://maven.apache.org/xsd/settings-1.0.0.xsd">
  ...
  <activeProfiles>
    <activeProfile>env-test</activeProfile>
  </activeProfiles>
</settings>
```
`activeProfiles`元素包含了`activeProfile`元素的集合，`activeProfile`有一个profile的id值。在`activeProfile`里定义的id都将被激活。
如果没有找到匹配的profile，什么都不会生效。

好了，maven的settings.xml就为大家介绍的这里，有疑问可以随时评论、留言。接下来还会介绍maven的pom.xml。



