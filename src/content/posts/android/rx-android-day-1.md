---
title: "Rx-Android Day 1"
pubDate: 2016-03-30
categories:
  - Android
---

I assume you guys already know a little bit of [Functional Programming](https://maryrosecook.com/blog/post/a-practical-introduction-to-functional-programming) and [Java Generics](https://docs.oracle.com/javase/tutorial/java/generics/index.html) but, don't really know about **HOT** and **COLD** observables of [rx-java](https://github.com/ReactiveX/RxJava).

Here's a simple introduction of [rx-java](https://github.com/ReactiveX/RxJava):

In ReactiveX an observer subscribes to an Observable. Then that observer reacts to whatever item or sequence of items the Observable emits. This pattern facilitates concurrent operations because it does not need to block while waiting for the Observable to emit objects, but instead it creates a sentry in the form of an observer that stands ready to react appropriately at whatever future time the Observable does so.

> You can treat observables like function calls.

A **HOT** Observable may begin emitting items as soon as it is created, and so any observer who later subscribes to that Observable may start observing the sequence somewhere in the middle. Examples of items emitted by a hot Observable might include *mouse & keyboard events, system events, or stock prices*.

A **COLD** Observable, on the other hand, waits until an observer subscribes to it before it begins to emit items, and so such an observer is guaranteed to see the whole sequence from the beginning. Examples of items emitted by a cold Observable might include *the results of a database query, file retrieval, or web request*.

The best definition I've ever heard is:

> Think of a hot Observable as a radio station. All of the listeners that are listening to it at this moment listen to the same song.
> 
> A cold Observable is a music CD. Many people can buy it and listen to it independently.
> 
> by Nickolay Tsvetinov

---

### Let's Write a "Cold" Observable Sample

```java
_log("Before Observable");

// Create a "cold" observable.
Observable<Boolean> ob = Observable
    // The "just" convert a boolean into an Observable.
    .just(true)
    // Transform the items emitted by an Observable by applying a function to each item.
    .map(new Func1<Boolean, Boolean>() {
        @Override
        public Boolean call(Boolean aBoolean) {
            _log("Within Observable");
            _doSomeLongOperation_thatBlocksCurrentThread();
            return aBoolean;
        }
    })
    // Run Observable asynchronously.
    .subscribeOn(Schedulers.io())
    // Emit the items to subscribers on main thread.
    .observeOn(AndroidSchedulers.mainThread());
```

So far the **COLD** Observable is created but yet executed! Actually the cold Observable is a function call waiting for being processed.

```java
// Observe and get the subscription (like a voucher).
Subscription subscription = ob
    .subscribe(new Action1<Boolean>() {
        @Override
        public void call(Boolean bool) {
            _log(String.format("Call with return value \"%b\"", bool));
        }
    });

_log("Right after Observable");
```
The **COLD** observable is processed when an observer subscribes to it immediately. But we trickly make the observable to be processed in a work thread (not main thread) and get the result in the main thread.

The output log is:

```bash
Before Observable (main thread)
Right after Observable (main thread)
Within Observable (NOT main thread)
performing long operation (NOT main thread)
onNext with return value "true" (main thread)
onComplete (main thread)
```

So what if you want the code to be synchronously executed? You just **REMOVE** the following line:

```
.subscribeOn(Schedulers.io())
```

And the output log will be:

```bash
Before Observable (main thread)
Within Observable (NOT main thread)
performing long operation (NOT main thread)
onNext with return value "true" (main thread)
onComplete (main thread)
Right after Observable (main thread)
```

Now you know the **COLD** observable is created and executed when an observer subscribes to it. A **COLD** Observable is "replayable", meaning it will "replay" its emissions to each Subscriber independently.

> A cold Observable is a music CD. Many people can buy it and listen to it independently.

---

### A "Hot" Observable Sample

```java
_log("Before Observable");

// The publish operator makes it a HOT observable.
Observable<Integer> ob = Observable
    .just(1)
    // The operator transforms it to a hot observable.
    .publish();

// Process the observable.
ob.connect();

// An subscriber subscribes to the observable.
ob.subscribe(new Action1<Integer>() {
    @Override
    public void call(Integer number) {
        _log(String.format("Call with return value \"%d\"", number));
    }
});

_log("Right after Observable");
```

The output log is:

```bash
Before Observable (main thread)
Right after Observable (main thread)
```

By calling [publish](http://reactivex.io/documentation/operators/publish.html), the observable transforms to a **HOT** observable.
You might notice that, the observer subscribes to the **HOT** observable right after the observable calls [connect](http://reactivex.io/documentation/operators/connect.html) to emit certain stream and the observer just got nothing. Because a **HOT** Observable will emit the same item at a given time to all its Subscribers, and it may not even care if any Subscribers are present.

> A hot Observable as a radio station. All of the listeners that are listening to it at this moment listen to the same song.

More info:

* [Sample of cold observable](https://gist.github.com/boyw165/0e4e3dc0e4e001c7aa2b0297d752ff4e)
* [Sample of hot observable](https://gist.github.com/boyw165/9a022d42c8fc978717321c6b588ed768)
* [Official document](http://reactivex.io/documentation/observable.html)

---

Next topic is, Subject and its Applications. link (coming soon)

