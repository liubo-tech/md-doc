## 一、简介

上一篇文章我们介绍了nginx的基础应用，其中讲到了nginx作为代理服务器的使用，但是漏了一个重要的，也是使用非常普遍的特性——负载均衡。今天，我们将这段内容补上。

通过多个实例进行负载均衡是一个比较常用的技术，它用来是资源利用最大化、提高通过率、降低延迟响应、确保容灾等。

## 二、负载均衡的方法

+ 轮询——应用服务器间的请求按照轮询的方式分配；
+ 最小连接数——下一个请求将会分配给当前连接数最小的服务器；
+ ip哈希——以一种哈希的方式决定下一个请求分配到哪个服务器上（基于客户端的ip进行哈希）。

## 三、默认的负载均衡配置

nginx最简单的负载均衡配置如下：
```shell
http {
    upstream myapp1 {
        server srv1.example.com;
        server srv2.example.com;
        server srv3.example.com;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://myapp1;
        }
    }
}
```
上面的例子中，有3个相同的实例运行在srv1-srv3上。当负载均衡的方法没有特别指定时，它将默认使用轮询的方式。所有的请求都会被代理到服务组myapp1上，nginx将应用HTTP的负载均衡分配请求。

nginx的反向代理实现包含负载均衡的种类：HTTP、HTTPS、FastCGI、uwsgi、SCGI和缓存等。

如果要用HTTPS的负载均衡，只需要使用HTTPS的协议即可。

当为FastCGI、uwsgi、SCGI和缓存设置负载均衡时，使用相应的fastcgi_pass、uwsgi_pass、scgi_pass和memcached_pass的指令集即可，这里不做详细介绍。

## 四、最小连接负载均衡

另外一个负载连接方式是最小连接。最小连接的方式可以使应用实例间的负载更公平，例如在一些请求需要花费更长时间去完成的情况。

使用最小连接的方式，nginx不会将过多的请求分配到一个比较忙的应用服务上，它将把请求分配到相对不忙的应用服务上。

最小连接的负载均衡方式在nginx中的配置如下，它作为服务组中的一个配置出现：
```shell
upstream myapp1 {
        least_conn;
        server srv1.example.com;
        server srv2.example.com;
        server srv3.example.com;
    }
```
## 五、会话保持的方式

在介绍这种方式之前，大家先记住，使用轮询和最小连接的负载均衡方式，同一客户端的下一个请求有可能分配到不同的应用服务上。这两种方式不能保证同一客户端的请求总是分配到同一个服务上。

如果需要将一个客户端绑定到一个特殊的应用服务上，换句话说，使客户端的会话“粘连”或“保持”，就要使用“ip-hash”的负载均衡机制了。

使用ip-hash，客户端的ip用来做哈希的key，决定着选择服务组中的哪个应用服务这个客户端的请求。这种方法决定了相同客户端的请求总是分配给相同的服务，除非这个服务不可用了。

配置ip-hash的负载均衡，只需要将ip-hash指令添加到服务组（upstream）中，如下：
```shell
upstream myapp1 {
    ip_hash;
    server srv1.example.com;
    server srv2.example.com;
    server srv3.example.com;
}
```
## 六、负载均衡的权重

通过使用服务权重，可以进一步影响负载均衡的逻辑。上面的例子中，没有配置权重的意思是，所有指定的服务将被看做有相同的权重。

采用轮询的方式，如果有足够的请求，并且请求通过统一的方式处理并且快速的完成的情况下，它仍然意味着在服务之间或多或少的公平的分配。

当weight参数为一个服务指定时，它将是负载均衡过程中的一部分。
```shell
upstream myapp1 {
        server srv1.example.com weight=3;
        server srv2.example.com;
        server srv3.example.com;
    }
```
上面的配置中，每5个应用请求将分配如下：3个请求分配个srv1，1个请求分配给srv2，另一个请求分配给srv3。在nginx最近的版本中，在最小连接和ip-hash的负载均衡方式中使用权重（weight）也是有可能的。

## 七、健康检查

nginx的反向代理包括带内（或被动）的健康检查。如果一个服务的响应是失败的，nginx将会标记这个服务是失败的，并且在短暂的时间内，避免为下一个请求选择这个服务。

max_fails指令设置是，在fail_timeout时间内，尝试和这台服务连续通信失败的次数。默认情况下，max_fails设置为1，当设置为0时，这个服务的健康检查将失效。fail_timeout参数定义了这个服务多长时间会被标记为失效，在服务失败的fail_timeout间隔后，nginx使用活的客户端请求优雅的探测服务，如果探测成功了，这个服务将会标记为成功的。

至此，nginx用的最多的，也是最常用的部分——负载均衡 讲完了，欢迎大家拍砖~~

