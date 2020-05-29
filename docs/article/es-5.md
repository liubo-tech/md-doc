# ES7学习笔记（五）动态映射

通常情况下，我们使用ES建立索引的步骤是，先创建索引，然后定义索引中的字段以及映射的类型，然后再向索引中导入数据。而动态映射是ES中一个非常重要的概念，你可以直接向文档中导入一条数据，与此同时，索引、字段、字段类型都会自动创建，无需你做其他的操作。这就是动态映射的神奇之处。

## 动态字段映射

ES的动态映射默认是开启的，动态映射的默认规则如下：

| JSON的数据类型 | ES中的数据类型                                           |
| -------------- | -------------------------------------------------------- |
| null           | 不会映射字段                                             |
| true 或 false  | boolean类型                                              |
| 浮点型数字     | float                                                    |
| 整型数字       | long                                                     |
| JSON对象       | Object                                                   |
| 数组           | 第一个非空值得类型                                       |
| String         | 1、如果满足日期类型的格式，映射为日期类型                |
|                | 2、如果满足数字型的格式，映射为long或者float             |
|                | 3、如果就是字符串，会映射为一个text类型和一个keyword类型 |

接下来我们看看动态映射的一个例子，我们直接向`dynamic-index`索引中存放一条数据，注意，`dynamic-index`这个索引我们没有创建过，直接存放数据，索引会自动创建。接下来，我们看一下具体的请求：

```shell
PUT /dynamic-index/_doc/1
{
  "my_null": null,
  "my_boolean": false,
  "my_float": 1.56,
  "my_long": 3,
  "my_object": {
  	"my_first": "first value",
  	"my_second": "second_value"
  },
  "my_array": [1,2,3],
  "my_date_1": "2020-05-01",
  "my_date_2": "2020/05/01 12:03:03",
  "my_date_3": "05/01/2020",
  "my_string_long": "1",
  "my_string_float": "4.6",
  "my_string": "中华人民共和国"
}
```

请求执行成功以后，我们先看一下索引的类型：

```shell
GET /dynamic-index/_mapping
```

返回的结果如下：

```json
{
    "dynamic-index": {
        "mappings": {
            "properties": {
                "my_array": {
                    "type": "long"
                },
                "my_boolean": {
                    "type": "boolean"
                },
                "my_date_1": {
                    "type": "date"
                },
                "my_date_2": {
                    "type": "date",
                    "format": "yyyy/MM/dd HH:mm:ss||yyyy/MM/dd||epoch_millis"
                },
                "my_date_3": {
                    "type": "text",
                    "fields": {
                        "keyword": {
                            "type": "keyword",
                            "ignore_above": 256
                        }
                    }
                },
                "my_float": {
                    "type": "float"
                },
                "my_long": {
                    "type": "long"
                },
                "my_object": {
                    "properties": {
                        "my_first": {
                            "type": "text",
                            "fields": {
                                "keyword": {
                                    "type": "keyword",
                                    "ignore_above": 256
                                }
                            }
                        },
                        "my_second": {
                            "type": "text",
                            "fields": {
                                "keyword": {
                                    "type": "keyword",
                                    "ignore_above": 256
                                }
                            }
                        }
                    }
                },
                "my_string": {
                    "type": "text",
                    "fields": {
                        "keyword": {
                            "type": "keyword",
                            "ignore_above": 256
                        }
                    }
                },
                "my_string_float": {
                    "type": "text",
                    "fields": {
                        "keyword": {
                            "type": "keyword",
                            "ignore_above": 256
                        }
                    }
                },
                "my_string_long": {
                    "type": "text",
                    "fields": {
                        "keyword": {
                            "type": "keyword",
                            "ignore_above": 256
                        }
                    }
                }
            }
        }
    }
}
```

返回的结果比较长，我们把每一个字段都看一下，看看动态映射的字段是否达到了我们的预期：

