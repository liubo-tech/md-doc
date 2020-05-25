## 一、概述

在我们的系统中，很多时候都用到了权限。最简单的权限就是登录。登录了，我就可以自己的相关信息；没有登录，就不能看到。

目前比较流行的权限框架就是apache shiro和spring security，大家在选择时比较青睐apache shiro，因为spring security的拦截器过多，导致性能下降。

笔者在搭建系统时也是选择了Apache shiro。在权限框架中，最常用的两个地方是：

1. 在controller层，使用`@RequiresPermissions`注解，标识这个链接只能是拥有这个权限的用户才能使用。

2. 在jsp中，使用`<shiro:hasPermission>`标签，标识着拥有这个权限的用户才能够展示标签中的内容。

笔者在搭建系统时，由于采用了集群，session统一用redis管理，在使用shiro框架时，重写了shiro的sessionDAO，CRUD都在redis中。

在使用shiro的过程中，笔者发现一个request请求，在shiro的session管理中调用了40多次redis。虽然redis的性能非常好，但是调用40多次也没有必要。

所以，笔者基于java注解和jsp标签简单的实现了权限框架，它有一定的局限性，不过大家可以进行扩展。

## 二、jsp标签

在这一篇中，先向大家介绍jsp的权限标签。

**首先，编写jsp标签的实现类，如下：**
```java
public class HasAnyPermission extends TagSupport {
    @Setter@Getter
    private String permissions;

    @Override
    public int doStartTag() throws JspException {
        HttpSession session = pageContext.getSession();
        String[] arrPermissions = permissions.split(",");
        //用户是否登录
        if (UserSessionUtil.isLogin(session)){
            Set<String> hasPermissions = (Set<String>) session.getAttribute(SESSION_ATTR_PLAT_PERMISSION);
            //用户是否分配了权限　
            if(CollectionUtils.isNotEmpty(hasPermissions)){
                for (String psermission : arrPermissions){
                    //用户分配的权限中，是否包含该权限
                    if (hasPermissions.contains(psermission)){
                        return TagSupport.EVAL_BODY_INCLUDE;
                    }
                }
            }
            return TagSupport.SKIP_BODY;
        }else {
            return TagSupport.SKIP_BODY;
        }
    }
}
```
在这里，permissions为标签中传过来的权限，可以为多个，使用“,”隔开，这个可以大家可以扩展。

例如：自定义分隔符。这里就不详细介绍了；多个权限间的“或”，“与”关系等。

在jsp当中，标签都是成对出现的，在开始标签时，将会执行`doStartTag()`方法，对应的在结束标签时，将执行`doEndTag()`方法，上面的类中没有写出`doEndTag()`方法，将会执行父类`TagSupport` 中的`doEndTag()`方法。

`doStartTag()`方法中的具体逻辑这里不做介绍，无非就是判断这个用户有没有这个权限。最关键的是return的内容：

+ EVAL_BODY_INCLUDE：如果返回这个，则标签包含的内容会展示出来。

+ SKIP_BODY ：标签包含的内容不会展示。

**其次，创建tld文件**

在 webapp/WEB-INF/ 下，创建taglib目录，并在taglib目录中，创建xxx.tld文件，如下：
```xml
<?xml version="1.0" encoding="ISO-8859-1" ?>
<!DOCTYPE taglib PUBLIC "-//Sun Microsystems, Inc.//DTD JSP Tag Library 1.2//EN"
        "http://java.sun.com/dtd/web-jsptaglibrary_1_2.dtd">
<taglib>
    <tlib-version>1.1.2</tlib-version>
    <jsp-version>1.2</jsp-version>
    <short-name>Apache Shiro</short-name>
    <uri>/WEB-INF/taglib/xxx</uri>    <!-- 配置成tld文件的目录，xxx为tld文件的文件名 -->
    <description>Apache Shiro JSP Tag Library.</description>
    <tag>
        <name>hasAnyPermissions</name>    <!--标签的名称 -->
        <tag-class>com.rent.common.shiro.HasAnyPermission</tag-class> <!-- 实现的类，上面编写的HasAnyPermission类 -->
        <body-content>JSP</body-content>
        <attribute>                               <!--传入参数-->
            <name>permissions</name>              <!--参数名称-->  
            <required>true</required>             <!--是否必传-->
            <rtexprvalue>true</rtexprvalue>       <!--是否可用jsp表达式-->
        </attribute>
    </tag>
</taglib>
```
uri的参数需要在jsp中引用，tag的name属性是标签的名称，permissions是变量的名称，由jsp中传入，而且必传。

**最后，标签的使用**

在jsp的头部引入自定义标签，如下：
```xml
<%@taglib prefix="pm" uri="/WEB-INF/taglib/xxx"%>
```
uri为tld文件中配置的uri，prefix是标签的前缀，可以自定义，我们定义成pm。

权限标签的使用，如下：
```xml
<pm:hasAnyPermissions permissions="show">哈哈</pm:hasAnyPermissions>
```
当我们在编译器中敲入 <pm:，就会出现提示，hasAnyPermissions就是我们在tld文件中定义的name，permissions是需要的权限，而且必传。

这样，当用户拥有“show”这个权限时，将会展示出“哈哈”，没有“show”权限时，不会展示。


