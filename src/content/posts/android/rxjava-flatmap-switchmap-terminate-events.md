---
title: "RxJava Pro-Tip: How flatMap and switchMap handle terminate events"
description: "How does a flatMap or switchMap handle a terminate event such as Observable.empty() or Completable.complete()"
pubDate: 2018-12-04
categories:
  - Android
toc: true
---

In this article, we will discuss the confusing question of, “How does a `flatMap` or `switchMap` handle a terminate event such as `Observable.empty()` or `Completable.complete()`.” We will also discuss how we can handle `null` state inside of a RxJava chain.

Before RxJava and Kotlin became standard practice, developers would use **null** to represent **NOTHING**. This “nothing” state has been used as a stop or return early trigger. What about with RxJava? How do we achieve an equivalent **null** or **NOTHING** state in the modern immutable, reactive world? Luckily, the combination of the [***Optional*** class](https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html) and a reactive “empty” state solve this problem.

When dealing with `Observable.empty()`, `Completable.complete()`, and similar RxJava terminate events, there is usually some misunderstanding around how they work inside of `flatMap` and `switchMap`.

---

When I return an `Observable.empty()` in the **flatMap** or **switchMap**, do I terminate the entire stream?

---

The answer is **NO**, it won’t. Let me tell you why:

#### Analyzing the result in the chain

Let’s run a small unit-test to see the result.

```kotlin
val upstream = PublishSubject.create<Int>()
upstream.doOnDispose { Timber.d("Uh, the upstream gets disposed") } // This log will never print.

val tester = upstream
    .flatMap { v ->
        when (v) {
            0 -> {
                Timber.d("flatMap produces an empty")
                Observable.empty<Int>()
            }
            else -> Observable.just(v)
        }
    }
    .test()

upstream.onNext(0) // Will return a complete in flatMap.
upstream.onNext(1) // If the stream dies, we'll never emit this value successfully.

tester.assertValueCount(1) // Actually, the stream is still alive because flatMap ignores the complete!
```

In the snippet, we send out an `Observable.empty()`. This function calls the observer’s `onComplete` immediately. Typically, this disposes the chain, thus never emitting future values. However, in this test, we see that the second value is indeed emitted. The observer still gets the value! The stream is still alive. How is this possible?

#### Diving into flatMap

When you call `flatMap`, you are required to create a new `Observable` that is used as the new `ObservableSource`. This source is used to create an `ObservableFlatMap` which internally creates another `Observer` that is subscribed to the upstream. This `Observer` acts as a man-in-the-middle by observing the upstream and redirect the result to the downstream. What we really care about is the code inside the `subscribeInner` function as below:

![Snippet of ObservableFlatMap.java](/images/2018-12-04-rxjava-flatmap-switchmap-terminate-events/img-01.png)  
*Snippet of ObservableFlatMap.java*

Both `Observable.just()` and `Observable.empty()` produce a **Callable Observable**. We can see that this source is handled by the first if-statement, which does not propagate the complete. What about the else-statement? If the returned `Observable` is custom, it will subscribe to the returned `Observable` with an inner observer, also ignoring the complete.

#### Insights

---

As can be seen, we can safely use `Observable.empty()` to indicate a **NOTHING** state in `flatMap` or `switchMap`.

---

**Note:**

For those who prefer to use [*RxRelay*](https://github.com/JakeWharton/RxRelay) to avoid any accidental stream termination, this safeguard doesn’t necessarily require the [*RxRelay*](https://github.com/JakeWharton/RxRelay).

Lastly, the `flatMap` and `switchMap` are similar, so I won’t show the `switchMap` here.

Thanks for reading 😀. Please support this guide with your 👏👏👏 using the clap button and help it spread to a wider audience 🙏
