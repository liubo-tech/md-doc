# MySQL主主模式+Keepalived高可用

今天闲来无事，打算搭建一个MySQL的高可用架构，采用的是MySQL的主主结构，再外加Keepalived，对外统一提供虚IP。先来说说背景吧，现在的项目为了高可用性，都是避免单节点的存在的，比如，我们的应用程序，都是部署多个节点，通过Nginx做负载均衡，某个节点出现问题，并不会影响整体应用。那么数据库层如何搭建高可用的架构呢？今天我们就来看看。

## 整体架构

MySQL采用主主结构，我们使用两台机器就够了，然后再这两台机器上再安装Keepalived，使用vrrp技术，虚拟出一个IP。两台机器如下：

* 192.168.73.141：MySQL（主1）、Keepalived（MASTER）
* 192.168.73.142：MySQL（主2）、Keepalived（BACKUP）
* 192.168.73.150：虚IP

整体架构图如下：

![image-20201028104022181](D:\Vue-Project\vue-press\docs\article\MySQL+Keepalived.assets\image-20201028104022181.png)

## MySQL主主搭建

我们分别在两台机器上安装MySQL，使用yum方式安装，首先从MySQL官网下载rpm包，选择对应的系统，在这里，我们选择CentOS7的prm包，`mysql80-community-release-el7-3.noarch.rpm`。然后将rpm文件分别上传到两台机器上，接下来我们就是用yum来安装MySQL。

在192.168.73.141（主1）执行如下命令，

```shell
# 使用yum安装rpm包
yum install mysql80-community-release-el7-3.noarch.rpm

# 安装MySQL社区版 时间较长 耐心等待
yum install mysql-community-server

#启动MySQL服务
service mysqld start
```

到这里，MySQL就安装完成，并且正常启动了。然后，我们用root账号登录MySQL，并创建一个可用的账号。

```shell
# 从MySQL的日志中 找到root账号的临时密码
grep 'temporary password' /var/log/mysqld.log

# 使用root账号登录 输入临时密码 登录成功
mysql -uroot -p

# 修改root账号的密码 使用MYSQL_NATIVE_PASSWORD的加密方式 这种方式大多数客户端都可以连接
ALTER USER 'root'@'localhost' IDENTIFIED WITH MYSQL_NATIVE_PASSWORD BY 'MyNewPass4!';

# 创建MySQL账号
CREATE USER 'USER'@'%' IDENTIFIED WITH MYSQL_NATIVE_PASSWORD BY 'USER_PWD';
# 对USER账号授权
GRANT ALL ON *.* TO 'USER'@'%';
# 刷新权限
FLUSH PRIVILEGES;
```

好了，到这里，在192.168.73.141上安装MySQL成功，并且创建了USER账户，我们可以使用NAVICAT等客户端连接。

**在192.168.73.142（主2）上也执行上面的命令**，这样我们在两台机器上都安装了MySQL。接下来，我们就要配置MySQL的主主结构了。

首先，我们修改192.168.73.141（主1）上的my.cnf文件。

```shell
vim /etc/my.cnf


datadir=/var/lib/mysql
socket=/var/lib/mysql/mysql.sock

log-error=/var/log/mysqld.log
pid-file=/var/run/mysqld/mysqld.pid

# 配置server-id 每个MySQL实例的server-id都不能相同
server-id=1
# MySQL的日志文件的名字
log-bin=mysql_master
# 作为从库时 更新操作是否写入日志 on：写入  其他数据库以此数据库做主库时才能进行同步
log-slave-updates=on

# MySQL系统库的数据不需要同步 我们这里写了3个  更加保险
# 同步数据时忽略一下数据库 但是必须在使用use db的情况下才会忽略；如果没有使用use db 比如create user  数据还是会同步的
replicate-ignore-db=information_schema
replicate-ignore-db=mysql
replicate-ignore-db=performance_schema
replicate-ignore-db=sys
# 使用通配符忽略MySQL系统库的表  这样在create user时也不会进行同步了
replicate_wild_ignore_table=information_schema.%
replicate_wild_ignore_table=mysql.%
replicate_wild_ignore_table=performance_schema.%
replicate_wild_ignore_table=sys.%
# MySQL系统库的日志不计入binlog 这样更加保险了
binlog-ignore-db=information_schema
binlog-ignore-db=mysql
binlog-ignore-db=performance_schema
binlog-ignore-db=sys
```

在192.168.73.142（主2）上也修改my.cnf文件，我们直接复制过去，只需要修改其中的两个地方，如下：

```shell
# 配置server-id=2
server-id=2
# MySQL的日志文件的名字 不改名字也可以 这里主要为了区分
log-bin=mysql_slave
```

配置文件都已经修改好了，我们分别在192.168.73.141（主1）和192.168.73.142（主2）上重启MySQL服务，

```shell
service mysqld restart
```

下面我们就要配置主从了，其实主主模式就是配置两个主从，先配置192.168.73.141（主1）->192.168.73.142（主2）的主从，然后再反过来配置192.168.73.142（主2）->192.168.73.141（主1）的主从，这样主主的模式就配置好了。

