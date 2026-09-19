---
title: "C++ 1min: Competitive Arithmetic Tricks"
description: "There’re some tricks to make your program run much faster. Although in most cases, the performance boost isn’t noticeable for regular…"
pubDate: 2022-12-11
categories:
  - Algorithms
toc: true
---

![](/images/2022-12-11-cpp-competitive-arithmetic-tricks/img-01.png)

There’re some tricks to make your program run much faster. Although in most cases, the performance boost isn’t noticeable for regular systems. But be aware of these performance tricks could make your program more sustainable at scale.

Let’s get started!

### Check if two integers have opposite signs using XOR

You could use `xor` operator to quickly check if two integers have different sign.

```
const bool opposite = (x ^ y) < 0;
```

> Time Complexity: O(1)  
> Auxiliary Space: O(1)  
> Explined: Video

In contrast, there is an intuitive alternative but much slower:

```
const bool opposite = (x < 0) ? (y >= 0): (y < 0);
```

### Swap two numbers using XOR

```
a ^= b;b ^= a;a ^= b;
```

> Time Complexity: O(1)  
> Auxiliary Space: O(1)  
> Explained: [Video](https://www.youtube.com/watch?v=I4UuurVgngw)

---

### Reference

-   [C++ tricks for competitive programming @Geeks4Geeks.](https://www.geeksforgeeks.org/c-tricks-competitive-programming-c-11/)

I hope you find this useful in your software engineering career. Please don’t hesitate to give like if you do find this article useful for you.

I’ll keep updating this one to cover as much as possible. Stay tuned 😁
