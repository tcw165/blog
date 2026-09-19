---
title: "Explanation of set/pre/post Methods of Android Matrix"
pubDate: 2016-02-19
categories:
  - Android
---

![My helpful screenshot](/images/construction_banner.png)

```java
matrix.preScale(2f,1f);
matrix.preTranslate(5f, 0f);
matrix.postScale(0.2f, 1f);
matrix.postTranslate(0.5f, 0f);
```

The order of execution: `translate(5, 0) -> scale(2f, 1f) -> scale(0.2f, 1f) -> translate(0.5f, 0f)`

```java
matrix.postTranslate(2f, 0f);
matrix.preScale(0.2f, 1f);
matrix.setScale(1f, 1f);
matrix.postScale(5f, 1f);
matrix.preTranslate(0.5f, 0f);
```

The order of execution: `translate(0.5f, 0f) -> scale(1f, 1f) -> scale(5f, 1)`. Be careful when using `set`.

I think this design is because Android want to enqueue transformations and process later for performance good.
