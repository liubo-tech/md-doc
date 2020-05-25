# ES[7.6.x]学习笔记（七）IK中文分词器

在上一节中，我们给大家介绍了ES的分析器，我相信大家对ES的全文搜索已经有了深刻的印象。分析器包含3个部分：字符过滤器、分词器、分词过滤器。在上一节的例子，大家发现了，都是英文的例子，是吧？因为ES是外国人写的嘛，中国如果要在这方面赶上来，还是需要屏幕前的小伙伴们的~ 

英文呢，我们可以按照空格将一句话、一篇文章进行分词，然后对分词进行过滤，最后留下有意义的词。但是中文怎么分呢？中文的一句话是没有空格的，这就要有一个强大的中文词库，当你的内容中出现这个词时，就会将这个词提炼出来。这里大家也不用重复造轮子，经过前辈的努力，这个中文的分词器已经有了，它就是今天要给大家介绍的**IK中文分词器**。

## IK中文分词器的安装

ES默认是没有IK中文分词器的，我们要将IK中文分词器作为一个插件安装到ES中，安装的步骤也很简单：

1. 从GitHub上下载适合自己ES版本的IK中文分词器，地址如下：`https://github.com/medcl/elasticsearch-analysis-ik/releases`。

2. 在我们的ES的插件目录中（`${ES_HOME}/plugins`）创建`ik`目录，

   ```shell
   mkdir ik
   ```

3. 将我们下载好的IK分词器解压到`ik`目录，这里我们安装`unzip`命令，进行解压。

4. 重启我们所有的ES服务。

到这里，我们的IK中文分词器就安装完了。

## IK中文分词器初探

在上一节我们访问了ES的分析器接口，指定了分析器和文本的内容，我们就可以看到分词的结果。那么既然我们已经安装了Ik中文分词器，当然要看一下效果了。在看效果之前，我们先要说一下，IK中文分词器插件给我们提供了**两个分析器**。

* ik_max_word: 会将文本做最细粒度的拆分
* ik_smart：会做最粗粒度的拆分

我们先看看`ik_max_word`的分析效果吧，

```shell
POST _analyze
{
  "analyzer": "ik_max_word",
  "text":     "中华人民共和国国歌"
}
```

我们指定分词器为`ik_max_word`，文本内容为`中华人民共和国国歌`。我们看一下分词的结果：

```json
{
    "tokens": [
        {
            "token": "中华人民共和国",
            "start_offset": 0,
            "end_offset": 7,
            "type": "CN_WORD",
            "position": 0
        },
        {
            "token": "中华人民",
            "start_offset": 0,
            "end_offset": 4,
            "type": "CN_WORD",
            "position": 1
        },
        {
            "token": "中华",
            "start_offset": 0,
            "end_offset": 2,
            "type": "CN_WORD",
            "position": 2
        },
        {
            "token": "华人",
            "start_offset": 1,
            "end_offset": 3,
            "type": "CN_WORD",
            "position": 3
        },
        {
            "token": "人民共和国",
            "start_offset": 2,
            "end_offset": 7,
            "type": "CN_WORD",
            "position": 4
        },
        {
            "token": "人民",
            "start_offset": 2,
            "end_offset": 4,
            "type": "CN_WORD",
            "position": 5
        },
        {
            "token": "共和国",
            "start_offset": 4,
            "end_offset": 7,
            "type": "CN_WORD",
            "position": 6
        },
        {
            "token": "共和",
            "start_offset": 4,
            "end_offset": 6,
            "type": "CN_WORD",
            "position": 7
        },
        {
            "token": "国",
            "start_offset": 6,
            "end_offset": 7,
            "type": "CN_CHAR",
            "position": 8
        },
        {
            "token": "国歌",
            "start_offset": 7,
            "end_offset": 9,
            "type": "CN_WORD",
            "position": 9
        }
    ]
}
```

我们可以看到，分词分的非常细，我们在使用上面的这些进行搜索时，都可以搜索到`中华人民共和国国歌`这个文本。我们再看一下另外一个分析器`ik_smart`，

