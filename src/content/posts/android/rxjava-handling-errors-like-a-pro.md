---
title: "RxJava: Handling Errors Like a Pro"
description: "Why the error is the terminate event in RxJava? How to bring the reactive streams back to alive after it is terminated by an error?"
pubDate: 2019-04-21
categories:
  - Android
toc: true
---

![](/images/2019-04-21-rxjava-handling-errors-like-a-pro/img-01.png)

In this article, we aim to answer the following questions.

1.  Why is an error event also a terminate event in RxJava?
2.  How can we bring the reactive streams back alive after they are terminated by an error?
3.  What are some strategies for handling error events in RxJava?

*Note: Most of the code snippets are written in Kotlin.*

### Why is an Error Event also a Terminate Event in RxJava?

You might be asking, “Why does throwing an error cause a terminate event in RxJava?”. Let’s use a coffee machine as an example to explain how RxJava propagates the error and terminates the reactive stream.

```kotlin
fun setupCoffeeMachine(...) {
    clicks.switchMapSingle {
            brewCoffee()
                .timeout(3, TimeUnit.MINUTES, Schedulers.computation())
                // To UI states ---------------------------------------------->
                .toObservable()
                .map { UiState.Done }
                .startWith(UiState.IN_PROGRESS)
                .onErrorReturn { err -> Observable.just(UiState.Error(err)) }
                // <-----------------------------------------------------------
        }
        .retry() // Protect the stream from terminating
        .observeOn(AndroidSchedulers.mainThread())
        .subscribe { s ->
            // Reflect the UI states
            when (s) {
                is UiState.Error -> Toast.makeText(s.error, ...).show()
            }
        }
        .disposeOnDestroy()
}
```

In the above code snippet, we connect the button `clicks` Observable to a `brewCoffee()` Observable with a timeout of 3 minutes. This means that an error will be raised if the `brewCoffee()` takes more than 3 minutes to finish its job.

The function `brewCoffee` is intentionally designed to be error-prone. It will either randomly take up to 5 minutes to brew coffee or randomly throw a `RuntimeException`. This is obviously a bad coffee machine, but luckily is great for us to observe errors!

---

By connecting the `clicks` with a `brewCoffee`, the final subscription block will have three message channels. These are `onNext`, `onError`, and `onComplete`, and are established when `subscribe` is called.

![](/images/2019-04-21-rxjava-handling-errors-like-a-pro/img-02.png)

If a click event is successfully converted to a coffee, we will observe a successfully brewed coffee in the final subscription block via the `onNext()` channel. If an Exception is thrown, it is propagated via the`onError()` channel. Similarly, the `onComplete()` channel is used when the stream is disposed of and will no longer emit values.

But wait! There is a secret channel connecting the reactive streams in the reverse direction. The `onDispose()` channel will connect back up the chain as shown by the blue lines in the following figure.

![](/images/2019-04-21-rxjava-handling-errors-like-a-pro/img-03.png)

When the downstream (the rightmost block) subscribes to the upstream (the leftmost block), the upstream passes a `Disposable` down so that the downstream can stop listening for values from the upstream. This is done by calling the Disposable’s `dispose()` method.

---

When `brewCoffee` raises an error, the final subscription block sees the error via `onError()` channel, **AND THEN** the final subscription block *may* call Disposable’s `dispose()` method.

