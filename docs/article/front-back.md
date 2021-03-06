## 背景

**登录**是一个网站最基础的功能。有人说它很简单，其实不然，登录逻辑很简单，但涉及知识点比较多，如：
密码加密、cookie、session、token、JWT等。

我们看一下传统的做法，前后端统一在一个服务中：

![image1](../asset/img/fb-1.png)

如图所示，逻辑处理和页面放在一个服务中，用户输入用户名、密码后，后台服务在session中设置登录状态，和用户的一些基本信息，
然后将响应（Response）返回到浏览器（Browser），并设置Cookie。下次用户在这个浏览器（Browser）中，再次
访问服务时，请求中会带上这个Cookie，服务端根据这个Cookie就能找到对应的session，从session中取得用户的信息，从而
维持了用户的登录状态。这种机制被称作Cookie-Session机制。

近几年，随着前后端分离的流行，我们的项目结构也发生了变化，如下图：

![image2](../asset/img/fb-2.png)

我们访问一个网站时，先去请求静态服务，拿到页面后，再异步去后台请求数据，最后渲染成我们看到的带有数据的网站。在这种结构下，
我们的登录状态怎么维持呢？上面的Cookie-Session机制还适不适用？

这里又分两种情况，服务A和服务B在同一域下，服务A和服务B在不同域下。在详细介绍之前，我们先普及一下**浏览器的同源策略**。

## 同源策略

同源策略是浏览器保证安全的基础，它的含义是指，A网页设置的 Cookie，B网页不能打开，除非这两个网页同源。
所谓同源是指：

* 协议相同
* 域名相同
* 端口相同

例如：http://www.a.com/login，协议是`http`，域名是`www.a.com`，端口是`80`。只要这3个相同，我们就可以在请求（Request）时带上Cookie，
在响应（Response）时设置Cookie。

## 同域下的前后端分离

我们了解了浏览器的同源策略，接下来就看一看同域下的前后端分离，首先看服务端能不能设置Cookie，具体代码如下：

后端代码：
```java
@RequestMapping("setCookie")
public String setCookie(HttpServletResponse response){
    Cookie cookie = new Cookie("test","same");
    cookie.setPath("/");
    response.addCookie(cookie);
    return "success";
}
```
我们设置Cookie的path为根目录"/"，以便在该域的所有路径下都能看到这个Cookie。

前端代码：
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>test</title>
    <script src="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.0.js"></script>
    <script>
        $(function () {
            $.ajax({
                url : "/test/setCookie",
                method: "get",
                success : function (json) {
                    console.log(json);
                }
            });
        })
    </script>
</head>
<body>
    aaa
</body>
</html>
```
我们在浏览器访问http://www.a.com:8888/index.html，访问前先设置hosts，**将www.a.com指向我们本机**。访问结果如图所示：

![image3](../asset/img/fb-3.png)

我们可以看到服务器成功设置了Cookie。然后我们再看看同域下，异步请求能不能带上Cookie，代码如下：

后端代码：
```java
@RequestMapping("getCookie")
public String getCookie(HttpServletRequest request,HttpServletResponse response){
    Cookie[] cookies = request.getCookies();
    if (cookies != null && cookies.length >0) {
        for (Cookie cookie : cookies) {
            System.out.println("name:" + cookie.getName() + "-----value:" + cookie.getValue());
        }
    }
    return "success";
}
```
前端代码如下：
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>user</title>
    <script src="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.0.js"></script>
    <script>
        $(function () {
            $.ajax({
                url : "http://www.b.com:8888/test/getCookie",
                method: "get",
                success : function (json) {
                    console.log(json);
                }
            });
        })
    </script>
</head>
<body>

</body>
</html>
```
访问结果如图所示：

![image4](../asset/img/fb-4.png)

再看看后台打印的日志：
```
name:test-----value:same
```
同域下，异步请求时，Cookie也能带到服务端。

**所以，我们在做前后端分离时，前端和后端部署在同一域下，满足浏览器的同源策略，登录不需要做特殊的处理。**

## 不同域下的前后端分离

不同域下，我们的响应（Response）能不能设置Cookie呢？请求时能不能带上Cookie呢？我们实验结果如下，这里就不给大家贴代码了。

![image5](../asset/img/fb-5.png)

由于我们在a.com域下的页面跨域访问b.com的服务，b.com的服务不能设置Cookie。

如果b.com域下有Cookie，我们在a.com域下的页面跨域访问b.com的服务，能不能把b.com的Cookie带上吗？答案是也带不上。那么我们怎么解决
跨域问题呢？

### JSONP解决跨域

