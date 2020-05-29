# ES7学习笔记（八）数据的增删改

在前面几节的内容中，我们学习索引、字段映射、分析器等，这些都是使用ES的基础，就像在数据库中创建表一样，基础工作做好以后，我们就要真正的使用它了，这一节我们要看看怎么向索引里写入数据、修改数据、删除数据，至于搜索嘛，因为ES的主要功能就是搜索，所以搜索的相关功能我们后面会展开讲。

## Document的创建与更新

索引中的数据叫做document，和数据中的一条记录是一样的，而索引就像数据库中的一张表，我们向索引中添加数据，就像在数据库表中添加一条记录一样。下面我们看看怎么向索引中添加数据，

```shell
PUT /<index>/_doc/<_id>

POST /<index>/_doc/

PUT /<index>/_create/<_id>

POST /<index>/_create/<_id>
```

在这个POST请求中，`<index>`也就是索引的名字是必须的，这就好比我们向数据库中插入记录，要知道往哪张表里插是一样的。`<index>`后面可以是`_doc`或者`_create`，这两个是什么意思呢？咱们慢慢看，除了这两个区别以外，再有就是请求的方法了，分为`POST`和`PUT`两种。一般情况下，`POST`用于数据的插入，`PUT`用户数据的修改，是不是这样呢？咱们把这4种方式都试一下，首先我们看一下`POST /<index>/_doc/`这种方式的请求，

```json
POST /ik_index/_doc
{
  "id": 1,
  "title": "苹果",
  "desc": "苹果真好吃"
}
```

在这里，索引我们使用的是上一节创建的`ik_index`，执行一下。然后我们再查询一下这个索引，

```shell
GET /ik_index/_search
```

返回结果如下：

```json
{
    "took": 1000,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 2,
            "relation": "eq"
        },
        "max_score": 1,
        "hits": [
            {
                "_index": "ik_index",
                "_type": "_doc",
                "_id": "1",
                "_score": 1,
                "_source": {
                    "id": 1,
                    "title": "大兴庞各庄的西瓜",
                    "desc": "大兴庞各庄的西瓜真是好吃，脆沙瓤，甜掉牙"
                }
            },
            {
                "_index": "ik_index",
                "_type": "_doc",
                "_id": "fEsN-HEBZl0Dh1ayKWZb",
                "_score": 1,
                "_source": {
                    "id": 1,
                    "title": "苹果",
                    "desc": "苹果真好吃"
                }
            }
        ]
    }
}
```

我们重点看一下`hits`，这是我们查询出的结果，第一条是我们上一节存入的数据，不用管它。我们看一下第二条记录，注意一下`_id`这个字段，这个`_id`是这条记录在索引里的唯一标识，在插入数据的请求中，我们没有指定这个id，ES给我们自动生成了`fEsN-HEBZl0Dh1ayKWZb`。那么我们可不可以指定呢？试一下，

```shell
POST /ik_index/_doc/2
{
  "id": 1,
  "title": "香蕉",
  "desc": "香蕉真好吃"
}
```

注意我们发送的请求，`_doc`后面加了`2`，这样就指定了id，执行一下。然后再次查询，返回的结果中，我们只截取`hits`的部分，如下：

```json
"hits": [
            {
                "_index": "ik_index",
                "_type": "_doc",
                "_id": "1",
                "_score": 1,
                "_source": {
                    "id": 1,
                    "title": "大兴庞各庄的西瓜",
                    "desc": "大兴庞各庄的西瓜真是好吃，脆沙瓤，甜掉牙"
                }
            },
            {
                "_index": "ik_index",
                "_type": "_doc",
                "_id": "fEsN-HEBZl0Dh1ayKWZb",
                "_score": 1,
                "_source": {
                    "id": 1,
                    "title": "苹果",
                    "desc": "苹果真好吃"
                }
            },
            {
                "_index": "ik_index",
                "_type": "_doc",
                "_id": "2",
                "_score": 1,
                "_source": {
                    "id": 1,
                    "title": "香蕉",
                    "desc": "香蕉真好吃"
                }
            }
        ]
```

我们看到插入的`香蕉`记录，它的`_id`是`2`。那么`POST`请求中指定的id在索引中存在，会是什么情况呢？我们再看一下，

