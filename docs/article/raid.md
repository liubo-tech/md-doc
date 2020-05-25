# RAID磁盘阵列——扫盲篇 [返回](/ "首页")

在单机时代，采用单块磁盘进行数据存储和读写的方式，由于寻址和读写的时间消耗，导致I/O性能非常低，且存储容量还会受到限制。
另外，单块磁盘极其容易出现物理故障，经常导致数据的丢失。因此大家就在想，有没有一种办法将多块独立的磁盘结合在一起组成一个技术方案，
来提高数据的可靠性和I/O性能呢。

在这种情况下，RAID技术就应运而生了。

## 一、RAID 是什么？

RAID （ Redundant Array of Independent Disks ）即独立磁盘冗余阵列，简称为「磁盘阵列」，其实就是用多个独立的磁盘组成在一起形成一个大的磁盘系统，
从而实现比单块磁盘更好的存储性能和更高的可靠性。

## 二、RAID 有哪些？

RAID方案常见的可以分为：
* RAID0
* RAID1
* RAID5
* RAID6
* RAID10

下面来分别介绍一下。

## RAID0

RAID0 是一种非常简单的的方式，它将多块磁盘组合在一起形成一个大容量的存储。当我们要写数据的时候，会将数据分为N份，
以独立的方式实现N块磁盘的读写，那么这N份数据会同时并发的写到磁盘中，因此执行性能非常的高。

![image1](http://testimage.alwaysnb.com/blog/raid0.jpg)

RAID0 的读写性能理论上是单块磁盘的N倍（仅限理论，因为实际中磁盘的寻址时间也是性能占用的大头）

但RAID0的问题是，它并不提供数据校验或冗余备份，因此一旦某块磁盘损坏了，数据就直接丢失，无法恢复了。因此RAID0就不可能用于高要求的业务中，
但可以用在对可靠性要求不高，对读写性能要求高的场景中。

那有没有可以让存储可靠性变高的方案呢？
有的，下面的RAID1就是。

## RAID1

![image2](http://testimage.alwaysnb.com/blog/raid1.jpg)

如图，
RAID1 是磁盘阵列中单位成本最高的一种方式。因为它的原理是在往磁盘写数据的时候，将同一份数据无差别的写两份到磁盘，
分别写到工作磁盘和镜像磁盘，那么它的实际空间使用率只有50%了，两块磁盘当做一块用，这是一种比较昂贵的方案。

RAID1其实与RAID0效果刚好相反。RAID1 这种写双份的做法，就给数据做了一个冗余备份。这样的话，任何一块磁盘损坏了，
都可以再基于另外一块磁盘去恢复数据，数据的可靠性非常强，但性能就没那么好了。

了解了RAID0和RAID1之后，我们发现这两个方案都不完美啊。
这时候就该 性能又好、可靠性也高 的方案 RAID5 登场了。

## RAID5

这是目前用的最多的一种方式。
因为 RAID5 是一种将 存储性能、数据安全、存储成本 兼顾的一种方案。

在了解RAID5之前，我们可以先简单看一下RAID3，虽然RAID3用的很少，但弄清楚了RAID3就很容易明白RAID5的思路。

RAID3的方式是：将数据按照RAID0的形式，分成多份同时写入多块磁盘，但是还会另外再留出一块磁盘用于写「奇偶校验码」。例如总共有N块磁盘，
那么就会让其中额度N-1块用来并发的写数据，第N块磁盘用记录校验码数据。一旦某一块磁盘坏掉了，就可以利用其它的N-1块磁盘去恢复数据。

但是由于第N块磁盘是校验码磁盘，因此有任何数据的写入都会要去更新这块磁盘，导致这块磁盘的读写是最频繁的，也就非常的容易损坏。

RAID5的方式可以说是对RAID3进行了改进。

RAID5模式中，不再需要用单独的磁盘写校验码了。它把校验码信息分布到各个磁盘上。例如，总共有N块磁盘，那么会将要写入的数据分成N份，
并发的写入到N块磁盘中，同时还将数据的校验码信息也写入到这N块磁盘中（数据与对应的校验码信息必须得分开存储在不同的磁盘上）。
一旦某一块磁盘损坏了，就可以用剩下的数据和对应的奇偶校验码信息去恢复损坏的数据。

![image3](http://testimage.alwaysnb.com/blog/raid5.jpg)

RAID5校验位算法原理：P = D1 xor D2 xor D3 … xor Dn （D1,D2,D3 … Dn为数据块，P为校验，xor为异或运算）

RAID5的方式，最少需要三块磁盘来组建磁盘阵列，允许最多同时坏一块磁盘。如果有两块磁盘同时损坏了，那数据就无法恢复了。

## RAID6

为了进一步提高存储的高可用，聪明的人们又提出了RAID6方案，可以在有两块磁盘同时损坏的情况下，也能保障数据可恢复。

为什么RAID6这么牛呢，因为RAID6在RAID5的基础上再次改进，引入了双重校验的概念。

RAID6除了每块磁盘上都有同级数据XOR校验区以外，还有针对每个数据块的XOR校验区，这样的话，相当于每个数据块有两个校验保护措施，
因此数据的冗余性更高了。

但是RAID6的这种设计也带来了很高的复杂度，虽然数据冗余性好，读取的效率也比较高，但是写数据的性能就很差。因此RAID6在实际环境中应用的比较少。

## RAID10

RAID10其实就是RAID1与RAID0的一个合体。

我们看图就明白了：

![image4](http://testimage.alwaysnb.com/blog/raid10.jpg)

RAID10兼备了RAID1和RAID0的有优点。首先基于RAID1模式将磁盘分为2份，当要写入数据的时候，将所有的数据在两份磁盘上同时写入，
相当于写了双份数据，起到了数据保障的作用。且在每一份磁盘上又会基于RAID0技术讲数据分为N份并发的读写，这样也保障了数据的效率。

但也可以看出RAID10模式是有一半的磁盘空间用于存储冗余数据的，浪费的很严重，因此用的也不是很多。
