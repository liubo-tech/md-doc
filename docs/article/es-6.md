# ES[7.6.x]学习笔记（六）分析器

在前面的章节中，我们给大家介绍了索引中的映射类型，也就是每一个字段都有一个类型，比如：long，text，date等。这和我们的数据库非常的相似，那么它的不同之处是什么呢？对了，就是全文索引，在ES当中，**只有text类型的字段才会用的全文索引，**那么这里就会引出ES中一个非常重要的概念，**文本分析器（Text analysis）**。

分析器使ES支持全文索引，搜索的结果是和你搜索的内容相关的，而不是你搜索内容的确切匹配。我们用ES官网中的例子给大家举例，假如你在搜索框中输入的内容是`Quick fox jumps`，你想得到的结果是`A quick brown fox jumps over the lazy dog`，或者结果中包含这样的词`fast fox`或`foxes leap`。

分析器之所以能够使搜索支持全文索引，都是因为有**分词器（tokenization）**，它可以将一句话、一篇文章切分成不同的词语，每个词语都是独立的。假如你在ES索引中添加了一条记录`the quick brown fox jumps`，而用户搜索时输入的内容是`quick fox`，并没有完全匹配的内容，但是因为有了分词器，你索引的内容被切分成了不同的、独立的词，用户搜索的内容也会进行相应的切分，所以用户搜索的内容虽然没有完全匹配，但也能够搜索到想要的内容。

分析器除了要做分词，还要做**归一化（Normalization）**。分词器能够使搜索内容在每一个词上匹配，但这种匹配也只是在字面上进行的匹配。

* 比如你搜索`Quick`，但是不能匹配到`quick`，它们的大小写不同。
* 比如你搜索`fox`，但是不能匹配到`foxes`，它是复数形式。
* 比如你搜索`jumps`，不能匹配到`leaps`，虽然它们是同义词。

为了解决这些问题，分析器要把这些分词归一化到标准的格式。这样我们在搜索的时候就不用严格的匹配了，相似的词语我们也能够检索出来，上面的3种情况，我们也能够搜索出相应的结果。

## 分析器的组成

分析器，无论是内置的，还是自定义的，都是由3部分组成：字符过滤器（character filters）、分词器（tokenizers）、分词过滤器（token filters）。

### 字符过滤器

字符过滤器接收最原始的文档，并且可以改变其内容，比如：可以把中文的一二三四五六七八九，变成阿拉伯数字123456789。它还可以过滤html标签，并对其进行转义。还可以通过正则表达式，把匹配到的内容转化成其他的内容。一个分析器可以有多个字符过滤器，也可以没有字符过滤器。

### 分词器

一个分析器只能有一个确定的分词器，它可以把一句话分成若干个词，比如：空格分词器。当你输入一句话`Quick brown fox!`，它将被切分成`[Quick, brown, fox!]`。

### 分词过滤器

分词过滤器接收分词并且可以改变分词，比如：小写分词过滤器，它将接收到的分词全部转换成小写。助词过滤器，它将删除掉一些公共的助词，比如英语里的 `the`，`is`，`are`等，中文里的`的`，`得`等。同义词过滤器，它将在你的分词中，添加相应的同义词。一个分析器可以有多个分词过滤器，它们将按顺序执行。

我们在建立索引和搜索时，都会用的分析器。

## 配置文本分析器

前面我们讲了分析器的基本概念，也了解了全文搜索的基本步骤。下面我们看一下如何配置文本分析器，ES默认给我们配置的分析器是标准分析器。如果标准的分析器不适合你，你可以指定其他的分析器，或者自定义一个分析器。

ES有分析器的api，我们指定分析器和文本内容，就可以得到分词的结果。比如：

```shell
POST _analyze
{
  "analyzer": "whitespace",
  "text":     "The quick brown fox."
}
```

返回的结果如下：

```json
{
    "tokens": [
        {
            "token": "The",
            "start_offset": 0,
            "end_offset": 3,
            "type": "word",
            "position": 0
        },
        {
            "token": "quick",
            "start_offset": 4,
            "end_offset": 9,
            "type": "word",
            "position": 1
        },
        {
            "token": "brown",
            "start_offset": 10,
            "end_offset": 15,
            "type": "word",
            "position": 2
        },
        {
            "token": "fox.",
            "start_offset": 16,
            "end_offset": 20,
            "type": "word",
            "position": 3
        }
    ]
}
```

我们指定的分析器是空格分析器，输入的文本内容是`The quick brown fox.`，返回结果是用空格切分的四个词。我们也可以测试分析器的组合，比如：

```shell
POST _analyze
{
  "tokenizer": "standard",
  "filter":  [ "lowercase", "asciifolding" ],
  "text":      "Is this déja vu?"
}
```

我们指定了标准的分词器，小写过滤器和asciifolding过滤器。输入的内容是`Is this déja vu?`，我们执行一下，得到如下的结果：

```json
{
    "tokens": [
        {
            "token": "is",
            "start_offset": 0,
            "end_offset": 2,
            "type": "<ALPHANUM>",
            "position": 0
        },
        {
            "token": "this",
            "start_offset": 3,
            "end_offset": 7,
            "type": "<ALPHANUM>",
            "position": 1
        },
        {
            "token": "deja",
            "start_offset": 8,
            "end_offset": 12,
            "type": "<ALPHANUM>",
            "position": 2
        },
        {
            "token": "vu",
            "start_offset": 13,
            "end_offset": 15,
            "type": "<ALPHANUM>",
            "position": 3
        }
    ]
}
```

我们可以看到结果中，`is`变成了小写，`déja`变成了`deja`，最后的`?`也过滤掉了。

### 为指定的字段配置分析器

我们在创建映射时，可以为每一个`text`类型的字段指定分析器，例如：

```shell
PUT my_index
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "whitespace"
      }
    }
  }
}
```

我们在`my_index`索引中，创建了`title`字段，它的类型是`text`，它的分析器是`whitespace`空格分析器。

### 为索引指定默认的分析器

如果我们觉得为每一个字段指定分析器过于麻烦，我们还可以为索引指定一个默认的分词器，如下：

```shell
PUT my_index
{
  "settings": {
    "analysis": {
      "analyzer": {
        "default": {
          "type": "whitespace"
        }
      }
    }
  }
}
```

我们为`my_index`索引指定了默认的分析器`whitespace`。这样我们在创建`text`类型的字段时，就不用为其指定分析器了。

这一节给大家介绍了分析器，我们可以看到例子中都是使用的英文分析器，下一节我们一起看一下强大的中文分析器。

