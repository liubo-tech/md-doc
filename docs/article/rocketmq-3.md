# RocketMQ系列（三）消息的生产与消费

前面的章节，我们已经把RocketMQ的环境搭建起来了，是一个两主两从的异步集群。接下来，我们就看看怎么去使用RocketMQ，在使用之前，先要在NameServer中创建Topic，我们知道RocketMQ是基于Topic的消息队列，在生产者发送消息的时候，要指定消息的Topic，这个Topic的路由规则是怎样的，这些都要在NameServer中去创建。

## Topic的创建

我们先看看Topic的命令是如何使用的，如下：

```shell
./bin/mqadmin updateTopic -h

usage: mqadmin updateTopic -b <arg> | -c <arg>  [-h] [-n <arg>] [-o <arg>] [-p <arg>] [-r <arg>] [-s <arg>] -t
       <arg> [-u <arg>] [-w <arg>]
 -b,--brokerAddr <arg>       create topic to which broker
 -c,--clusterName <arg>      create topic to which cluster
 -h,--help                   Print help
 -n,--namesrvAddr <arg>      Name server address list, eg: 192.168.0.1:9876;192.168.0.2:9876
 -o,--order <arg>            set topic's order(true|false)
 -p,--perm <arg>             set topic's permission(2|4|6), intro[2:W 4:R; 6:RW]
 -r,--readQueueNums <arg>    set read queue nums
 -s,--hasUnitSub <arg>       has unit sub (true|false)
 -t,--topic <arg>            topic name
 -u,--unit <arg>             is unit topic (true|false)
 -w,--writeQueueNums <arg>   set write queue nums

```

其中有一段，`-b <arg> | -c <arg>`，说明这个Topic可以指定集群，也可以指定队列，我们先创建一个Topic指定集群，因为集群中有两个队列`broker-a`和`broker-b`，看看我们的消息是否在两个队列中负载；然后再创建一个Topic指向`broker-a`，再看看这个Topic的消息是不是只在`broker-a`中。

创建两个Topic，

```shell
./bin/mqadmin updateTopic -c 'RocketMQ-Cluster' -t cluster-topic -n '192.168.73.130:9876;192.168.73.131:9876;192.168.73.132:9876'

./bin/mqadmin updateTopic -b 192.168.73.130:10911 -t broker-a-topic
```

第一个命令创建了一个集群的Topic，叫做cluster-topic；第二个命令创建了一个只在broker-a中才有的Topic，我们指定了`-b 192.168.73.130:10911`，这个是broker-a的地址和端口。

## 生产者发送消息

我们新建SpringBoot项目，然后引入RocketMQ的jar包，

```xml
<dependency>
    <groupId>org.apache.rocketmq</groupId>
    <artifactId>rocketmq-client</artifactId>
    <version>4.3.0</version>
</dependency>
```

然后配置一下生产者的客户端，在这里使用`@Configuration`这个注解，具体如下：

```java
@Configuration
public class RocketMQConfig {

    @Bean(initMethod = "start",destroyMethod = "shutdown")
    public DefaultMQProducer producer() {
        DefaultMQProducer producer = new
                DefaultMQProducer("DefaultMQProducer");
											producer.setNamesrvAddr("192.168.73.130:9876;192.168.73.131:9876;192.168.73.132:9876;");
        return producer;
    }
}
```

* 首先创建一个生产者组，名字叫做DefaultMQProducer；
* 然后指定NameServer，192.168.73.130:9876;192.168.73.131:9876;192.168.73.132:9876；
* 最后在`@Bean`注解中指定初始化的方法，和销毁的方法；

这样，生产者的客户端就配置好了，然后再写个Test类，在Test类中向MQ中发送消息，如下，

```java
@SpringBootTest
class RocketmqDemoApplicationTests {

    @Autowired
    public DefaultMQProducer defaultMQProducer;

    @Test
    public void producerTest() throws Exception {

        for (int i = 0;i<5;i++) {
            Message message = new Message();
            message.setTopic("cluster-topic");
            message.setKeys("key-"+i);
            message.setBody(("this is simpleMQ,my NO is "+i).getBytes());

            SendResult sendResult = defaultMQProducer.send(message);
            System.out.println("SendStatus:" + sendResult.getSendStatus());
            System.out.println("BrokerName:" + sendResult.getMessageQueue().getBrokerName());
        }
    }
}
```

* 我们先自动注入前面配置DefaultMQProducer；
* 然后在Test方法中，循环5次，发送5个消息，消息的Topic指定为cluster-topic，是集群的消息，然后再设置消息的key和内容，最后调用send方法发送消息，这个send方法是同步方法，程序运行到这里会阻塞，等待返回的结果；
* 最后，我们打印出返回的结果和broker的名字；