> We use “may” here because the community decided not to call `dispose()` in `LambdaObserver` when terminating starting in RxJava 2.2.5. [You can find the change here](https://goo.gl/4oqTHJ).

![](/images/2019-04-21-rxjava-handling-errors-like-a-pro/img-04.png)

In RxJava, most of the `Observers` call Disposable’s `dispose()` as they get disposed. Therefore, an error becomes a chain reaction from bottom to top causing all of the blocks to terminate.

![](/images/2019-04-21-rxjava-handling-errors-like-a-pro/img-05.png)

All of the streams are terminated and thus the streams do not emit any new values. That is why an error event is also a terminate event in RxJava.

---

### How can we bring the reactive streams back alive after they are terminated by an error?

RxJava provides many different error handlers when an error is thrown inside of a stream. Two of the most basic but useful Observers are `retry()` and `retryWhen()`.

**Disclaimer:** As we mentioned previously, not all of the Observers call Disposable’s `dispose()` method when they see an error via the`onError` channel. Some Observers prevent the terminating chain reaction from happening.

#### The `retry()` Operator

![](/images/2019-04-21-rxjava-handling-errors-like-a-pro/img-06.png)

In the above figure, the **☓** is an error event. The `retry()` operator responds to an `onError` notification from the source Observable by resubscribing to the source Observable rather than passing that call through to its observers. This means that the **ROOT SOURCE** will be re-subscribed.

In our coffee machine example, adding a `retry()` right after the `switchMapSingle` source Observable will prevent the reactive stream from terminating by resubscribing to the `clicks` source Observable.

```kotlin
fun setupCoffeeMachine(...) {
    val clicks: Observable<Unit> = btBrewCoffee.clicks()
        .debounce(250L, TimeUnit.MILLISECONDS) // By default the clicks is observed on the background thread.
    
    clicks.switchMapSingle {
            brewCoffee() // Return Single<Coffee>
                .timeout(3, TimeUnit.MINUTES, Schedulers.computation())
        }
        // retry() to the rescue --------------------------------------------->
        .retry()
        // <-------------------------------------------------------------------
        .observeOn(AndroidSchedulers.mainThread()) // Most importantly, observe the values on the UI thread to avoid concurrent problem.
        .subscribe({ coffee ->
            Timber.v("A good $coffee makes me a good day!")
        }, Timber::e)
        .disposeOnDestroy()
}
```

You might be asking, “What happens if we add `retry()` after `brewCoffee()`”? In that case, it will immediately attempt to brew the coffee again when it sees an error. This is because the `retry` resubscribes to the `Single` of brewing coffee. We should be careful because it is possible to be trapped in an infinite loop in these inner cases. In our example here, we could safely resubscribe since the `Single.fromCallable` throws errors at random.

Many times, it’s not always bad to rebrew the coffee. In other words, you may want to retry the action but after a short delay or within a set amount of retry attempts. In this case, you should use the `retryWhen()` operator.

#### The “retryWhen()” Operator

![](/images/2019-04-21-rxjava-handling-errors-like-a-pro/img-07.png)

In the above figure, the **☓** is the error event. The `retryWhen` operator is similar to `retry`, but gives you an error source Observable and lets you decide whether or not to resubscribe to upstream. The text explanation of the official documentation \[[link](http://reactivex.io/documentation/operators/retry.html)\] is quite long and hard to read, so let’s look at the code snippet to get a better understanding.

```kotlin
fun setupCoffeeMachine(...) {
    val clicks: Observable<Unit> = RxView.clicks(btBrewCoffee)
        .map { Unit } // Could be replaced by Android Kotlin extension, i.e. btBrewCoffee.clicks().
        .debounce(250L, TimeUnit.MILLISECONDS) // By default the debounce is running on the background thread.
    
    clicks.switchMapSingle {
            brewCoffee() // Return Single<Coffee>
                .timeout(3, TimeUnit.MINUTES, Schedulers.computation())
                // retryWhen() to the rescue --------------------------------->
                .retryWhen { errorObservable ->
                    errorObservable
                        .zipWith(Observable.range(1, 3) { (_, i) -> i }
                        .flatMap { i -> Observable.timer(Math.pow(5, i), ...) }
                }
                // <-----------------------------------------------------------
        }
        .retry()
        .observeOn(AndroidSchedulers.mainThread()) // Most importantly, observe the values on the UI thread to avoid concurrent problem.
        .subscribe({ coffee ->
            Timber.v("A good $coffee makes me a good day!")
        }, Timber::e)
        .disposeOnDestroy()
}
```

In the above code snippet, we apply a back-off to the `brewCoffee()` with 3 retry attempts where each attempt is delayed by 5 seconds to the power of the attempt number (5¹ = 5s, 5² = 25s, 5³ = 125s).

Since `range(1, 3)` runs out of numbers on the fourth error, it calls `onCompleted()`, which causes the entire `zip` to complete. This prevents further retries.

---

#### The Differences of Where to use “retry()” and “retryWhen()”

We have seen two places in which `retry()` and `retryWhen()` are used. These locations serve as different strategies for managing the reactive stream. In general, we’d suggest placing `retry()` after a hot stream and `retryWhen()` after a cold stream.

#### Case 1, the (network) back-off:

Place `retryWhen()` right after the `Observable/Single/Maybe`, i.e. a cold stream, whenever you want to perform a back-off. This `retryWhen` provides a back-off with a limited number of retry attempts but does not protect the entire reactive stream from terminating.

![](/images/2019-04-21-rxjava-handling-errors-like-a-pro/img-08.png)

#### Case 2, the safeguard:

Place `retry()` right before the final subscription block when you want more of a stream safeguard. This `retry()` prevents the reactive stream from terminating. However, for hot streams, it does not necessarily provide the same back-off strategies. This is because the first source Observable in a hot stream usually does not emit values upon resubscribing (replaying or repeating).

![](/images/2019-04-21-rxjava-handling-errors-like-a-pro/img-09.png)

It’s ok to add `retry` operator here since our upstream doesn’t emit values when resubscribing. However, for some upstream that emits values every time when an observer subscribes to it, we’d suggest you use the `retryWhen` operator.

#### Case 3, back-off and safeguard:

You could use both the ways above to reinforce the error tolerance of your reactive stream.

![](/images/2019-04-21-rxjava-handling-errors-like-a-pro/img-10.png)

#### Last, But Not Least

When using `flatMap` or `switchMap` you will have a nested stream inside of these operators. If you want to use`retry` on the nested source observable, that `retry` will be applied to the source **inside** the operator. For example:

```kotlin
fun setupCoffeeMachine(...) {
    val debounceClicks: Observable<Unit> = btBrewCoffee.clicks()
        .debounce(250L, TimeUnit.MILLISECONDS)
    
    debounceClicks
        .switchMapSingle {
            brewCoffee() // Return Single<Coffee>
                .timeout(3, TimeUnit.MINUTES, Schedulers.computation())
                // Retry at position #1 <--------------------------------------
                .retryWhen { errorObservable ->
                    // Will attempt 3 retries, where each is back-off 5^attempts
                    errorObservable
                        .zipWith(Observable.range(1, 3) { (_, i) -> i }
                        .flatMap { i -> Observable.timer(Math.pow(5, i), ...) }
                }
        }
        // Retry at position #2 <----------------------------------------------
        .retry()
        .observeOn(AndroidSchedulers.mainThread())
        .subscribe({ coffee ->
            Timber.v("A good $coffee makes me a good day!")
        }, Timber::e)
        .disposeOnDestroy()
}
```

-   The retry at position #1:

The root source being resubscribed by `retry` is the **Single** returned by `brewCoffee()`.

-   The retry at position #2:

The root source being resubscribed by `retry` here is the hot stream, `debounceClicks`.

Inside the `flatMap` and `switchMap`, you are creating a new substream. Therefore, the root source given to the `retry` is the source of that new substream.

![Nested stream](/images/2019-04-21-rxjava-handling-errors-like-a-pro/img-11.png)  
*Nested stream*

---

### Strategies for Handling Errors

#### Strategy 1, reactive state:

As Jake Wharton recommends in the following talk \[[link](https://www.youtube.com/watch?v=0IKHxjkgop4)\], you can convert the result from the source Observable into UI states. Then you can handle the resulting state in the final subscription block. For example:

```kotlin
fun setupCoffeeMachine(...) {
    clicks.switchMapSingle {
            brewCoffee()
                .timeout(3, TimeUnit.MINUTES, Schedulers.computation())
                // To UI states ---------------------------------------------->
                .toObservable()
                .map { UiState.Done }
                .startWith(UiState.IN_PROGRESS)
                .onErrorReturn { err -> Observable.just(UiState.Error(err)) }
                // <-----------------------------------------------------------
        }
        .retry() // Protect the stream from terminating
        .observeOn(AndroidSchedulers.mainThread())
        .subscribe { s ->
            // Reflect the UI states
            when (s) {
                is UiState.Error -> Toast.makeText(s.error, ...).show()
            }
        }
        .disposeOnDestroy()
}
```

Implementing this strategy leads us into the world of modern programming and gives us advantages such as:

-   The input event from the UI is handled and transformed to the UI states with a lifecycle, e.g. the beginning, in-progress, and finishing states.
-   The UI states are immutable.
-   The UI states are handled sequentially and can be merged (or reduced).
-   It’s clear that the final subscription block is the place in which the UI states are presented to the users.

It also comes at one cost:

-   The error handling code is spread in the subscription blocks. In other words, it’s not that scalable as more kinds of errors are taken care of.

---

#### Strategy 2, redirect:

Redirect the error to other places for central management. For example:

```kotlin
clicks.switchMapSingle {
        brewCoffee() // Return Single<Coffee>
            .timeout(3, TimeUnit.MINUTES, Schedulers.computation())
            // Redirect -------------------------------------------------->
            .retryWhen { errors ->
                errors.flatMap {
                    caughtErrorRelay.accept(err) // Redirect the error via a Subject or RxRelay
                    ...
                }
            }
            // <-----------------------------------------------------------
    }
    .retry() // Protect the stream from terminating
    .observeOn(AndroidSchedulers.mainThread())
    .subscribe()
    .disposeOnDestroy()
```

This way gives us an advantage:

-   Flexibility to modularize the error handling component in the architecture.
-   Able to handle the errors with a sub-reactive stream. e.g. Reset the domain states.

The downside is:

-   Empty `subscribe()`.

---

### Summary

Error handling can be quite complicated in an enterprise application. Most likely, you will want to reset your domain states based on the errors. There are many practices of handling errors, therefore, we suggest finding what works for you. However, here are some tips for dealing with errors:

1.  Define the known/expected errors.
2.  Bucket the known/expected errors.
3.  Let the `onError()` channel to propagate errors.
4.  Protect the reactive stream from terminating regardless of what error happens.  
    e.g. Use both `retry()` and `retryWhen()`.
5.  Determine what to do with the known/expected errors.  
    e.g. Inline in the subscription block or redirect?

#### Some reference related to error handling in RxJava

-   TC Wang — RxJava ProTips-How `flatMap` and `switchMap` handle terminate events, [https://medium.com/sodalabs/rxjava-pro-tip-flatmap-and-switchmap-are-the-safe-guard-to-the-terminate-event-a655ff4dd730](https://medium.com/sodalabs/rxjava-pro-tip-flatmap-and-switchmap-are-the-safe-guard-to-the-terminate-event-a655ff4dd730)
-   DanLew — RxJva’s `repeatWhen` and `retryWhen`, explained  
    [https://blog.danlew.net/2016/01/25/rxjavas-repeatwhen-and-retrywhen-explained/](https://blog.danlew.net/2016/01/25/rxjavas-repeatwhen-and-retrywhen-explained/)
-   Kevin Marlow — Better exponential backoffs with RxJava and Retrofit on Android  
    [http://kevinmarlow.me/better-networking-with-rxjava-and-retrofit-on-android/](http://kevinmarlow.me/better-networking-with-rxjava-and-retrofit-on-android/)
-   Jake Wharton — State Management in RxJava  
    [https://www.youtube.com/watch?v=0IKHxjkgop4](https://www.youtube.com/watch?v=0IKHxjkgop4)
-   RxJava error handling operators  
    [https://github.com/ReactiveX/RxJava/wiki/Error-Handling-Operators](https://github.com/ReactiveX/RxJava/wiki/Error-Handling-Operators)

I hope this article inspires you to handle errors in RxJava better 😀. Please support this guide with your 👏👏👏 using the clap button and help it spread to a wider audience 🙏.