```shell
POST /ik_index/_doc/1
{
  "id": 1,
  "title": "香蕉",
  "desc": "香蕉真好吃"
}
```

还是`香蕉`这条数据，我们指定id=1，id=1这条数据在索引中是存在的，我们执行一下，然后查询，返回的结果如下：

```json
"hits": [
            {
                "_index": "ik_index",
                "_type": "_doc",
                "_id": "fEsN-HEBZl0Dh1ayKWZb",
                "_score": 1,
                "_source": {
                    "id": 1,
                    "title": "苹果",
                    "desc": "苹果真好吃"
                }
            },
            {
                "_index": "ik_index",
                "_type": "_doc",
                "_id": "2",
                "_score": 1,
                "_source": {
                    "id": 1,
                    "title": "香蕉",
                    "desc": "香蕉真好吃"
                }
            },
            {
                "_index": "ik_index",
                "_type": "_doc",
                "_id": "1",
                "_score": 1,
                "_source": {
                    "id": 1,
                    "title": "香蕉",
                    "desc": "香蕉真好吃"
                }
            }
        ]
```

我们看到之前的那条数据被修改了，所以，关于**`POST /<index>/_doc/<_id>`**，这种添加数据的方式，我们得出结论如下：

* <_id>不指定时，ES会为我们自动生成id；
* 指定<_id>时，**且id在索引中不存在**，ES将添加一条指定id的数据；
* 指定<_id>时，**但id在索引中存在**，ES将会更新这条数据；

接下来我们再看看`_doc`方式的`PUT`请求方式，我们先不指定id，看看会是什么情况，请求如下：

```shell
PUT /ik_index/_doc
{
  "id": 1,
  "title": "葡萄",
  "desc": "葡萄真好吃"
}
```

执行一下，返回如下结果：

```json
{
    "error": "Incorrect HTTP method for uri [/ik_index/_doc] and method [PUT], allowed: [POST]",
    "status": 405
}
```

错误信息说我们的请求不对，让我们使用`POST`请求，看来`PUT`请求不指定id是不行的。我们再看看指定一个不存在的id，是什么情况，如下：

```shell
PUT /ik_index/_doc/3
{
  "id": 1,
  "title": "葡萄",
  "desc": "葡萄真好吃"
}
```

执行成功，再查询一下，

```json
"hits": [
            ……
            {
                "_index": "ik_index",
                "_type": "_doc",
                "_id": "3",
                "_score": 1,
                "_source": {
                    "id": 1,
                    "title": "葡萄",
                    "desc": "葡萄真好吃"
                }
            }
        ]
```

数据添加成功。再看看指定一个存在的id是什么情况，那当然是修改了，我们再试一下，

```shell
PUT /ik_index/_doc/3
{
  "id": 1,
  "title": "橘子",
  "desc": "橘子真好吃"
}
```

执行成功，再查询一下，

```json
"hits": [
            ……
            {
                "_index": "ik_index",
                "_type": "_doc",
                "_id": "3",
                "_score": 1,
                "_source": {
                    "id": 1,
                    "title": "橘子",
                    "desc": "橘子真好吃"
                }
            }
        ]
```

没有问题，修改成功。**`POST /<index>/_doc/<_id>`**这种方式的总结如下：

* `<_id>`必须指定，不指定会报错；
* `<_id>`在索引中不存在，为添加新数据；
* `<_id>`在索引中存在，为修改数据；

`_doc`这种请求的`POST`和`PUT`都尝试过了，再看看`_create`这种请求，先看看不指定id是什么情况，如下：

```shell
POST /ik_index/_create
{
  "id": 1,
  "title": "桃子",
  "desc": "桃子真好吃"
}
```

返回错误信息如下：

```json
{
    "error": {
        "root_cause": [
            {
                "type": "invalid_type_name_exception",
                "reason": "mapping type name [_create] can't start with '_' unless it is called [_doc]"
            }
        ],
        "type": "invalid_type_name_exception",
        "reason": "mapping type name [_create] can't start with '_' unless it is called [_doc]"
    },
    "status": 400
}
```

具体内容我们也不去解读了，总之是不可以，然后加个索引中不存在id试一下，