运行一下，看看结果：

```shell
SendStatus:SEND_OK
BrokerName:broker-b
SendStatus:SEND_OK
BrokerName:broker-b
SendStatus:SEND_OK
BrokerName:broker-b
SendStatus:SEND_OK
BrokerName:broker-b
SendStatus:SEND_OK
BrokerName:broker-a
```

5个消息发送都是成功的，而发送的队列有4个是broker-b，1个broker-a，说明两个broker之间还是有负载的，负载的规则我们猜测是随机。

我们再写个测试方法，看看`broker-a-topic`这个Topic的发送结果是什么样子的，如下：

```java
@Test
public void brokerTopicTest() throws Exception {

    for (int i = 0;i<5;i++) {
        Message message = new Message();
        message.setTopic("broker-a-topic");
        message.setKeys("key-"+i);
        message.setBody(("this is broker-a-topic's MQ,my NO is "+i).getBytes());

        defaultMQProducer.send(message, new SendCallback() {
            @Override
            public void onSuccess(SendResult sendResult) {
                System.out.println("SendStatus:" + sendResult.getSendStatus());
                System.out.println("BrokerName:" + sendResult.getMessageQueue().getBrokerName());
            }

            @Override
            public void onException(Throwable e) {
                e.printStackTrace();
            }
        });

        System.out.println("异步发送 i="+i);

    }
}
```

* 消息的Topic指定的是broker-a-topic，这个Topic我们只指定了broker-a这个队列；
* 发送的时候我们使用的是异步发送，程序到这里不会阻塞，而是继续向下执行，发送的结果正常或者异常，会调用对应的onSuccess和onException方法；
* 我们在onSuccess方法中，打印出发送的结果和队列的名称；

运行一下，看看结果：

异步发送 i=0
异步发送 i=1
异步发送 i=2
异步发送 i=3
异步发送 i=4
SendStatus:SEND_OK
SendStatus:SEND_OK
SendStatus:SEND_OK
SendStatus:SEND_OK
BrokerName:broker-a
SendStatus:SEND_OK
BrokerName:broker-a
BrokerName:broker-a
BrokerName:broker-a
BrokerName:broker-a

由于我们是异步发送，所以最后的日志先打印了出来，然后打印出返回的结果，都是发送成功的，并且队列都是broker-a，完全符合我们的预期。

## 消费者

生产的消息已经发送到了队列当中，再来看看消费者端如何消费这个消息，我们在这个配置类中配置消费者，如下：

```java
@Bean(initMethod = "start",destroyMethod = "shutdown")
public DefaultMQPushConsumer pushConsumer() throws MQClientException {
    DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("DefaultMQPushConsumer");
    consumer.setNamesrvAddr("192.168.73.130:9876;192.168.73.131:9876;192.168.73.132:9876;");
    consumer.subscribe("cluster-topic","*");
    consumer.registerMessageListener(new MessageListenerConcurrently() {
        @Override
        public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> msgs, ConsumeConcurrentlyContext context) {
            if (msgs!=null&&msgs.size()>0) {
                for (MessageExt msg : msgs) {
                    System.out.println(new String(msg.getBody()));
                    System.out.println(context.getMessageQueue().getBrokerName());
                }
            }

            return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
        }
    } );
    return consumer;
}
```

* 我们创建了一个消费者组，名字叫做DefaultMQPushConsumer；
* 然后指定NameServer集群，192.168.73.130:9876;192.168.73.131:9876;192.168.73.132:9876;
* 消费者订阅的Topic，这里我们订阅的是cluster-topic，后面的*号是对应的tag，代表我们订阅所有的tag；
* 最后注册一个并发执行的消息监听器，实现里边的consumeMessage方法，在方法中，我们打印出消息体的内容，和消息所在的队列；
* 如果消息消费成功，返回CONSUME_SUCCESS，如果出现异常等情况，我们要返回RECONSUME_LATER，说明这个消息还要再次消费；

好了，这个订阅了cluster-topic的消费者，配置完了，我们启动一下项目，看看消费的结果如何，

```shell
this is simpleMQ,my NO is 2
broker-b
this is simpleMQ,my NO is 3
broker-b
this is simpleMQ,my NO is 1
broker-b
this is simpleMQ,my NO is 0
broker-a
this is simpleMQ,my NO is 4
broker-b
```

结果符合预期，cluster-topic中的5个消息全部消费成功，而且队列是4个broker-b，1个broker-a，和发送时的结果是一致的。

大家有问题欢迎评论区讨论~