# MySQL主从同步配置

1.编辑MySQL**主**上的/etc/my.cnf，

```shell
log-bin=imooc_mysql
server-id=1
```

* `log-bin`：MySQL的bin-log的名字
* `server-id`: MySQL实例中全局唯一，并且大于0。

2.编辑MySQL**从**上的/etc/my.cnf，

```she
server-id=2
```

* `server-id`: MySQL实例中全局唯一，并且大于0。与主上的`server-id`区分开。

3.在MySQL**主**上创建用于备份账号

```mysql
mysql> CREATE USER 'repl'@'%' IDENTIFIED BY 'password';
mysql> GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
```

4.MySQL**主**上加锁，阻止所有的写入操作

```mysql
mysql> FLUSH TABLES WITH READ LOCK;
```

5.MySQL**主**上，查看bin-log的文件名和位置

```mysql
mysql > SHOW MASTER STATUS;
```

6.MySQL**主**上dump所有数据，

```shell
mysqldump --all-databases --master-data > dbdump.db -uroot -p
```

7.MySQL**主**进行解锁，解锁后，主上可以写入数据

```mysql
mysql> UNLOCK TABLES;
```

8.MySQL**从**上导入之前dump的数据

```mysql
mysql < aa.db -uroot -p
```

9.MySQL**从**上配置主从连接信息

```mysql
mysql> CHANGE MASTER TO
    ->     MASTER_HOST='master_host_name',
    ->     MASTER_PORT=port_num
    ->     MASTER_USER='replication_user_name',
    ->     MASTER_PASSWORD='replication_password',
    ->     MASTER_LOG_FILE='recorded_log_file_name',
    ->     MASTER_LOG_POS=recorded_log_position;
```

* `master_host_name`: MySQL主的地址
* `port_num`: MySQL主的端口（数字型）
* `replication_user_name`:  备份账户的用户名
* `replication_password`: 备份账户的密码
* `recorded_log_file_name`：bin-log的文件名
* `recorded_log_position`: bin-log的位置（数字型）

bin-log的文件名和位置 是 步骤5中的`show master status`得到的。

10.MySQL**从**上开启同步

```mysql
mysql> START SLAVE;
```

查看MySQL**从**的状态

```mysql
show slave status;
```



