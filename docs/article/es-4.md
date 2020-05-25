# ES[7.6.x\]学习笔记（四）字段类型（mapping）

在上一节中，我们创建了索引，在创建索引的时候，我们指定了mapping属性，mapping属性中规定索引中有哪些字段，字段的类型是什么。在mapping中，我们可以定义如下内容：

* 类型为String的字段，将会被全文索引；
* 其他的字段类型包括：数字、日期和geo（地理坐标）；
* 日期类型的格式；
* 动态添加字段的映射规则；

字段的可用类型如下：

* 简单的类型，比如：text，keyword，date，long，double，boolean，ip。我们可以看到，类型当中没有String，字符串的类型是text，所有text类型的字段都会被全文索引。数字类型有两个，long（长整型）和double（浮点型）。
* JSON的层级类型：Object（对象）和Nested（数组对象）。Object类型时，该字段可以存储一个JSON对象；Nested类型时，该字段可以存储一个数组对象。
* 复杂的类型：包括 geo_point、geo_shape和completion。

## 在索引中创建映射

我们在创建索引的时候可以同时创建映射，就如同上一节的内容。也可以在索引创建好以后，再去创建映射，请求的方式如下：

```shell
PUT /my-index
{
  "mappings": {
    "properties": {
      "age":    { "type": "integer" },  
      "email":  { "type": "keyword"  }, 
      "name":   { "type": "text"  }     
    }
  }
}
```

请求的方法我们要使用`PUT`，路径是我们的索引名称，请求体当中是我们为索引添加的字段和字段的类型。

## 在存在的映射中添加字段

正如上面所示，我们在一个索引中添加了字段，但是现在我们要补充额外的字段，这时，我们要怎么做呢？

```shell
PUT /my-index/_mapping
{
  "properties": {
    "employee-id": {
      "type": "keyword",
      "index": false
    }
  }
}
```

我们使用`PUT`方法，后面跟随我们的索引名称，再接上`_mapping`，请求体中是我们新添加的映射字段，我们指定了字段的类型为`keyword`，`index`索引为`false`，说明这个字段只用于存储，不会用于搜索，搜索这个字段是搜索不到的。

我们在更新字段时候，是不能修改字段的类型的。如果我们要修改字段的类型，最好是新建一个新的字段，指定正确的类型，然后再更新索引，以后我们只需要查询这个新增的字段就可以了。

## 查看索引中的字段映射

如果我们要查看已知索引的字段映射，可以向ES发送如下的请求：

```shell
GET /my-index/_mapping
```

请求的方法是`GET`，请求的路径是我们索引的名称`my-index`，再加上一个`_mapping`，得到的返回结果如下：

```json
{
  "my-index" : {
    "mappings" : {
      "properties" : {
        "age" : {
          "type" : "integer"
        },
        "email" : {
          "type" : "keyword"
        },
        "employee-id" : {
          "type" : "keyword",
          "index" : false
        },
        "name" : {
          "type" : "text"
        }
      }
    }
  }
}
```

返回的结果中，我们可以看到索引的名称`my-index`，还有我们添加的字段，也包括后续补充的`employee-id`字段。

好了，关于索引的字段映射就先给大家介绍到这里。