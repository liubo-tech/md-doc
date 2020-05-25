# JAVA 11 初体验

随着JAVA每半年发布一次新版本，前几天JAVA 11隆重登场。在JAVA 11中，增加了一些新的特性和api，
同时也删除了一些特性和api，还有一些性能和垃圾回收的改进。

作为一名一线的开发人员，JAVA 11给我们带来哪些便利之处呢？下面我们来体验一下。

## 在Lambda表达式中使用var

本地变量类型var是java 10提出的新概念，它可以从上下文中推断出本地变量的类型，从而提高代码可读性。
我们看看下面的例子：
```java
public class Main {
    public static void main(String[] args) throws Exception {
        URL url = new URL("http://www.oracle.com/");
        URLConnection conn = url.openConnection();
        Reader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream()));
    }
}
```
使用var声明后，上面的代码可以改写成：
```java
public class Main {
    public static void main(String[] args) throws Exception {
        var url = new URL("http://www.oracle.com/");
        var conn = url.openConnection();
        var reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream()));
    }
}
```
我们使用var代替了URL、URLConnection、Reader，提高了代码的可读性，也方便了开发。
但是在JAVA 10中，var变量不能在lambda表达式中声明，在JAVA 11中，解决了这个问题。
我们可以在lambda表达式中使用var，如下：
```
(var x, var y) -> x.process(y)
```
上面的例子等同于
```
(x, y) -> x.process(y)
```
但是我们不能混合使用，下面的两个例子都是错误的：
```
//含蓄型的lambda表达式中，要么全使用var，要么全不使用var
(var x, y) -> x.process(y)

//在lambda表达式中，不能即使用含蓄型，又使用明确型
(var x, int y) -> x.process(y)
```

## 标准化HTTP Client API

以前我们在程序中使用HttpClient时，通常会引入apache的HttpClient工具包。在JAVA 11中，我们可以使用JDK原生的
HttpClient了。
```java
public class HttpTest {
    public static void main(String[] args) throws Exception {
        String uri = "http://www.baidu.com";

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(uri))
                .build();

        HttpResponse<String> response =
                client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println(response.body());
    }
}
```
上面的例子是同步的get请求，还有其他的方法HttpClient也是提供的，例如：
* 异步get
* post提交
* 并发请求
* Get Json
* Post Json

这些例子这里不做详细介绍了，如有需要请参考[官方例子](http://openjdk.java.net/groups/net/httpclient/recipes.html)。
功能很强大吧，我们不用再引入其他的HttpClient的jar包了。

## 总结

对于一线开发者而言，JAVA 11的体验就这么多，如有遗漏，会在以后补充。