我们先来配置**192.168.73.141（主1）->192.168.73.142（主2）的主从**

先登录192.168.73.141（主1）的数据库，并执行如下命令：

```shell
# 创建备份的账号 使用MYSQL_NATIVE_PASSWORD的方式加密
mysql> CREATE USER 'repl_master'@'%' IDENTIFIED WITH MYSQL_NATIVE_PASSWORD BY 'password';
# 对repl_master授予备份的权限
mysql> GRANT REPLICATION SLAVE ON *.* TO 'repl_master'@'%';
# 刷新权限
mysql> FLUSH PRIVILEGES;

# 查看MySQL主节点的状态
mysql> SHOW MASTER STATUS;

+-------------------+---------+--------------+---------------------------------------------+------------------+
| File               | Position | Binlog_Do_DB | Binlog_Ignore_DB                             | Executed_Gtid_Set |
+-------------------+---------+--------------+---------------------------------------------+------------------+
| mysql_master.000001 |     516 |              | information_schema,mysql,performance_schema,sys |                  |
+-------------------+---------+--------------+---------------------------------------------+------------------+
1 row in set
```

我们要记住binlog文件的名字，也就是mysql_master.000001，和位置，也就是516。

然后，我们再登录到192.168.73.142（主2）的数据库，执行如下命令：

```shell
mysql> CHANGE MASTER TO
		   # MySQL主的IP
    ->     MASTER_HOST='192.168.73.141',
           # MySQL主的端口
    ->     MASTER_PORT=3306
           # MySQL主的备份账号
    ->     MASTER_USER='repl_master',
           # MySQL主的备份账号密码
    ->     MASTER_PASSWORD='password',
           # 日志文件 通过show master status得到的
    ->     MASTER_LOG_FILE='mysql_master.000001',
           # 日志文件位置 通过show master status得到的
    ->     MASTER_LOG_POS=516;
    
# 开启从库
mysql> START SLAVE;
# 查看从库的状态
mysql> SHOW SLAVE STATUS;
```

这样，**192.168.73.141（主1）->192.168.73.142（主2）的主从**就搭建好了。然后，我们再反过来，搭建**192.168.73.142（主2）->192.168.73.141（主1）的主从**。

先登录192.168.73.142（主2）的数据库，执行如下命令：

```shell
# 创建备份的账号 使用MYSQL_NATIVE_PASSWORD的方式加密
mysql> CREATE USER 'repl_slave'@'%' IDENTIFIED WITH MYSQL_NATIVE_PASSWORD BY 'password';
# 对repl_slave授予备份的权限
mysql> GRANT REPLICATION SLAVE ON *.* TO 'repl_slave'@'%';
# 刷新权限
mysql> FLUSH PRIVILEGES;

# 查看MySQL主节点的状态
mysql> SHOW MASTER STATUS;

+-------------------+---------+--------------+---------------------------------------------+------------------+
| File               | Position | Binlog_Do_DB | Binlog_Ignore_DB                             | Executed_Gtid_Set |
+-------------------+---------+--------------+---------------------------------------------+------------------+
| mysql_slave.000001 |     379 |              | information_schema,mysql,performance_schema,sys |                  |
+-------------------+---------+--------------+---------------------------------------------+------------------+
1 row in set
```

再登录到192.168.73.141（主1）的数据库，执行如下命令：

```shell
mysql> CHANGE MASTER TO
		   # MySQL主的IP
    ->     MASTER_HOST='192.168.73.142',
           # MySQL主的端口
    ->     MASTER_PORT=3306
           # MySQL主的备份账号
    ->     MASTER_USER='repl_slave',
           # MySQL主的备份账号密码
    ->     MASTER_PASSWORD='password',
           # 日志文件 通过show master status得到的
    ->     MASTER_LOG_FILE='mysql_slave.000001',
           # 日志文件位置 通过show master status得到的
    ->     MASTER_LOG_POS=379;
    
# 开启从库
mysql> START SLAVE;
# 查看从库的状态
mysql> SHOW SLAVE STATUS;
```

这样，**192.168.73.142（主2）->192.168.73.141（主1）的主从**也搭建好了。我们可以使用navicat分别连接192.168.73.141（主1）和192.168.73.142（主2），并执行建表、插入语句，验证一下主主同步是否成功，这里就不给大家演示了。

## Keepalived高可用

MySQL主主结构已经搭建好了，无论从哪个MySQL插入数据，都会同步到另外一个MySQL。虽然有了MySQL主主结构，但是不能保证高可用，比如，我们的应用程序连接的是192.168.73.141（主1），倘若192.168.73.141（主1）的MySQL挂掉了，我们的应用程序并不能自动的切换到192.168.73.142（主2），我们的应用程序也是不可用的状态。要做到这一点，就要借助于Keepalived。

Keepalived有两个主要的功能：

* 提供虚IP，实现双机热备
* 通过LVS，实现负载均衡

我们这里使用Keepalived，只需要使用其中的一个功能，提供虚IP，实现双机热备。我们需要在192.168.73.141（主1）和192.168.73.142（主2）上都安装Keepalived，执行命令如下：

