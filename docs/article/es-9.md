# ES7学习笔记（九）搜索

搜索是ES最最核心的内容，没有之一。前面章节的内容，索引、动态映射、分词器等都是铺垫，最重要的就是最后点击搜索这一下。下面我们就看看点击搜索这一下的背后，都做了哪些事情。

## 分数（score）

ES的搜索结果是按照相关分数的高低进行排序的，咦？！ 怎么没说搜索先说搜索结果的排序了？咱们这里先把这个概念提出来，因为在搜索的过程中，会计算这个分数。这个分数代表了这条记录匹配搜索内容的相关程度。分数是一个浮点型的数字，对应的是搜索结果中的`_score`字段，分数越高代表匹配度越高，排序越靠前。

在ES的搜索当中，分为两种，一种计算分数，而另外一种是不计算分数的。

## 查询（query context）

查询，代表的是这条记录与搜索内容匹配的怎么样，除了决定这条记录是否匹配外，还要计算这条记录的相关分数。这个和咱们平时的查询是一样的，比如我们搜索一个关键词，分词以后匹配到相关的记录，这些相关的记录都是查询的结果，那这些结果谁排名靠前，谁排名靠后呢？这个就要看匹配的程度，也就是计算的分数。

## 过滤（filter context）

过滤，代表的含义非常的简单，就是YES or NO，这条记录是否匹配查询条件，**它不会计算分数**。频繁使用的过滤还会被ES加入到缓存，以提升ES的性能。下面我们看一个查询和过滤的例子，这个也是ES官网中的例子。

```shell
GET /_search
{
  "query": { 
    "bool": { 
      "must": [
        { "match": { "title":   "Search"        }},
        { "match": { "content": "Elasticsearch" }}
      ],
      "filter": [ 
        { "term":  { "status": "published" }},
        { "range": { "publish_date": { "gte": "2015-01-01" }}}
      ]
    }
  }
}
```

我们看一下请求的路径`/_search`，这个是请求的路径，而请求的方法是`GET`，我们再看请求体中，有一个`query`，这个代表着查询的条件。而`bool`中的`must`被用作`query context`，它在查询的时候会计算记录匹配的相关分数。`filter`中的条件用作过滤，只会把符合条件的记录检索出来，不会计算分数。

## 组合查询

组合查询包含了其他的查询，像我们前面提到的`query context`和`filter context`。在组合查询中，分为很多种类型，我们挑重点的类型给大家介绍一下。

### Boolean Query

boolean查询，前面我们写的查询语句就是一个boolean查询，boolean查询中有几个关键词，表格如下：

| 关键词   | 描述                             |
| -------- | -------------------------------- |
| must     | 必须满足的条件，而且会计算分数， |
| filter   | 必须满足的条件，不会计算分数     |
| should   | 可以满足的条件，会计算分数       |
| must_not | 必须不满足的条件，不会计算分数   |

我们看看下面的查询语句：

```shell
POST _search
{
  "query": {
    "bool" : {
      "must" : {
        "term" : { "user" : "kimchy" }
      },
      "filter": {
        "term" : { "tag" : "tech" }
      },
      "must_not" : {
        "range" : {
          "age" : { "gte" : 10, "lte" : 20 }
        }
      },
      "should" : [
        { "term" : { "tag" : "wow" } },
        { "term" : { "tag" : "elasticsearch" } }
      ],
      "minimum_should_match" : 1,
      "boost" : 1.0
    }
  }
}
```

上面的查询是一个典型的boolean组合查询，里边的关键词都用上了。很多小伙伴们可能对`must`和`should`的区别不是很了解，`must`是必须满足的条件，我们的例子中`must`里只写了一个条件，如果是多个条件，那么里边的所有条件必须满足。而`should`就不一样了，`should`里边现在列出了两个条件，并不是说这两个条件必须满足，到底需要满足几个呢？我们看一下下面的关键字`minimum_should_match`，从字面上我们就可以看出它的含义，最小`should`匹配数，在这里设置的是1，也就是说，`should`里的条件只要满足1个，就算匹配成功。在boolean查询中，如果存在一个`should`条件，而没有`filter`和`must`条件的话，那么`minimum_should_match`的默认值是1，其他情况默认值是0。

我们再看一个实际的例子吧，还记得前面我们创建的`ik_index`索引吗？索引中存在着几条数据，数据如下：

| _index   | _type | _id                  | ▲_score | id   | title | desc       |
| :------- | :---- | :------------------- | :------ | :--- | :---- | :--------- |
| ik_index | _doc  | fEsN-HEBZl0Dh1ayKWZb | 1       | 1    | 苹果  | 苹果真好吃 |
| ik_index | _doc  | 2                    | 1       | 1    | 香蕉  | 香蕉真好吃 |
| ik_index | _doc  | 1                    | 1       | 1    | 香蕉  | 香蕉真好吃 |
| ik_index | _doc  | 3                    | 1       | 1    | 橘子  | 橘子真好吃 |
| ik_index | _doc  | 4                    | 1       | 1    | 桃子  | 桃子真好吃 |

只有5条记录，我们新建一个查询语句，如下：

```shell
POST /ik_index/_search
{
    "query":{
        "bool":{
            "must":[
                {
                    "match":{
                        "desc":"香蕉好吃"
                    }
                }
            ]
        }
    },
    "from":0,
    "size":10,
}
```

