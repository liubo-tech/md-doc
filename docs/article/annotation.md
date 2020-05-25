## 一、前言

上一篇中，咱们介绍了如何使用jsp自定义标签编写权限框架。在jsp中，权限标签内的内容，只有在用户拥有权限的时候，才能够正常的展示。

但是，如果我们想限制用户访问某个链接该怎么办呢？

首先，我们先了解一下从浏览器地址栏输入地址到页面展现的全过程。

1. 在地址栏输入地址后，浏览器会想后台服务器发出请求；

2. 假设后台使用springMVC+spring+mybatis框架，请求会被spring的dispatcherServlet拦截，然后根据链接地址调用对应的controller；

3. 在controller方法中进行业务处理，然后将数据封装到ModelMap中，并返回到jsp页面；

至此，一个请求的全过程结束，浏览器渲染页面。

我们想要限制用户访问某个链接，需要在请求到达controller前进行拦截，判断用户是否有权限。

在这里我们使用spring的HandlerInterceptor实现

## 二、自定义权限注解

**首先，我们自定义注解`RequirePermission`，代码如下：**
```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String value();
}
```
**然后，我们实现HandlerInterceptor，代码如下：**
```java
public class RequirePermissionHandler extends HandlerInterceptorAdapter {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HandlerMethod myHandlerMethod = (HandlerMethod) handler;
        //通过handler获取请求对应的方法，并获取方法上的RequirePermission注解
        Annotation requirePermission = myHandlerMethod.getMethod().getAnnotation(RequirePermission.class);
        if (requirePermission!=null){
            //如果有权限注解，获取用户对应的权限
            Set<String> hasPermissions = (Set<String>) request.getSession().getAttribute(SESSION_ATTR_PERMISSION);
            //获取方法注解中要求的权限
            String requirePermission = ((RequirePermission) requirePermission).value();
            if (CollectionUtils.isEmpty(hasPermissions)||!hasPermissions.contains(requirePermission)){
                //用户没有权限，或不包含注解要求的权限，抛出异常
                throw new RequirePermissionException("user doesn't have this permission!");
            }
        }

        return true;
    }
}
```
1. 继承HandlerInterceptorAdapter，并重写preHandle方法。
2. 在方法中，首先判断请求的方法时候要求权限（有RequirePermission注解的），不要求权限的，将直接访问到controller对应的方法；要求权限的，判断用户是否有权限，没有权限的将会抛出异常。异常最好自定义，这样方便捕获权限异常，做相应的处理。

**自定义异常如下：**

```java
public class RequirePermissionException extends Exception {
    public RequirePermissionException(String exception){
        super(exception);
    }

    public RequirePermissionException(){
        super();
    }
}
```
**在controller中，使用注解@ExceptionHandler捕获权限异常，如下：**
```java
    //捕获权限异常
    @ExceptionHandler(RequirePermissionException.class)
    public void noPermission(HttpServletResponse response,HandlerMethod handler) throws IOException { 
        //跳转权限异常地址
        response.sendRedirect("/xxx/yyyy"); 
　　}
```
**最后，我们还需在springMVC的mvc-config.xml文件配置HandlerInterceptor，使咱们自定义的HandlerInterceptor生效**
```xml
    <mvc:interceptors>
        <mvc:interceptor>
            <mvc:mapping path="/**/*"/>
            <bean class="com.xx.yy.RequirePermissionHandler"/>
        </mvc:interceptor>
    </mvc:interceptors>
```
至此，权限的注解开发完了，我们可以在controller中非常方便的使用，控制访问链接的权限。实例如下：
```java
    @RequestMapping("xxxx")
    @RequirePermission(value = Constants.XXX_YYY_ZZZ)
    public String xxxx(Integer xxxId, ModelMap map){
        return "xxx/yyy";

    }
```
我们在controller中使用`@RequirePermission`注解，value是这个方法要求的权限，做到了链接的权限控制。

到这里，自制权限框架注解就介绍完了，可扩展的地方还有很多，例如：`@RequirePermission`的value可以是多个权限，并且多个权限间有“与”、“或”关系，这些就留给读者去发散，扩展了。






