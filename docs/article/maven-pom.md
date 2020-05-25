# MAVEN简介之——pom.xml [返回](/ "首页")

## maven构建的生命周期

maven是围绕着构建生命周期这个核心概念为基础的。maven里有3个内嵌的构建生命周期，`default`,`clean`和`site`。
`default`是处理你项目部署的；`clean`生命周期是清楚你项目的；`site`生命周期是生成你的项目文档的。

`default`生命周期由一下的阶段组成：

* `validate`：验证项目正确性和所有需要的信息是否正确；
* `compile`：编译项目源代码；
* `test`：用单元测试框架测试编译后的代码，测试阶段不需要代码打包和部署；
* `package`：把编译后的代码按照发行版本的格式打包，例如：jar；
* `verify`：检验集成测试的结果，确保质量可以接受；
* `install`：安装包到本地仓库，为本地的其他项目依赖使用；
* `deploy`：把最终的包复制到远程仓库，为其他的项目和开发者共享。

`default`生命周期按照上面的顺序执行。

使用下面的命令构建项目并发布到本地仓库：
```bash
mvn install
```
上面的命令在执行`install`之前，将执行默认的生命周期（`validate`, `compile`, `package`等）。你只需要调用最后一个执行的命令即可。

下面的命令可以清除本地构建并重新打包发布到远程仓库：
```bash
mvn clean deploy
```

每一个构建阶段都是由插件目标组成的，一个插件目标代表着一个特殊的工作。它可以被绑定到多个构建阶段中，如果插件目标没有绑定到构建阶段中，
可以直接使用命令去执行。它们执行的顺序取决于命令的顺序。例如：
```bash
mvn clean dependency:copy-dependencies package
```
上例中，先执行`clean`，再执行`dependency:copy-dependencies`，最后执行`package`。

## pom文件

pom是Project Object Model的缩写。它包含了项目的信息和详细配置。

super pom是maven的默认pom，所有的pom都继承super pom。super pom中的配置在你的pom中是有效的。

你能创建的最小pom的格式如下：
```xml
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>my-app</artifactId>
  <version>1</version>
</project>
```
每一个pom都需要配置`groupId`, `artifactId`, 和 `version`。它代表这一个工件，工件的名称格式如下：`<groupId>:<artifactId>:<version>`。
上例中由于没有指定打包的类型，将使用super pom的默认配置，所以它的类型是`jar`。由于仓库也没有指定，将使用super pom中配置的仓库，
我们可以看到super pom中配置了`http://repo.maven.apache.org/maven2`。

super pom是项目继承的一个例子，你也可以在项目中指定自己的父pom，例子如下：
```
.
 |-- my-module
 |   `-- pom.xml
 `-- pom.xml
```
我们沿用上面的例子，项目的结构如上图所示，根目录下的pom是`com.mycompany.app:my-app:1`的pom，my-module/pom.xml是`com.mycompany.app:my-module:1`的pom。
my-module的pom如下：
```xml
<project>
  <parent>
    <groupId>com.mycompany.app</groupId>
    <artifactId>my-app</artifactId>
    <version>1</version>
  </parent>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>my-module</artifactId>
  <version>1</version>
</project>
```
它指定了父pom为my-app，并且指定自己的groupId，artifactId，version。如果你想要groupId，version沿用父pom的，可以将其省略掉，如下：
```xml
<project>
  <parent>
    <groupId>com.mycompany.app</groupId>
    <artifactId>my-app</artifactId>
    <version>1</version>
  </parent>
  <modelVersion>4.0.0</modelVersion>
  <artifactId>my-module</artifactId>
</project>
```

上面的例子中，父pom的位置在module的上一级目录，如果父pom不在上一级目录，该如何配置呢？
```
.
 |-- my-module
 |   `-- pom.xml
 `-- parent
     `-- pom.xml
```
我们可以指定`<relativePath>`元素，如下：
```xml
<project>
  <parent>
    <groupId>com.mycompany.app</groupId>
    <artifactId>my-app</artifactId>
    <version>1</version>
    <relativePath>../parent/pom.xml</relativePath>
  </parent>
  <modelVersion>4.0.0</modelVersion>
  <artifactId>my-module</artifactId>
