# Dockder学习笔记

## Docker安装

卸载系统原有docker：

```shell
$ sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
```

安装docker社区版：

设置docker仓库

```shell
$ sudo yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2
```

添加yum源

```shell
$ sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
```

安装docker：

```shell
$ sudo yum install docker-ce docker-ce-cli containerd.io
```

启动docker服务：

```shell
$ sudo systemctl start docker
```

运行测试：

```shell
$ sudo docker run hello-world
```

测试成功。

卸载docker：

```shell
$ sudo yum remove docker-ce
$ sudo rm -rf /var/lib/docker

```

## docker基础命令

查看docker版本：

```shell
docker --version
```

查看本地镜像：

```shell
docker image ls
```

查看本地容器：

```shell
docker container ls --all
```

## 构建自己的镜像

构建示例：

```shell
git clone https://github.com/dockersamples/node-bulletin-board
cd node-bulletin-board/bulletin-board-app
```

创建dockerfile：

```shell
# Use the official image as a parent image
FROM node:current-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy the file from your host to your current location
COPY package.json .

# Run the command inside your image filesystem
RUN npm install

# Inform Docker that the container is listening on the specified port at runtime.
EXPOSE 8080

# Run the specified command within the container.
CMD [ "npm", "start" ]

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .
```

构建镜像：

```shell
docker image build -t bulletinboard:1.0 .
```

运行构建的镜像：

```shell
docker container run --publish 8000:8080 --detach --name bb bulletinboard:1.0
```

* --publish 8000:8080   发布端口
* --detach   后台运行
* --name bb    指定容器名称

强行删除容器：

```shell
docker container rm --force bb
```

帮助：`docker container --help`。

docker登录：

```shell
docker login
```

docker 打包：

```shell
docker image tag bulletinboard:1.0 ronaldoliubo/bulletinboard:1.0
```

推送镜像到docker hub：

```shell
docker image push ronaldoliubo/bulletinboard:1.0
```

## Docker的数据管理

![types-of-mounts](D:\Vue-Project\vue-press\docs\article\docker-1.assets\types-of-mounts.png)

* volume：数据存储在主机上，非docker进程不能修改；
* bind mount：数据存储在主机上，任何进程都可以修改；