```shell
yum install keepalived
```

我们直接使用yum进行安装。安装完之后，编辑keepalived的配置文件，首先编辑192.168.73.141（主1）上的配置文件，如下：

```shell
vim /etc/keepalived/keepalived.conf

# 全局配置 不用动  只需注释掉vrrp_strict
global_defs {
   notification_email {
     acassen@firewall.loc
     failover@firewall.loc
     sysadmin@firewall.loc
   }
   notification_email_from Alexandre.Cassen@firewall.loc
   smtp_server 192.168.200.1
   smtp_connect_timeout 30
   router_id LVS_DEVEL
   vrrp_skip_check_adv_addr
   #必须注释掉 否则报错
   #vrrp_strict
   vrrp_garp_interval 0
   vrrp_gna_interval 0
}

# 检查mysql服务是否存活的脚本
vrrp_script chk_mysql {
    script "/usr/bin/killall -0 mysqld"
}
# vrrp配置虚IP
vrrp_instance VI_1 {
    # 状态：MASTER  另外一台机器为BACKUP
    state MASTER
    # 绑定的网卡
    interface ens33
    # 虚拟路由id  两台机器需保持一致
    virtual_router_id 51
    # 优先级 MASTER的值要大于BACKUP
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    # 虚拟IP地址 两台keepalived需要一致
    virtual_ipaddress {
        192.168.73.150
    }
    # 检查脚本 vrrp_script的名字
    track_script {
        chk_mysql
    }
}

###后边的virtual_server全部注释掉 它是和LVS做负载均衡用的  这里用不到
###
```

再编辑192.168.73.142（主2）上的配置文件，只需要将state MASTER改为state BACKUP，如下：

```shell
state BACKUP
```

通过keepalived的配置，我们对外提供192.168.73.150的IP，这个IP实际指向是192.168.73.141（主1），因为它的state是MASTER。当keepalived检测到192.168.73.141（主1）上的MySQL不可用时，会自动切换到192.168.73.142（主2）。对于外部用户是无感知的，因为外部统一使用的是192.168.73.150。

我们再来看看检测的脚本`/usr/bin/killall -0 mysqld`，killall命令不是系统自带的，需要安装，我们还是使用yum来安装，如下：

```shell
# 先查询一下killall
yum search killall

#找到了psmisc.x86_64
Loading mirror speeds from cached hostfile
===============Matched: killall ================================
psmisc.x86_64 : Utilities for managing processes on your system

# 安装psmisc
yum install psmisc
```

这样我们就可以使用killall命令了。`killall -0 `并不是杀掉进程，而是检查进程是否存在，如果存在则返回0，如果不存在则返回1。当返回1时，keepalived就会切换主备状态。

好了，killall也介绍完了，我们在两台机器上启动keepalived，如下：

```shell
# 启动keepalived
service keepalived start
```

然后，我们在192.168.73.141（主1）上查看一下IP是否有192.168.73.150，如下：

```shell
ip addr

1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:0c:29:57:8c:cd brd ff:ff:ff:ff:ff:ff
    inet 192.168.73.141/24 brd 192.168.73.255 scope global noprefixroute ens33
       valid_lft forever preferred_lft forever
    inet 192.168.73.150/32 scope global ens33  # 我们看到了192.168.73.150
       valid_lft forever preferred_lft forever
    inet6 fe80::720b:92b0:7f78:57ed/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
```

到这里，keepalived的配置就完成了，我们通过navicat连接192.168.73.150，可以正常的连接数据库，实际上它连接的是192.168.73.141的数据库，我们操作数据库也是正常的。

然后，我们停掉192.168.73.141（主1）上的MySQL服务，

```shell
service mysqld stop

# 再用 ip addr查看一下
ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:0c:29:57:8c:cd brd ff:ff:ff:ff:ff:ff
    inet 192.168.73.141/24 brd 192.168.73.255 scope global noprefixroute ens33
       valid_lft forever preferred_lft forever
    inet6 fe80::720b:92b0:7f78:57ed/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
```

192.168.73.150的IP找不到了，我们再去192.168.73.142（主2）上去查看，可以发现192.168.73.150的IP。我们在navicat上操作数据库，是可以正常使用的。但这时实际连接的是192.168.73.142（主2）的数据库。我们是没有感知的。如果我们把192.168.73.141（主1）上的mysql服务再启动起来，192.168.73.150还会切换到192.168.73.141（主1）。

## 总结

我们通过MySQL主主结构+keepalived双机热备实现了MySQL的高可用，我们应用程序可以连接虚IP，具体连接的实际MySQL，不需要我们关心。如果我们再做读写分离的话，可以将MySQL（主2）作为主，配置数据库的主从关系。这时，虚IP连接的是MySQL（主1），MySQL（主1）将数据同步到MySQL（主2），然后MySQL（主2）再将数据同步到其他从库。如果MySQL（主1）挂掉，虚IP指向MySQL（主2）,MySQL（主2）再将数据同步到其他从库。