我们查询的条件是`desc`字段满足`香蕉好吃`，由于我们使用的ik分词器，查询条件`香蕉好吃`会被分词为`香蕉`和`好吃`，但是5的数据的desc中都有`好吃`字段，所有5条数据都会被查询出来，我们执行一下，看看结果：

| _index   | _type | _id                  | ▲_score    | id   | title | desc       |
| :------- | :---- | :------------------- | :--------- | :--- | :---- | :--------- |
| ik_index | _doc  | 2                    | 0.98773474 | 1    | 香蕉  | 香蕉真好吃 |
| ik_index | _doc  | 1                    | 0.98773474 | 1    | 香蕉  | 香蕉真好吃 |
| ik_index | _doc  | 3                    | 0.08929447 | 1    | 橘子  | 橘子真好吃 |
| ik_index | _doc  | 4                    | 0.08929447 | 1    | 桃子  | 桃子真好吃 |
| ik_index | _doc  | fEsN-HEBZl0Dh1ayKWZb | 0.07893815 | 1    | 苹果  | 苹果真好吃 |

哈哈，5条数据全部查询出来了，和我们的预期是一样的，但是，我们需要注意一点的是`_score`字段，它们的分数是不一样的，我们的查询条件是`香蕉好吃`，所以既包含`香蕉`又包含`好吃`的数据分数高，我们看到分数到了0.98，而另外3条数据只匹配了`好吃`，所以分数只有0.7，0.8。

### Boosting Query

这个查询比较有意思，它有两个关键词`positive`和`negative`，`positive`是“正”，所有满足`positive`条件的数据都会被查询出来，`negative`是“负”，**满足`negative`条件的数据并不会被过滤掉**，而是会**扣减分数**。那么扣减分数要扣减多少呢？这里边有另外一个字段`negative_boost`，这个字段是得分的系数，它的分数在0~1之间，满足了`negative`条件的数据，它们的分数会乘以这个系数，比如这个系数是0.5，原来100分的数据如果满足了`negative`条件，它的分数会乘以0.5，变成50分。我们看看下面的例子，

```shell
POST /ik_index/_search
{
  "query": {
    "boosting": {
      "positive": {
        "term": {
          "desc": "好吃"
        }
      },
      "negative": {
        "term": {
          "desc": "香蕉"
        }
      },
      "negative_boost": 0.5
    }
  }
}
```

`positive`条件是好吃，只要`desc`中有“好吃”的数据都会被查询出来，而`negative`的条件是香蕉，只要`desc`中包含“香蕉”的数据都会被扣减分数，扣减多少分数呢？它的得分将会变为`原分数*0.5`。我们执行一下，看看效果，

| index    | type | _id                  | score       | _source.id | source.title | source.desc |
| :------- | :--- | :------------------- | :---------- | :--------- | :----------- | :---------- |
| ik_index | _doc | 3                    | 0.08929447  | 1          | 橘子         | 橘子真好吃  |
| ik_index | _doc | 4                    | 0.08929447  | 1          | 桃子         | 桃子真好吃  |
| ik_index | _doc | fEsN-HEBZl0Dh1ayKWZb | 0.07893815  | 1          | 苹果         | 苹果真好吃  |
| ik_index | _doc | 2                    | 0.044647235 | 1          | 香蕉         | 香蕉真好吃  |
| ik_index | _doc | 1                    | 0.044647235 | 1          | 香蕉         | 香蕉真好吃  |

我们可以看到前3条数据的分数都在0.09左右，而后两条的数据在0.044左右，很显然，后两条数据中的`desc`包含`香蕉`，它们的得分会乘以0.5的系数，所以分数只有前面数据的分数的一半。

### 全文检索

在前面几节的内容中，我们介绍过，只有字段的类型是`text`，才会使用全文检索，全文检索会使用到分析器，在我们的`ik_index`索引中，`title`和`desc`字段都是text类型，所以，这两个字段的搜索都会使用到ik中文分词器。全文检索比起前面的组合检索要简单一点，当然，在ES的官方文档中，全文检索中的内容还是挺多的，在这里我们只介绍一个标准的全文检索。

我们看看下面的语句，

```shell
POST /ik_index/_search
{
  "query": {
    "match": {
      "desc": {
        "query": "苹果"
      }
    }
  }
}
```

在请求体中，`match`代替了之前的`bool`，`match`是标准的全文索引的查询。`match`后面跟的字段是要查询的字段名，在咱们的例子中，查询的字段是`desc`，如果有多个字段，可以列举多个。`desc`字段里，`query`就是要查询的内容。我们还可以在字段中指定分析器，使用`analyzer`关键字，如果不指定，默认就是索引的分析器。我们执行一下上面的查询，结果如下：

| index    | type | _id                  | score     | source.id | source.title | source.desc |
| :------- | :--- | :------------------- | :-------- | :-------- | :----------- | :---------- |
| ik_index | _doc | fEsN-HEBZl0Dh1ayKWZb | 1.2576691 | 1         | 苹果         | 苹果真好吃  |

我们可以看到相应的数据已经检索出来了。

## 最后

在ES中，检索的花样是比较多的，这里也不能一一给大家介绍了，只介绍一些最基本、最常用的查询功能。下一篇我们看一下ES的聚合查询功能。