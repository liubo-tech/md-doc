进入2018年以来，在IDEA插件中心中，安装插件经常安装失败，报连接超时的错误。如下：

![image1](http://testimage.alwaysnb.com/blog/20180802092006.png)

我们发现连接IDEA的插件中心使用的是https的链接，我们在浏览器中使用https访问插件中心并不能访问。
而使用普通的http是可以访问插件中心的。

因此，我们需要在IDEA中设置不使用https。具体如下：

![image2](http://testimage.alwaysnb.com/blog/20180802092941.png)

我们在settings中，找到如图所示位置，去掉use secure connection前面的勾，这样我们就可以
使用普通的http连接插件中心了。插件可以顺利下载安装了。

赶快试一下吧！！