</project>
```
推荐使用相对路径指定父pom。

项目集合与项目的继承非常像，不同点在于它在父pom中指定模块，为了配置项目集合，你需要做两点：
1. 父pom的`packaging`改为`pom`。
2. 在父pom中指定它的模块。

如果目录结构为：
```
.
 |-- my-module
 |   `-- pom.xml
 `-- pom.xml
```
父pom的配置如下：
```xml
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>my-app</artifactId>
  <version>1</version>
  <packaging>pom</packaging>
 
  <modules>
    <module>my-module</module>
  </modules>
</project>
```
如果目录结构为：
```
.
 |-- my-module
 |   `-- pom.xml
 `-- parent
     `-- pom.xml
```
父pom结构如下：
```xml
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>my-app</artifactId>
  <version>1</version>
  <packaging>pom</packaging>
 
  <modules>
    <module>../my-module</module>
  </modules>
</project>
```

## profile

profile是环境配置，它配置了不同的环境下，项目中使用的值。profile可以定义的位置：
* 每个项目：pom文件；
* 每个用户：`%USER_HOME%/.m2/settings.xml`中；
* 全局配置：`${maven.home}/conf/settings.xml`中。

要使profile被触发，通常是在maven打包编译时指定profile-id。例如：
```bash
mvn clean install -P profile-1,profile-2
```
上面的例子将触发两个profile：`profile-1`和`profile-2`。

还有就是通过settings文件触发，例如：
```xml
<settings>
  ...
  <activeProfiles>
    <activeProfile>profile-1</activeProfile>
  </activeProfiles>
  ...
</settings>
```
一般情况下，这两种方式就够用了，还有其他的方式这里不做过多介绍。

配置profile的地方通常有两个：settings和pom。settings因为时所有项目共同依赖的，所以在这里配置profile的元素时有限制的，可配置的元素
只能是：`<repositories>`，`<pluginRepositories>`和`<properties>`。而在pom中可以配置所有的元素。

## 依赖机制

### 传递依赖

传递依赖的意思是，你依赖的包需要的依赖是不需要指定的，它们会自动的包含进来。maven会读取你依赖包中的项目文件，通过项目文件找到依赖包所需要的依赖包。
当发生循环依赖的时候，会产生问题。

由于传递依赖，项目依赖包的图会非常的巨大。正是因为这个原因，依赖的传递机制加入了额外的特性。

* 依赖调解——当依赖的多个版本同时出现时，决定哪个版本被使用。当前的maven版本使用的是“最近原则”。举例说明，比如，
    A-\>B-\>C-\>D 2.0，并且A-\>E-\>D 1.0。最后，D1.0将被使用，因为D1.0离A是最近的。你可以在A中强制指定依赖D2.0。
    在距离相同的情况下，最先被声明的那个依赖被使用。
* 依赖管理——在项目中可以直接指定依赖的版本，如上例所示。
* 依赖范围——下面会详细介绍
* 排除依赖——如果A-\>B-\>C，在项目A中可以通过`exclusion`元素排除掉C。
* 选择依赖——如果项目Y-\>Z，项目Y可以配置Z为可选依赖（通过optional），当项目X-\>Y时，X仅依赖Y，而不依赖Z，如果X想要依赖Z，必须指定依赖。

依赖范围有6个可选项

* `compile`：默认的依赖范围，它的依赖在项目的类路径下都是可用的。这些依赖将传播到依赖的工程。
* `provided`：非常像`compile`，标志着你希望JDK或者容器在运行时提供依赖。例如，你在构建web项目时，Servlet API和Java EE API的范围设置成`provided`,
因为在运行时，容器提供了这些类。
* `runtime`：标志着这个依赖在编译期是不需要的，在运行期需要。
* `test`：标志着应用的正常使用是不需要这个依赖的，仅仅在测试时需要。
* `system`：这个与`provided`相似，除了那些你必须显示提供的，包含它的jar。这个工件时可用的，不会在仓库中寻找。
* `import`：这个范围仅支持在依赖类型是`pom`，且在`<dependencyManagement>`元素中。它将被`<dependencyManagement>`中的具体的依赖所取代。

今天就先介绍到这里，如有疑问，欢迎在评论区留言。