```shell
POST _analyze
{
  "analyzer": "ik_smart",
  "text":     "中华人民共和国国歌"
}
```

我们的文本内容同样是`中华人民共和国国歌`，看一下分词的效果，

```json
{
    "tokens": [
        {
            "token": "中华人民共和国",
            "start_offset": 0,
            "end_offset": 7,
            "type": "CN_WORD",
            "position": 0
        },
        {
            "token": "国歌",
            "start_offset": 7,
            "end_offset": 9,
            "type": "CN_WORD",
            "position": 1
        }
    ]
}
```

同样的文本，使用`ik_smart`进行分词时，只分成了两个词，和`ik_max_word`分词器比少了很多。这就是两个分词器的区别，不过这两个分析器都是可以对中文进行分词的。

## 创建索引时指定IK分词器

既然我们安装了IK中文分词器的插件，那么我们在创建索引时就可以为`text`类型的字段指定IK中文分词器了。来看看下面的例子，

```shell
PUT ik_index
{
	"mappings": {
		"properties": {
			"id": {
				"type": "long"
			},
			"title": {
				"type": "text",
				"analyzer": "ik_max_word"
			}
		}
	}
}
```

我们创建了索引`ik_index`，并且为字段`title`指定了分词器`ik_max_word`。我们执行一下，创建成功。然后我们再通过`GET`请求看一下这个索引的映射情况。

```shell
GET ik_index/_mapping
```

返回的结果如下：

```json
{
    "ik_index": {
        "mappings": {
            "properties": {
                "id": {
                    "type": "long"
                },
                "title": {
                    "type": "text",
                    "analyzer": "ik_max_word"
                }
            }
        }
    }
}
```

我们可以看到`title`字段的分析器是`ik_max_word`。

## 为索引指定默认IK分词器

在上一节中，我们已经给大家介绍了为索引指定默认分词器的方法，这里我们直接把分词器改为IK分词器就可以了，如下：

```shell
PUT ik_index
{
  "settings": {
    "analysis": {
      "analyzer": {
        "default": {
          "type": "ik_max_word"
        }
      }
    }
  }
}
```

这样我们在索引中就不用创建每一个字段，可以通过动态字段映射，将`String`类型的字段映射为`text`类型，同时分词器指定为`ik_max_word`。我们试一下，向`ik_index`索引中添加一条记录。

```shell
POST ik_index/_doc/1
{
	"id": 1,
	"title": "大兴庞各庄的西瓜",
	"desc": "大兴庞各庄的西瓜真是好吃，脆沙瓤，甜掉牙"
}
```

执行成功。我们再执行搜索试一下，如下：

```shell
POST ik_index/_search
{
  "query": { "match": { "title": "西瓜" } }
}
```

我们搜索`title`字段匹配`西瓜`，执行结果如下：

```json
{
    "took": 2,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 1,
            "relation": "eq"
        },
        "max_score": 0.2876821,
        "hits": [
            {
                "_index": "ik_index",
                "_type": "_doc",
                "_id": "1",
                "_score": 0.2876821,
                "_source": {
                    "id": 1,
                    "title": "大兴庞各庄的西瓜",
                    "desc": "大兴庞各庄的西瓜真是好吃，脆沙瓤，甜掉牙"
                }
            }
        ]
    }
}
```

我们可以看到刚才插入的那条记录已经搜索出来了，看来我们的IK中文分词器起作用了，而且搜索的结果也符合我们的预期。我们再看看搜索`西`一个字的时候，能不能搜索到结果，

```shell
POST ik_index/_search
{
  "query": { "match": { "title": "西" } }
}
```

执行结果如下：

```json
{
    "took": 4,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 0,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    }
}
```

并没有搜索出结果，说明在进行分词时，`西瓜`是作为一个词出现的，并没有拆分成每一个字，这也是符合我们预期的。

好了~ 这一节的IK中文分词器就给大家介绍到这里了~~