---
title: "RxJava2: Reactive Destruction With Custom Observable & Single"
description: "The blog post refers to RxJava 2.1.13"
pubDate: 2018-04-30
categories:
  - Android
toc: true
---

> The blog post refers to [RxJava 2.1.13](https://github.com/ReactiveX/RxJava/releases/tag/v2.1.13)

> Updated on 2018 Apr 30 — Change title to “reactive destruction… ”

I guess many of you are already using libraries like [RxBinding](https://github.com/JakeWharton/RxBinding) (by Jake Wharton) and you might be familiar with the code snippet as below:

```kotlin
// Whatever Activity

private val mDisposables = CompositeDisposable()
private val mBtnFoo by lazy { findViewById<View>(R.id.foo) }

override fun onResume() {
    mDisposables.add(
        RxView.click(mBtnFoo)
              .subscribe { 
                  println("oh click on Foo")
              })
}

override fun onPause() {
    mDisposables.clear()
}
```

For those who are not familiar with [RxJava](https://github.com/ReactiveX/RxJava/releases) and [RxBinding](https://github.com/JakeWharton/RxBinding), the code above registers an `OnClickListener` in the `onResume()` and that listener is implicitly unregistered in the `onPause()`. That leads to an interesting question, which is

*How does the callback magically get recycled with only one simple line,* `mDisposables.clear()`*?*

That is the power of the custom `Observable` and I call it the **reactive destruction**. To know how to use it, let us look into `RxView.click()` function:

```java
public static Observable<Object> clicks(View view) {
    return new ViewClickObservable(view);
}
```

Oh, so it returns a `ViewClickObservable`, and what is it?

```java
final class ViewClickObservable extends Observable<Object> {
    private final View view;

    ViewClickObservable(View view) {
        this.view = view;
    }

    @Override 
    protected void subscribeActual(Observer<? super Object> observer) {
        Listener listener = new Listener(view);
        
        // Most importantly, pass the observer a Disposable
        observer.onSubscribe(listener);
        
        view.setOnClickListener(listener);
    }

    static final class Listener extends MainThreadDisposable 
                                implements OnClickListener {
        private final View view;

        Listener(View view, Observer<? super Object> observer) {
            this.view = view;
        }

        @Override 
        protected void onDispose() {
            view.setOnClickListener(null);
        }
    }
}
```

When there is an *observer* subscribes to this *observable*, the `subscribeActual` gets called. In the `subscribeActual` function, it creates a `Disposable` and passes the `Disposable` to the *observer*. **By doing so, the *observable* gives the *observer* the power of shutting down the source signal. When the *observer* decides not to receive any signal sending from the *observable*, it calls** `dispose()`**.** In this case, the `dispose()` unregisters the *onClickListener*.

Let us take a look of the first code snippet again:

```kotlin
// Whatever Activity

private val mDisposables = CompositeDisposable()
private val mBtnFoo by lazy { findViewById<View>(R.id.foo) }

override fun onResume() {
    mDisposables.add(
        RxView.click(mBtnFoo)
              .subscribe { 
                  println("oh click on Foo")
              })
}

override fun onPause() {
    mDisposables.clear()
}
```

The `Disposable` is like the voucher representing a reactive stream graph; `CompositeDisposable` is like a drawer in which you could put all the vouchers, and `clear()` is to dispose every single *disposable* from the collection.

**With the help of *Observable*, we could build custom *Observable* encapsulating some operation that allocates some resources when someone subscribes to it and release that resources automatically when no one is interested of it.**

That really makes the code neat and reactive!

### Custom Single

The code snippet of custom *Single* is very similar to custom *Observable* except the observer is `SingleObserver`.

```kotlin
class FooSingle : Single<Boolean>() {

    override fun subscribeActual(observer: SingleObserver<in Boolean>) {
        val d = FooDisposable(mWidget)
        observer.onSubscribe(d)

        try {
            // Allocate memory or register listeners...

            // Tell the observer the sole result
            observer.onSuccess(true)
        } catch (err: Throwable) {
            observer.onError(err)
        }
    }

    internal class FooDisposable : Disposable {

        @Volatile
        private var disposed = false

        override fun isDisposed(): Boolean {
            return disposed
        }

        override fun dispose() {
            disposed = true

            // Release the memory or unregister the listeners...
        }
    }
}
```

The difference between *Observable* and *Single* is the number of sent values, where *Observable* emits values over time as opposed to *Single* emits single value or error.

In many cases like network, the async task gives us single result, in essence, *Single* fits the needs better. In the following figure, **there is a cross at the end of the stream indicating this *source* gets nothing to send, and source calls *observer’s*** `onComplete`**.** So *Single* implicitly finishes its observers!

![](/images/2018-04-30-rxjava2-reactive-destruction-with-custom-observable-single/img-01.png)

**Indeed, the** `onComplete` **might cause your custom disposable’s** `dispose()` **not properly called. That depends on what observer you attach to the source.** Usually, we call `subscribe()` and that attaches a [`ConsumeSingleObserver`](https://github.com/ReactiveX/RxJava/blob/2.x/src/main/java/io/reactivex/internal/observers/ConsumerSingleObserver.java#L59-L68) to the upstream. Let’s look into this particular observer:

```java
public final class ConsumerSingleObserver<T>
    extends AtomicReference<Disposable>
    implements SingleObserver<T>, 
               Disposable, 
               LambdaConsumerIntrospection {

    // ...

    @Override
    public void onSubscribe(Disposable d) {
        DisposableHelper.setOnce(this, d);
    }

    @Override
    public void onSuccess(T value) {
        lazySet(DisposableHelper.DISPOSED);
        try {
            onSuccess.accept(value);
        } catch (Throwable ex) {
            // ...
        }
    }

    @Override
    public void dispose() {
        DisposableHelper.dispose(this);
    }

    // ...
}
```

In the sample, the observer is `SingleObserver` also a `Disposable`. As an observer, `onSubscribe()` is called when this observer subscribes to an observable. So in `onSubscribe()`, you need to keep the given disposable and use it to destroy the source chain later.

The `onSuccess()` is called when receiving the signal. **Look carefully into** `onSuccess()`**; it replaces the given disposable with a static dummy disposable**. Which means this special [`ConsumerSingleObserver`](https://github.com/ReactiveX/RxJava/blob/2.x/src/main/java/io/reactivex/internal/observers/ConsumerSingleObserver.java#L59-L68) implicitly blind itself once it gets value, and that is why your disposable’s `dispose()` won’t be called in the end. Actually, the [`LambdaObserver`](https://github.com/ReactiveX/RxJava/blob/2.x/src/main/java/io/reactivex/internal/observers/LambdaObserver.java#L85-L96) (used by Observable’s `subscribe()`) do so in `onComplete()` too.

```java
public final class LambdaObserver<T> 
    extends AtomicReference<Disposable>
    implements Observer<T>, 
               Disposable, 
               LambdaConsumerIntrospection {

    // ...

    @Override
    public void onComplete() {
        if (!isDisposed()) {
            lazySet(DisposableHelper.DISPOSED);
            try {
                onComplete.run();
            } catch (Throwable e) {
                // ...
            }
        }
    }

    // ...
}
```

Not all the observers behave like so, for example, the `test()` observer always keeps the given disposable, and guarantees the disposable’s `dispose()` to trigger.

### A Concrete Example

I want to establish a binding in between my *Widget* component and the observable *Model* component. The binding would be destroyed by merely calling the disposable’s `dispose()`. Thus, I utilize the custom *Observable* as below:

```kotlin
class BindWidgetWithModel<T>(widget: IWidget<T>,
                             model: T,
                             caughtErrorSignal: Observer<Throwable>? = null)
    : Observable<Boolean>() {

    private val mWidget = widget
    private val mModel = model

    private val mCaughtErrorSignal = caughtErrorSignal

    override fun subscribeActual(observer: Observer<in Boolean>) {
        val d = UnbindDisposable(mWidget, mCaughtErrorSignal)
        observer.onSubscribe(d)

        if (!d.isDisposed) {
            try {
                mWidget.bindModel(mModel)

                observer.onNext(true)
            } catch (err: Throwable) {
                observer.onNext(false)

                mCaughtErrorSignal?.onNext(err)
            }
        }
    }

    internal class UnbindDisposable<T>(widget: IWidget<T>,
                                       caughtErrorSignal: Observer<Throwable>?) 
        : Disposable {

        @Volatile
        private var disposed = false

        private val widget = widget
        private val caughtErrorSignal = caughtErrorSignal

        override fun isDisposed(): Boolean {
            return disposed
        }

        override fun dispose() {
            disposed = true

            try {
                widget.unbindModel()
            } catch (err: Throwable) {
                caughtErrorSignal?.onNext(err)
            }
        }
    }
}

// Separate file
interface IWidget<in T> {

    fun bindModel(model: T)

    fun unbindModel()
}
```

See, I don’t call `onComplete()` here.

### Conclusion

Some people only use RxJava as an async task framework, like defer-promise. Actually RxJava is more than that, and there is a learning curve for using RxJava correctly because the details hide both in the observables and observers. In general, for observers, `onComplete()` is like a terminal signal, and that is likely to blind the reactive stream from calling your disposable’s `dispose()`.

There is still a simple rule, **use custom *Observable* and don’t call** `onComplete()` **when you want to build a reactive source which will destruct itself when disposed.** As opposed to custom *Single* is for one-time task and should release the memory or listeners right after `onSuccess()` call rather than `dispose()`.

**Lastly, reactive destruction is also important to the system design where it minimizes the lines of ambiguous code that hides the real intent.**

Thanks for reading. If you think this post is helpful, please don’t hesitate to give the claps. Or if you found some mistakes I made, feel free to drop a note here. ✨