| 字段            | 映射结果 | 是否达到预期 | 原因                                 |
| --------------- | -------- | ------------ | ------------------------------------ |
| my_null         | 没有映射 | 是           | null值不映射                         |
| my_boolean      | boolean  | 是           |                                      |
| my_float        | float    | 是           |                                      |
| my_long         | long     | 是           |                                      |
| my_object       | object   | 是           | my_object里自动生成了两个字段的映射  |
| my_array        | long     | 是           | 数组中的数字是long型                 |
| my_date_1       | date     | 是           |                                      |
| my_date_2       | date     | 是           |                                      |
| my_date_3       | text     | 否           | 没有指定这种日期格式，所以映射为text |
| my_string_long  | text     | 否           | 数字探测默认关闭，没有打开           |
| my_string_float | text     | 否           | 数字探测默认关闭，没有打开           |
| my_string       | text     | 是           | 普通字符串，映射为text               |

下面我们把数字探测打开，执行如下请求：

```shell
PUT /dynamic-index
{
  "mappings": {
    "numeric_detection": true
  }
}
```

由于我们的索引`dynamic-index`中，存在了映射关系，再进行设置是会报错的，所以我们要将索引删除，执行如下请求：

```shell
DELETE /dynamic-index
```

索引删除成功后，再执行前面的设置，执行成功，数字探测已经打开。然后再添加一种日期格式`MM/dd/yyyy`，请求如下：

```shell
PUT /dynamic-index
{
  "mappings": {
    "dynamic_date_formats": ["MM/dd/yyyy"]
  }
}
```

执行报错，错误信息和之前一样，看来日期的设置要和数字探测一起才行，我们再将索引删除，然后再发送请求，两个设置一起：

```shell
PUT /dynamic-index
{
  "mappings": {
    "numeric_detection": true,
    "dynamic_date_formats": ["MM/dd/yyyy"]
  }
}
```

执行成功，我们再发送之前创建索引数据的请求

```shell
PUT /dynamic-index/_doc/1
{
  "my_null": null,
  "my_boolean": false,
  "my_float": 1.56,
  "my_long": 3,
  "my_object": {
  	"my_first": "first value",
  	"my_second": "second_value"
  },
  "my_array": [1,2,3],
  "my_date_1": "2020-05-01",
  "my_date_2": "2020/05/01 12:03:03",
  "my_date_3": "05/01/2020",
  "my_string_long": "1",
  "my_string_float": "4.6",
  "my_string": "中华人民共和国"
}
```

执行成功，我们再看一下索引的映射，

```json
"my_string_float": {
    "type": "float"
},
"my_string_long": {
    "type": "long"
}
"my_date_1": {
    "type": "text",
    "fields": {
        "keyword": {
            "type": "keyword",
            "ignore_above": 256
        }
    }
},
"my_date_2": {
    "type": "text",
    "fields": {
        "keyword": {
            "type": "keyword",
            "ignore_above": 256
        }
    }
},
"my_date_3": {
    "type": "date",
    "format": "MM/dd/yyyy"
},
```

我们重点看一下以上几个字段，`my_string_float`和`my_string_long`映射成我们想要的类型了，由于我们开启了数字探测。再看看我们映射的3个日期类型，咦？只有`my_date_3`映射了日期类型，其他两个都是映射成了text类型，这是由于我们在设置`dynamic_date_formats`时，只指定了一种格式。我们只需要把其他两种类型的日期格式也加上就可以了。

```json
{
  "mappings": {
    "numeric_detection": true,
    "dynamic_date_formats": ["MM/dd/yyyy","yyyy/MM/dd HH:mm:ss","yyyy-MM-dd"]
  }
}
```

这里就不给大家具体演示了，有兴趣的小伙伴去尝试一下吧。

**动态字段**是ES中一个非常重要的功能，它给我们带来了极大的方便，也省去了我们在开发时创建索引字段的时间，真是事半功倍，小伙伴们要好好掌握哦~~