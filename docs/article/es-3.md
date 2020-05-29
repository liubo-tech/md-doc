# ES7学习笔记（三）新建索引

## 与ES的交互方式

与es的交互方式采用http的请求方式，请求的格式如下：

```shell
curl -X<VERB> '<PROTOCOL>://<HOST>:<PORT>/<PATH>?<QUERY_STRING>' -d '<BODY>'
```

* <VERB>是请求的方法，比如：GET、POST、DELETE、PUT等。
* <PROTOCOL> 协议：http或者https。
* <HOST>主机地址。
* <PORT>端口
* <PATH>API的路径。比如查看集群状态：`/_cluster/stats`。
* <QUERY_STRING>参数。比如：?pretty，打印出格式化以后的Json。
* <BODY>请求的内容。比如：添加索引时的数据。

## 创建索引

es创建索引的请求方式如下：

```shell
PUT /<index>
```

* 请求的方法用`PUT`。
* /后面直接跟索引的名称即可。
* 索引的设置和字段都放在Body中。

比如我们创建一个名字叫`组织机构`的索引，这个索引只有两个字段，一个id，一个name。并且这个索引设置为2个分片，2个副本。

我们使用POSTMAN发送请求，如下：

```
http://192.168.73.130:9200/orgnization
```

请求的方法选择`PUT`。然后在请求体（Body）中，写上索引的字段名称，索引的分片数和副本数，如下：

```json
{
    "settings":{
        "number_of_shards":2,
        "number_of_replicas":2
    },
    "mappings":{
        "properties":{
            "id":{
                "type":"long"
            },
            "name":{
                "type":"text"
            }
        }
    }
}
```

我们观察一下，请求体中分为两个部分：`settings`和`mappings`。在`settings`中，我们设置了分片数和副本数。

* `number_of_shards`：分片的数量；
* `number_of_replicas`：副本的数量；

在`mappings`中，我们设置索引的字段，在这里，我们只设置了id和name，id的映射类型是long，name的映射类型是text。这些类型我们会在后续为大家介绍。

请求体写完后，我们点击发送，es返回的结果如下：

```json
{
    "acknowledged": true,
    "shards_acknowledged": true,
    "index": "orgnization"
}
```

说明索引创建成功，索引的名字正是我们在请求中设置的`orgnization`。

然后，我们通过`elasticsearch-head`插件观察一下刚才创建的索引，如图：

![image-20200426110603566](D:\Vue-Project\vue-press\docs\article\es-3.assets\image-20200426110603566.png)

我们可以看到索引`orgnization`已经创建好了，它有2个分片，分别是0和1，并且每个分片都是两个副本。如果我们仔细观察这个图，可以看出`node-130`节点中的0分片，和`node-132`节点中的1分片，它们的边框是加粗的，这说明它们是主节点，而边框没有加粗的节点是从节点，也就是我们说的副本节点。

## 查看索引

如果我们要查看一个索引的设置，可以通过如下请求方式：

```shell
GET /<index>
```

在我们的例子中，查看`orgnization`索引的设置，我们在POSTMAN中发送如下的请求：

![image-20200426154156002](D:\Vue-Project\vue-press\docs\article\es-3.assets\image-20200426154156002.png)

我们可以看到索引的具体设置，比如：mapping的设置，分片和副本的设置。这些和我们创建索引时候的设置是一样的。

## 修改索引

索引一旦创建，我们是无法修改里边的内容的，不如说修改索引字段的名称。但是我们是可以向索引中添加其他字段的，添加字段的方式如下：

```shell
PUT /<index>/_mapping
```

然后在我们的请求体中，写好新添加的字段。比如，在我们的例子当中，新添加一个type字段，它的类型我们定义为long，请求如下：

```
http://192.168.73.130:9200/orgnization/_mapping
```

请求类型要改为`PUT`，请求体如下：

```
{
  "properties": {
    "type": {
      "type": "long"
    }
  }
}
```

我们点击发送，返回的结果如图所示：

![image-20200426162109087](D:\Vue-Project\vue-press\docs\article\es-3.assets\image-20200426162109087.png)

添加索引字段成功，我们再使用`GET`查看一下索引，如图：

![image-20200426162306090](D:\Vue-Project\vue-press\docs\article\es-3.assets\image-20200426162306090.png)

我们可以成功的查询到新添加的索引字段了。

## 删除索引

如果我们要删除一个索引，请求方式如下：

```shell
DELETE /<index>
```

假如我们要删除刚才创建的`orgnization`索引，我们只要把请求的方法改成`DELETE`，然后访问我们索引就可以，

```
http://192.168.73.130:9200/orgnization
```

## 关闭索引

如果索引被关闭，那么关于这个索引的所有读写操作都会被阻断。索引的关闭也很简单，请求方式如下：

```shell
POST /<index>/_close
```

在我们的例子中，如果要关闭索引，降请求方法改成`POST`，然后发送如下请求：

```
http://192.168.73.130:9200/orgnization/_close
```

## 打开索引

与关闭索引相对应的是打开索引，请求方式如下：

```shell
POST /<index>/_open
```

在我们的例子中，如果要打开索引，降请求方法改成`POST`，然后发送如下请求：

```
http://192.168.73.130:9200/orgnization/_open
```

## 冻结索引

冻结索引和关闭索引类似，关闭索引是既不能读，也不能写。而冻结索引是可以读，但是不能写。冻结索引的请求方式如下：

```shell
POST /<index>/_freeze
```

对应我们的例子当中：

```
http://192.168.73.130:9200/orgnization/_freeze
```

## 解冻索引

与冻结索引对应的是解冻索引，方式如下：

```shell
POST /<index>/_unfreeze
```

对应我们的例子：

```
http://192.168.73.130:9200/orgnization/_unfreeze
```

这节内容到这里就结束了。。