今天上班时，同事发现了一个比较有意思的问题。他把一个String类型的参数传入方法，并在方法内改变了引用的值。
然后他在方法外使用这个值，发现这个String还是之前的值，并没有改变。

这里要向大家介绍一下，大家都知道java在传参时分为值 **传递** 和 **引用传递** 。参数为基本类型时是值传递，
参数为封装类型时是引用传递。例如：

## 基本类型参数

```java
public class Test {
    public static void main(String[] args) {
        int num = 0 ;
        changeNum(num);
        System.out.println("num="+num);
    }

    private static void changeNum(int num) {
        num = 1;
    }
}
```
打印的结果是`num=0`。

## 封装类型参数

```java
public class Test {
    public static void main(String[] args) {
        Product p = new Product();
        p.setProName("before");
        p.setNum(0);
        changeProduct(p);
        System.out.println("p.proName="+p.getProName());
        System.out.println("p.num="+p.getNum());
    }

    private static void changeProduct(Product p) {
        p.setProName("after");
        p.setNum(1);
    }
}

class Product {
    private int num;
    private String proName;

    public int getNum() {
        return num;
    }

    public void setNum(int num) {
        this.num = num;
    }

    public String getProName() {
        return proName;
    }

    public void setProName(String proName) {
        this.proName = proName;
    }
}

```
运行的结果是：`p.proName=after`和`p.num=1` 。

上面的两个例子是明显的值传递和引用传递。但是如果参数是String类型呢？我们看一下具体的例子：

```java
public class Test {
    public static void main(String[] args) {
        String str = "ab";
        changeString(str);
        System.out.println("str="+str);
    }

    private static void changeString(String str) {
        str = "cd";
    }
}
```

大家猜一下运行结果是什么呢？按照前面的例子，String应该是一个封装类型，它应该是引用传递，是可以改变值得，
运行的结果应该是"cd"。我们实际运行一下看看，

`str=ab`,这如何解释呢？难道String是基本类型？也说不通呀。

这就要从java底层的机制讲起了，java的内存模型分为 **堆** 和 **栈** 。
    
    1.基本类型的变量放在栈里；
    2.封装类型中，对象放在堆里，对象的引用放在栈里。

**java在方法传递参数时，是将变量复制一份，然后传入方法体去执行。**  这句话是很难理解的，也是解释这个
问题的精髓。我们先按照这句话解释一下基本类型的传递

>1. 虚拟机分配给num一个内存地址，并且存了一个值0.
>2. 虚拟机复制了一个num，我们叫他num'，num'和num的内存地址不同，但存的值都是0。
>3. 虚拟机讲num'传入方法，方法将num'的值改为1.
>4. 方法结束，方法外打印num的值，由于num内存中的值没有改变，还是0，所以打印是0.
    
我们再解释封装类型的传递：

> 1. 虚拟机在堆中开辟了一个Product的内存空间，内存中包含proName和num。
> 2. 虚拟机在栈中分配给p一个内存地址，这个地址中存的是1中的Product的内存地址。
> 3. 虚拟机复制了一个p，我们叫他p',p和p'的内存地址不同，但它们存的值是相同的，都是1中Product的内存地址。
> 4. 将p'传入方法，方法改变了1中的proName和num。
> 5. 方法结束，方法外打印p中变量的值，由于p和p'中存的都是1中Product的地址，但是1中Product里的值发生了改变，
         所以，方法外打印p的值，是方法执行以后的。我们看到的效果是封装类型的值是改变的。
         
最后我们再来解释String在传递过程中的步骤：

> 1. 虚拟机在堆中开辟一块内存，并存值"ab"。
> 2. 虚拟机在栈中分配给str一个内存，内存中存的是1中的地址。
> 3. 虚拟机复制一份str，我们叫str'，str和str'内存不同，但存的值都是1的地址。
> 4. 将str'传入方法体
> 5. 方法体在堆中开辟一块内存，并存值"cd"
> 6. 方法体将str'的值改变，存入5的内存地址
> 7. 方法结束，方法外打印str，由于str存的是1的地址，所有打印结果是"ab"
    
这样我们理解了java在方法传参的整个过程。其实还是上面那句比较重要的话 **java在方法传递参数时，是将变量复制一份，然后传入方法体去执行。**
