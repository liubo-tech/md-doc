## 一、概念

闭锁是一个同步工具类，主要用于等待其他线程活动结束后，再执行后续的操作。例如：在王者荣耀游戏中，需要10名玩家都准备就绪后，游戏才能开始。

CountDownLatch是concurrent包中的一个类，是一种灵活的闭锁实现。他可以使一个或多个线程等待一组事件的发生。闭锁状态包括一个计数器，表示需要等待的数量。

countDown方法是递减计数器，表示一个事件已经发生。await方法等待计数器为0，表示所有事件都已经发生。如果计数器值大于0，await会一直阻塞，等待计数器为0。

## 二、CountDownLatch用法

```
    public static void main(String[] args) throws InterruptedException {
　　　　//开始闭锁（1个事件）
        CountDownLatch startCdl = new CountDownLatch(1);
　　　　//结束闭锁（10个事件）
        CountDownLatch endCdl = new CountDownLatch(10);
　　　　//固定线程池（10个线程）
        ExecutorService es = Executors.newFixedThreadPool(10);
        for (int i=0;i<10;i++){
            es.execute(()->{
                try {
　　　　　　　　　　//等待开始闭锁
                    startCdl.await();
　　　　　　　　　　//休眠5秒
                    Thread.sleep(5*1000);
                    System.out.println(Thread.currentThread().getName());
　　　　　　　　　　//结束闭锁 计数器减1
                    endCdl.countDown();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            });
        }
　　　　//线程池关闭
        es.shutdown();
        long start = System.currentTimeMillis();
　　　　//开始闭锁 计数器减1 计数器值为0
        startCdl.countDown();
　　　　//等待结束闭锁 10个线程结束后 计数器值为0, 执行或许操作
        endCdl.await();
        long end = System.currentTimeMillis();
        System.out.println("运行时间为："+(end-start));
    }
```

在这里，我们设置“开始闭锁”是为了10个线程能够同时执行，如果没有“开始闭锁”，那么在循环时，前面的线程会先执行。
设置“开始闭锁”以后，10个线程均在await方法等待。当“开始闭锁”执行countDown方法时，计时器为0,10个线程的await方法同时释放，执行后续操作。随后主线程“结束闭锁”进行await等待，由于“结束闭锁”的计数器值为10，所以10个线程都执行countDown以后，计数器值才为0，这时“结束闭锁”await方法释放，执行以下操作。计算出10个任务同时执行所需要的时间。