```shell
POST /ik_index/_create/4
{
  "id": 1,
  "title": "桃子",
  "desc": "桃子真好吃"
}
```

返回结果创建成功，查询如下：

```json
"hits": [
            ……
            {
                "_index": "ik_index",
                "_type": "_doc",
                "_id": "4",
                "_score": 1,
                "_source": {
                    "id": 1,
                    "title": "桃子",
                    "desc": "桃子真好吃"
                }
            }
        ]
```

如果id在索引中存在呢？再试，

```shell
POST /ik_index/_create/3
{
  "id": 1,
  "title": "桃子",
  "desc": "桃子真好吃"
}
```

返回错误：

```json
{
    "error": {
        "root_cause": [
            {
                "type": "version_conflict_engine_exception",
                "reason": "[3]: version conflict, document already exists (current version [2])",
                "index_uuid": "W2X_riHIT4u678p8HZwnEg",
                "shard": "0",
                "index": "ik_index"
            }
        ],
        "type": "version_conflict_engine_exception",
        "reason": "[3]: version conflict, document already exists (current version [2])",
        "index_uuid": "W2X_riHIT4u678p8HZwnEg",
        "shard": "0",
        "index": "ik_index"
    },
    "status": 409
}
```

大致的意思是，数据已经存在了，不能再添加新记录，看来`_create`这种方式还是比较严格的，总结如下：

* id必须指定；
* 指定的id如果在索引中存在，报错，添加不成功；
* 指定的id在索引中不存在，添加成功，符合预期；

再看看`_create`的`PUT`，应该和`POST`正好相反吧？我们试一下，先不指定id，试一下，

```shell
PUT /ik_index/_create
{
  "id": 1,
  "title": "火龙果",
  "desc": "火龙果真好吃"
}
```

返回错误，不指定id肯定是不行的，错误信息就不给大家贴出来了，然后再指定一个不存在的id，

```shell
PUT /ik_index/_create/5
{
  "id": 1,
  "title": "火龙果",
  "desc": "火龙果真好吃"
}
```

创建成功，查询结果就不给大家展示了，然后再换一个存在的id，如下：

```shell
PUT /ik_index/_create/4
{
  "id": 1,
  "title": "火龙果",
  "desc": "火龙果真好吃"
}
```

返回了错误的信息，如下，和`POST`请求是一样的，

```json
{
    "error": {
        "root_cause": [
            {
                "type": "version_conflict_engine_exception",
                "reason": "[4]: version conflict, document already exists (current version [1])",
                "index_uuid": "W2X_riHIT4u678p8HZwnEg",
                "shard": "0",
                "index": "ik_index"
            }
        ],
        "type": "version_conflict_engine_exception",
        "reason": "[4]: version conflict, document already exists (current version [1])",
        "index_uuid": "W2X_riHIT4u678p8HZwnEg",
        "shard": "0",
        "index": "ik_index"
    },
    "status": 409
}
```

我们得出如下的结论：

* `_create`这种形式的`POST`和`PUT`是一样的，没有区别；
* id必须指定；
* id必须在索引中不存在；

## Document的删除

有了添加，肯定会有删除，删除的方式很简单，请求格式如下：

```shell
DELETE /<index>/_doc/<_id>
```

发送`delete`请求，指定数据的id，就可以了，我们试一下，删除刚刚添加的`火龙果`数据，它的id是`5`，我们发送请求如下：

```shell
DELETE /ik_index/_doc/5
```

执行成功，数据被成功的删除。

## 根据id查询Document

根据id查询数据也很简单，发送如下请求就可以完成查询，

```shell
GET <index>/_doc/<_id>
```

我们需要指定索引的名称，以及要查询数据的id，如下：

```shell
GET ik_index/_doc/3
```

返回结果如下：

```json
{
    "_index": "ik_index",
    "_type": "_doc",
    "_id": "3",
    "_version": 2,
    "_seq_no": 5,
    "_primary_term": 3,
    "found": true,
    "_source": {
        "id": 1,
        "title": "橘子",
        "desc": "橘子真好吃"
    }
}
```

根据id成功的查询出来结果。

好了~ 到这里，ES数据的增删改都介绍了，下节开始，我们看看ES的核心功能——搜索。