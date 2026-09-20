---
title: "RxJava2: “TakeWhenObservable”"
description: "Updated: Jun 28, 2018"
pubDate: 2018-06-22
categories:
  - Android
toc: true
---

> Updated: Jun 28, 2018

> The code snippet is based on RxJava [2.1.13](https://github.com/ReactiveX/RxJava/releases/tag/v2.1.13)

RxJava2 has many convenient operators, where one of my favorite is [`takeUntil`](http://rxmarbles.com/#takeUntil).

![](/images/2018-06-22-rxjava2-takewhenobservable/img-01.png)

The `takeUntil` operator essentially says: “I am interested in **this** stream/Observable until something happens on ***that*** stream/Observable”.

It leads me to an interesting question, **what if I want it temporarily to throttle the stream/Observable: Collect the items emitted during the filter is on and dump the collection when the filter is off?** Which looks like this:

![like a transistor with buffer](/images/2018-06-22-rxjava2-takewhenobservable/img-02.png)  
*like a transistor with buffer*

The Rx marble diagram is:

![](/images/2018-06-22-rxjava2-takewhenobservable/img-03.png)

Therefore, I create `TakeWhenObservable` by referring to [`zip`](https://github.com/ReactiveX/RxJava/blob/2.x/src/main/java/io/reactivex/internal/operators/observable/ObservableZip.java) operator. The usage is quite simple,

```
TakeWhenObservable(src = $YOUR_SOURCE_OBSERVABLE,                   whenSrc = $YOUR_RELAY_SIGNAL,                   bufferSize = $AS_IT_DESCRIBED)
```

Internally, this `TakeWhenObservable` *Observable* looks like:

![Internal look](/images/2018-06-22-rxjava2-takewhenobservable/img-04.png)  
*Internal look*

(Optional) This is the full code that you could directly use:

```kotlin
/**
 * The Observable that emits the items emitted by the [src] Observable when a
 * second ObservableSource, [whenSrc], emits an true; It buffers all them items
 * emitted by the [src] when [whenSrc] emits an false.
 */
open class TakeWhenObservable<T>(private val src: ObservableSource<T>,
                                 private val whenSrc: ObservableSource<Boolean>,
                                 private val bufferSize: Int = Flowable.bufferSize())
    : Observable<T>() {

    override fun subscribeActual(observer: Observer<in T>) {
        val coordinator = Coordinator(src = src,
                                      whenSrc = whenSrc,
                                      actualObserver = observer,
                                      bufferSize = bufferSize)
        coordinator.subscribe()
    }

    internal class Coordinator<T>(val src: ObservableSource<T>,
                                  val whenSrc: ObservableSource<Boolean>,
                                  val actualObserver: Observer<in T>,
                                  val bufferSize: Int)
        : AtomicBoolean(false),
          Disposable {

        @Volatile
        private var canDrain = false
        private val queue = SpscLinkedArrayQueue<T>(bufferSize)

        private val srcObserver = SrcObserver(parent = this)
        private val whenObserver = WhenObserver(parent = this)

        fun subscribe() {
            // Establish a connections between this coordinator and the external
            // observer.
            actualObserver.onSubscribe(this)

            // Establish two connections between this coordinator and the two
            // inner observers observing the two external input signals.
            src.subscribe(srcObserver)
            whenSrc.subscribe(whenObserver)
        }

        fun bufferIt(t: T) {
            queue.offer(t)
            // Drop item when size is over the buffer size
            while (queue.size() > bufferSize) {
                queue.poll()
            }
        }

        fun canDrain(t: Boolean) {
            canDrain = t
        }

        fun drain() {
            synchronized(this) {
                while (!isDisposed &&
                       canDrain &&
                       !srcObserver.done &&
                       !queue.isEmpty) {
                    val t = queue.poll()!!
                    this.actualObserver.onNext(t)
                }
            }
        }

        fun onComplete() {
            if (!srcObserver.done) {
                actualObserver.onComplete()
            }
        }

        fun onError(err: Throwable) {
            actualObserver.onError(err)
        }

        override fun isDisposed(): Boolean {
            return get()
        }

        override fun dispose() {
            // Mark disposed!
            set(true)

            srcObserver.dispose()
            whenObserver.dispose()

            synchronized(this) {
                queue.clear()
            }
        }
    }

    internal class SrcObserver<T>(val parent: Coordinator<in T>)
        : Observer<T> {

        @Volatile
        var done = false

        val disposable = AtomicReference<Disposable>()

        override fun onComplete() {
            parent.onComplete()
            done = true
        }

        override fun onSubscribe(d: Disposable) {
            DisposableHelper.setOnce(disposable, d)
        }

        override fun onNext(t: T) {
            if (!done) {
                parent.bufferIt(t)
                parent.drain()
            }
        }

        override fun onError(e: Throwable) {
            if (!done) {
                parent.onError(e)
            }
        }

        fun dispose() {
            DisposableHelper.dispose(disposable)
        }
    }

    internal class WhenObserver<T>(val parent: Coordinator<in T>)
        : Observer<Boolean> {

        @Volatile
        var done = false

        val disposable = AtomicReference<Disposable>()

        override fun onComplete() {
            // Close the throttle permanently
            parent.canDrain(false)
        }

        override fun onSubscribe(d: Disposable) {
            DisposableHelper.setOnce(disposable, d)
        }

        override fun onNext(t: Boolean) {
            if (!done) {
                parent.canDrain(t)
                parent.drain()
            }
        }

        override fun onError(e: Throwable) {
            if (!done) {
                parent.onError(e)
            }
        }

        fun dispose() {
            DisposableHelper.dispose(disposable)
        }
    }
}
```

(Optional) **Unit test**: [link](https://gist.github.com/boyw165/e2e2951039c7eedcbe2696409a2b14e9).

### A Concrete Example

As Android developers, I guess you guys have been suffering less or more by the *Activity* or *Fragment* lifecycle when it comes with **onActivityResult**.

![](/images/2018-06-22-rxjava2-takewhenobservable/img-05.png)

At least from my observation, **onActivityResult** is called before your *Activity* or *Fragment’s* **onResume**.

Why is it a problem?

The answer might be: in the most cases, we want to access UI or change the states of UI according to the returned result in *onActivityResult*. If you do change UI in *onActivityResult*, it is very likely to crash the app because the *Activity* or *Fragment* is still in the **PAUSE/STOP** state.

One way to solve it is to cache the returned result somewhere, and consume it when the *Activity* or *Fragment* is resumed. Here is a snippet of using `TakeWhenObservable` to guarantee the moment of getting result in **RESUME** state.

```kotlin
// Activity or Fragment

private val mResumeSignal = PublishSubject.create<Boolean>()
private val mResultSignal = PublishSubject.create<Any>()

override void onResume() {
    super.onResume();
    mResumeSignal.onNext(true);
}

override void onPause() {
    super.onPause();
    mResumeSignal.onNext(false);
}

override void onActivityResult(requestCode: Int, 
                               resultCode: Int, 
                               data: Intent) {
    mResultSignal.onNext(...);
}

// Postpone the moment of sending the result to your Presenter or domain 
// component regardless of handling save-restore
fun onGetResult(): Observable<Any> {
    return TakeWhenObservable(src = mResultSignal,
                              whenSrc = mResumeSignal,
                              bufferSize = 1)
}
```

### That’s it

> Jun 22: I’ll figure it out if it’s possible and how to add this new Observable to the RxJava2 library.  
> The discussion thread on RxJava official site is [here](https://github.com/ReactiveX/RxJava/issues/6061).

> Jun 24: Thanks for Karnok’s existing hard work, and this Observable is already considered as in his [Github repository](https://github.com/akarnokd/RxJava2Extensions#flowabletransformersvalve).

> Jun 28: Thanks for [Jaime Cham](https://medium.com/u/844b39bbb0dc)’s suggestion, we add the diagrams for the signal flow and internal look.

Thanks for reading. If you think this post is helpful, please don’t hesitate to give the claps. Or if you found some mistakes I made, feel free to drop a note here. ✨
