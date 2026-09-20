---
title: "Heap’s Algorithm: Fun Observation"
description: "Heap’s Algorithm is NOT heap sort, and instead, it’s an algorithm to generate permutations."
pubDate: 2019-08-19
categories:
  - Algorithms
toc: true
---

Heap’s Algorithm is NOT heap sort, and instead, it’s an algorithm to generate permutations.

### Problems

Given an array of distinct integers, how would you enumerate all the permutations?

There are many solutions to the problem and one out of the many catches my eyes: [**Heap’s Algorithm**](https://en.wikipedia.org/wiki/Heap%27s_algorithm).

The Heap’s Algorithm is cool cause the algorithm enumerates the permutations by swapping the elements in place. In other words, **it uses very little memory and could generate the next unique permutation from any permutation result.**

I strongly recommend you to check out the code (from [Wikipedia](https://en.wikipedia.org/wiki/Heap%27s_algorithm)) before we move on:

![](/images/2019-08-19-heaps-algorithm-fun-observation/img-01.png)

The algorithm is impressively simple in terms of the lines of code. *However, it’s confusing to understand how it works, especially the conditional swap to the even and odd search range.*

![](/images/2019-08-19-heaps-algorithm-fun-observation/img-02.png)

Let’s check out my deduction to understanding the conditional swap to the even and odd search range!

### Break down the problem

#### Example:

Given an integer array: `[1,2,3,4]`

From Probability, we know there would be `4!` permutations (results are order sensitive). If you expend the permutation in a tree form, it would look like as follow:

![](/images/2019-08-19-heaps-algorithm-fun-observation/img-03.png)

The above tree form denotes there is a recursion required to enumerate all the permutations.

![](/images/2019-08-19-heaps-algorithm-fun-observation/img-04.png)

### Heap’s Algorithm

The algorithm follows the decrease-and-conquer strategy:

1.  Isolate the end element and permute the K-1 elements.
2.  Pick the **next unique** element and swap with the end element.
3.  Repeat step 1 and 2 until all the elements became the end element once!

Alright, we notice the conditional swap might have something to do with **picking the next unique element**.

Let’s see the partial answer of the given input `[1,2,3,4]` as the permutations ending with `4`.

![](/images/2019-08-19-heaps-algorithm-fun-observation/img-05.png)

Heap’s Algorithm systematically picks the next unique element in the descending order! e.g., `permute([1,2,3])` will pick `3` > `2` > `1`.

![](/images/2019-08-19-heaps-algorithm-fun-observation/img-06.png)

For `permute([1,2])`:

![](/images/2019-08-19-heaps-algorithm-fun-observation/img-07.png)

For `permute([1,2,3])`:

![](/images/2019-08-19-heaps-algorithm-fun-observation/img-08.png)

> Note that the `3` and `1` are swapped at the end of iteration when the search range is odd.

For `permute([1,2,3,4])`:

![](/images/2019-08-19-heaps-algorithm-fun-observation/img-09.png)

> Note that the elements shift one position to the left at the end of iteration when the search range is even!

![](/images/2019-08-19-heaps-algorithm-fun-observation/img-10.png)

From there, we find the repeating pattern as:

1.  **The 1st element and last element are swapped at the end of iteration when the search range is odd.  
    (The array is flipped in horizontal)**
2.  **The elements shift one position to the left at the end of iteration when the search range is even.**

Bingo!!! Now we know the key of the conditional swap to the search range. Actually, the conditional swap is the systematic way to pick the next unique element to isolate.

Also, the way of isolating the end element is very similar to the technics using in Heap Sort (isolate the last n-elements as they are sorted). I guess this is why the algorithm is called Heap’s Algorithm.

### Insights

-   Heap’s Algorithm uses the decrease-and-conquer strategy.
-   The conditional swap is the Heap’s Algorithm’s systematic way to pick the next unique element to isolate!

Do you start liking this algorithm as I do?

### Reference

-   Heap’s Algorithm Wikipedia \[[link](https://en.wikipedia.org/wiki/Heap%27s_algorithm)\]
-   Why does Heap’s Algorithm work \[[link](http://ruslanledesma.com/2016/06/17/why-does-heap-work.html)\]
