## 一、简介

今天我们将介绍一些nginx的简单应用，启动、停止nginx，重载nginx的配置，nginx配置文件的格式，如何配置nginx服务静态资源，如何配置nginx作为反向代理服务器。

nginx有一个主进程和几个工作进程。主进程主要是读取和解析配置文件，以及保持工作进程工作；工作进程处理实际的请求。nginx利用基于事件的模型和运行的操作系统在工作进程之间有效地分配请求。工作进程的个数在配置文件中定义，推荐设置为CPU的核数。

nginx配置文件中的配置决定了nginx如何工作，配置文件的名字一般叫做nginx.conf，它的目录是/usr/local/nginx/conf，/etc/nginx或者/usr/local/etc/nginx。


## 二、nginx的启动、停止、和重载配置

想要运行nginx，运行可执行文件即可。

```shell
/usr/sbin/nginx
```

nginx一旦运行起来，它就可以使用-s参数控制，语法格式如下：

```shell
nginx -s signal
```

signal的列表如下：
+ stop 快速关闭
+ quit　　 优雅的关闭
+ reload 重载配置文件
+ reopen 重新打开log文件

例如，等nginx进程处理完当前的所有请求后，停止nginx进程，命令如下：

`nginx -s quit`

如果修改了nginx配置文件，并且想要配置文件生效，应当执行如下命令：

`nginx -s reload`

当主进程接收到reload命令时，它会检查新配置文件的语法并尝试应用新的配置文件，如果成功了，主进程会启动新的工作进程并且发送消息停止旧的工作进程；如果配置文件有错误，主进程将回滚并继续使用旧的配置文件工作。旧的工作进程收到关闭命令后，停止接受新的请求，并且直到当前的所有请求被处理完后，旧的工作进程关闭。

-s参数也可以通过unix命令发送给nginx进程。这种情况下，-s参数通过给定的nginx进程id发送给nginx进程。nginx进程id一般写在nginx.pid文件中，目录通常在/usr/local/nginx/logs 或者 /var/run。例如：如果nginx的主进程id是1628，想要优雅的关闭nginx，可执行以下命令：`

`kill -s QUIT 1628`

获取当前正在运行的nginx进程，可执行如下命令：

`ps -ax | grep nginx`

## 三、配置文件的结构

nginx的配置文件由多个指令集组成，指令集分为简单指令和模块指令。简单的指令由名字和参数组成，由空格和分号（；）隔开。块指令和简单指令有着相同的结构，但是“；”被“{}”取代，如果块指令中还有其他的块指令，它被称作上下文（context）。例如：events，http，server，location。

\#后面的文件是注释。

## 四、服务静态内容

nginx的一个重要的功能就是服务静态文件（例如：图片和静态html）。在这里，我们举一个例子，根据不同的请求，提供不同的文件服务，本地的目录为/data/www，该目录存放html文件，/data/image存放图片文件。我们需要修改配置文件，在http块中增加一个server块，在server块中增加连个location块。

首先，我们在/data/www目录下创建一个html文件，在文件中随意写一些内容，并且在/data/image目录下随机放一些图片。

接下来，我们打开配置文件，文件中默认写了一些server的例子，我们将其全部注释掉。从现在开始，我们新加一个server块，如下：

```shell
http {
    server {
    }
}
```
通常情况下，配置文件中，包含多个server块，它们通过监听不同的端口和服务名称区分。一旦nginx决定哪个server处理请求，它就会监测请求头中的URI，和server块中的location指令中的参数是否一致。

向server块中添加location块，如下：

```shell
location / {
    root /data/www;
}
```

location块中指定“/”为前缀和请求中的URI进行比较，匹配的请求，URI将会被加入到root指令集中指定的路径，“/data/www”，生成一个访问本地文件系统的文件请求路径。上面的location提供了一个最小的前缀，当其他的location块都不匹配时，这个location将被使用。

下面，我们加入第二个块，如下：

```shell
location /images/ {
    root /data;
}
```

它将匹配所有以“/images/”开头的请求，location / 也匹配这样的请求，但是只是最小的匹配。

配置的最终结果如下：

```shell
server {
    location / {
        root /data/www;
    }

    location /images/ {
        root /data;
    }
}
```
这是一个可以工作的配置，它监听80端口，并且可以通过本机的http://localhost/ 访问。以/images/开头的请求，服务将从/data/images目录发送文件。例如：请求http://localhost/images/example.png， 将会以/data/images/example.png文件作为响应。如果这个文件不存在，将会返回404错误。请求的URI不是以/images/开头的，将会映射到/data/www目录中，例如：http://locahost/some/example.html将会映射到/data/www/some/example.html。

要使配置生效，直接启动nginx（没有启动）或重载配置文件
```shell
nginx -s reload
```
如果nginx没有向配置的那样工作，你可以在access.log和error.log中找到原因，日志的目录 /usr/local/nginx/logs 或者 /var/log/nginx。

## 五、设置一个简单的代理服务器

nginx作为代理服务器使用是比较频繁的，它接受请求，分发它们到被代理的服务器，取回响应，并把它们发送给客户端。

我们将配置一个基本的代理，它从本地目录服务图片请求，发送其他的请求到被代理的服务器，在本例中，两个server将在一个nginx实例中配置。

首先，通过新加一个server块定义被代理的服务，如下：
```shell
server {
    listen 8080;
    root /data/up1;

    location / {
    }
}
```
这是一个简单的服务，它监听8080端口（上一个server中，listen并没有指定，它监听默认的端口80），它映射所有的请求到本地文件系统/data/up1目录。创建这个目录并新建
index.html文件。值得注意的是，在server上下文中配置root，当请求选中的location块中，没有root指令时，将会使用server中配置的root。

接下来，我们修改先前的server块，使他成为一个代理服务器配置。在第一个location块中，我们添加proxy_pass指令，它的参数为http://localhost:8080，如下：

```shell
server {
    location / {
        proxy_pass http://localhost:8080;
    }

    location /images/ {
        root /data;
    }
}
```
我们将修改第二个location块，它现在映射以/images/开头的请求到/data/images目录。我们修改其为通过文件扩展名匹配的方式，匹配请求。如下：
```shell
location ~ \.(gif|jpg|png)$ {
    root /data/images;
}
```

这个参数是一个正则表达式，它匹配所有以.gif，jpg，png结尾的请求，在正则表达式之前必须出现“~”。匹配的请求将映射到/data/images目录。

当nginx为一个请求选择服务块时，它首先检查指定前缀的location，并记住最长的前缀，然后检查指定正则表达式的location，如果请求匹配了正则表达式，nginx将选择这个location服务请求，否则，将选择先前记住的最长的前缀location。

代理服务的server配置如下：
```shell
server {
    location / {
        proxy_pass http://localhost:8080/;
    }

    location ~ \.(gif|jpg|png)$ {
        root /data/images;
    }
}
```

这个服务将过滤以.gif，.jpg，.png结尾的请求，并将它们映射到/data/images目录，其他的请求将被转发到前面配置的被代理的服务。
要是配置生效，reload配置即可。

 

至此，nginx的基本配置介绍完了，如有问题，欢迎大家提问~~