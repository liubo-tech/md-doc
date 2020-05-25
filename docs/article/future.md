## 一、简介

   通常情况下，我们在写多线程任务时，都是实现run方法，大家注意到run方法是没有返回值的。如果我们要用到其他线程的返回值该怎么办呢？

　　这里就要用到Future了。

　　Future是通过Callable实现的，是一种可生成结果的Runnable。当运行完成以后，可以通过Future.get获取结果。

　　Future.get取决于任务的状态，如果任务没有完成，则get方法一直阻塞，直到任务完成。

　　下面来看具体的实例

## 二、实例

```java
public class Ha {
    public static void main(String[] args) throws InterruptedException, ExecutionException {
        Callable<String> callable = () -> {
            System.out.println("分线程正在进行");
            Thread.sleep(10*1000);
            System.out.println("分线程结束");
            return "分线程完成";
        };
        ExecutorService es = Executors.newSingleThreadExecutor();
        Future<String> future = es.submit(callable);
        es.shutdown();
        System.out.println("主线程工作正在进行");
        Thread.sleep(5*1000);
        System.out.println("主线程工作结束");
        String result = future.get();
        System.out.println(result);

    }
}
```

首先，我们实现Callable，模拟一个工作任务，执行时间是10秒。

通过Executors创建一个单线程任务，并执行Callable。

主线程继续自己的工作，工作时间是5秒。

主线程获取分线程的任务结果，由于分线程任务是10秒，所以get方法会阻塞，直到分线程任务完成。

最后打印分线程任务结果。

执行结果如下：

>* 主线程工作正在进行 
>* 分线程正在进行 
>* 主线程工作结束 
>* 分线程结束 
>* 分线程完成 

上面的例子中，使用了lambda表达式，如果要运行，请使用jdk8。