JSONP的原理我们可以在[维基百科](https://zh.wikipedia.org/wiki/JSONP)上查看，上面写的很清楚，我们不做过多的介绍。我们改造接口，
在每个接口上增加callback参数：
```java
@RequestMapping("setCookie")
public String setCookie(HttpServletResponse response,String callback){
    Cookie cookie = new Cookie("test","same");
    cookie.setPath("/");
    response.addCookie(cookie);
    if (StringUtils.isNotBlank(callback)){
        return callback+"('success')";
    }
    return "success";
}

@RequestMapping("getCookie")
public String getCookie(HttpServletRequest request,HttpServletResponse response,String callback){
    Cookie[] cookies = request.getCookies();
    if (cookies != null && cookies.length >0) {
        for (Cookie cookie : cookies) {
            System.out.println("name:" + cookie.getName() + "-----value:" + cookie.getValue());
        }
    }
    if (StringUtils.isNotBlank(callback)){
        return callback+"('success')";
    }
    return "success";
}
```
如果callback参数不为空，将返回js函数。前端改造如下：

设置Cookie页面改造如下：
```html
<script>
    $(function () {
        $.ajax({
            url : "http://www.b.com:8888/test/setCookie?callback=?",
            method: "get",
            dataType : 'jsonp',
            success : function (json) {
                console.log(json);
            }
        });
    })
</script>
```
请求Cookie时改造如下：
```html
<script>
    $(function () {
        $.ajax({
            url : "http://www.b.com:8888/test/getCookie?callback=?",
            method: "get",
            dataType : 'jsonp',
            success : function (json) {
                console.log(json);
            }
        });
    })
</script>
```
所有的请求都加了callback参数，请求的结果如下：

![image6](../asset/img/fb-6.png)

**很神奇吧！我们设置了b.com域下的Cookie。** 如果想知道为什么？还是看一看JSONP的原理吧。我们再访问第二个页面，看看Cookie能不能
传到服务。后台打印日志为：
```
name:test-----value:same
```
好了，**不同域下的前后端分离，可以通过JSONP跨域，从而保持登录状态。** 但是，jsonp本身没有跨域安全规范，一般都是后端进行安全限制，
处理不当很容易造成安全问题。

### CORS解决跨域

CORS是一个W3C标准，全称是"跨域资源共享"（Cross-origin resource sharing）。CORS需要浏览器和服务器同时支持。目前，所有浏览器都支持该功能，IE浏览器不能低于IE10。
整个CORS通信过程，都是浏览器自动完成，不需要用户参与。对于开发者来说，CORS通信与同源的AJAX通信没有差别，代码完全一样。
浏览器一旦发现AJAX请求跨源，就会自动添加一些附加的头信息，有时还会多出一次附加的请求，但用户不会有感觉。
如果想要详细理解原理，请参考[维基百科](https://zh.wikipedia.org/wiki/%E8%B7%A8%E4%BE%86%E6%BA%90%E8%B3%87%E6%BA%90%E5%85%B1%E4%BA%AB)

CORS请求默认不发送Cookie和HTTP认证信息。若要发送Cookie，浏览器和服务端都要做设置，咱们要解决的是跨域后的登录问题，所以要允许跨域发送
Cookie。

后端要设置**允许跨域请求的域**和**允许设置和接受Cookie。**
```java
@RequestMapping("setCookie")
@CrossOrigin(origins="http://www.a.com:8888",allowCredentials = "true")
public String setCookie(HttpServletResponse response){
    Cookie cookie = new Cookie("test","same");
    cookie.setPath("/");
    response.addCookie(cookie);
    return "success";
}

@RequestMapping("getCookie")
@CrossOrigin(origins="http://www.a.com:8888",allowCredentials = "true")
public String getCookie(HttpServletRequest request,HttpServletResponse response){
    Cookie[] cookies = request.getCookies();
    if (cookies != null && cookies.length >0) {
        for (Cookie cookie : cookies) {
            System.out.println("name:" + cookie.getName() + "-----value:" + cookie.getValue());
        }
    }
    return "success";
}
```
我们通过`@CrossOrigin`注解允许跨域，`origins`设置了允许跨域请求的域，`allowCredentials`允许设置和接受Cookie。

前端要设置**允许发送和接受Cookie**。
```html
<script>
    $(function () {
        $.ajax({
            url : "http://www.b.com:8888/test/setCookie",
            method: "get",
            success : function (json) {
                console.log(json);
            },
            xhrFields: {
                withCredentials: true
            }
        });
    })
</script>


<script>
    $(function () {
        $.ajax({
            url : "http://www.b.com:8888/test/getCookie",
            method: "get",
            success : function (json) {
                console.log(json);
            },
            xhrFields: {
                withCredentials: true
            }
        });
    })
</script>
```
我们访问页面看一下效果。

![image7](../asset/img/fb-7.png)

**没有Cookie吗？别急，我们再从浏览器的设置里看一下。**

![image8](../asset/img/fb-8.png)

有Cookie了，我们再看看访问能不能带上Cookie，后台打印结果如下：
```html
name:test-----value:same
```
我们使用CORS，也解决了跨域。

## 总结

前后端分离，基于Cookie-Session机制的登录总结如下

* 前后端同域——与普通登录没有区别
* 前后端不同域
    * JSONP方式实现
    * CORS方式实现
    




