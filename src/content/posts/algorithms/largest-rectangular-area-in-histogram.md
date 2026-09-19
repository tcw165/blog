---
title: "Algorithm: Largest Rectangular Area In Histogram"
description: "I found an interesting problem on LeetCode and GeeksForGeeks a while ago, “largest rectangular area in the histogram,” and a friend…"
pubDate: 2018-01-14
categories:
  - Algorithms
toc: true
---

I found an interesting problem on [LeetCode](https://leetcode.com/problems/largest-rectangle-in-histogram/description/) and [GeeksForGeeks](https://www.geeksforgeeks.org/largest-rectangle-under-histogram/) a while ago, *“largest rectangular area in the histogram,”* and a friend recently asks me if it is possible to get the coordinate of the rectangle*,* where I think it is correlative to the problem, “*find the largest rectangle in a binary image.”*

![](/images/2018-01-14-largest-rectangular-area-in-histogram/img-01.png)

### Problem

Given *n* non-negative integers representing the histogram’s bar height where the width of each bar is 1, find the area of largest rectangle in the histogram.  
For example: `hist=[2,3,1,4,5,4,2]`

![](/images/2018-01-14-largest-rectangular-area-in-histogram/img-02.png)

### Try #1 — Naive Approach, O(n²)

The naive approach is quite simple:   
Iterate through the histograms from left to right. For each iteration, look backward to see how far could the current height extend to and find out the largest area.

```java
public int largestRectanglularAreaInHistogram(int[] hist) {
    int maxArea = 0;

    // Iterate through the histogram.
    for (int i = 0; i < hist.length; ++i) {
        int h = hist[i];

        maxArea = Math.max(maxArea, h);

        for (int j = i - 1; j >= 0; --j) {
            final int w = (i - j + 1);

            h = Math.min(h, hist[j]);

            maxArea = Math.max(maxArea, h * w);
        }
    }

    return maxArea;
}
```

For example, given `hist=[2,3,1,4,5,4,2]`, the iteration in visual looks like:

![](/images/2018-01-14-largest-rectangular-area-in-histogram/img-03.png)

So the number of iterations is:

![](/images/2018-01-14-largest-rectangular-area-in-histogram/img-04.png)

That leads to the time complexity: O(n²)

### Try #2 — Stack Approach, O(n)

In the previous approach, there are some redundant iterations that we obviously could skip. For example:

Given i=3 and j=2, the height is 1, and we already know that the area from i=2 to 0 is 3×1 because we previously traverse it when i=2.

We could derive the result from the previous traversed cases, so it is potentially a *Dynamic Programming* problem. Let’s break it down into several sub-problems and derive the cached result from the previous sub-problem.

![](/images/2018-01-14-largest-rectangular-area-in-histogram/img-05.png)

From the above figure, our problem becomes *“for bar 𝒾, how far could it reach to.”* In other words, the bar *𝒾* could reach as far as possible only if there is a sequence of upcoming bars with ascending height. So the original `hist=[2,3,1,4,5,4,2]` problem could be broken down into four sub-problems:

![](/images/2018-01-14-largest-rectangular-area-in-histogram/img-06.png)

To find *the sequence of bars with climbing height*, we traverse all bars from left to right and hold the index of bars with bigger height in a Stack. A bar is popped from the Stack when a bar of smaller height is seen; meanwhile, we calculate the largest rectangular area in the sequence because the sequence with climbing height ends here.

```java
public int largestRectanglularAreaInHistogram(int[] hist) {
    final Stack<Integer> s = new Stack<>();

    int maxArea = 0;
    int tp;
    int areaWithTop;

    int i = 0;
    while (i < hist.length) {
        if (s.empty() || hist[s.peek()] <= hist[i]) {
            s.push(i++);
        } else {
            tp = s.pop();
            int w = s.empty() ? i : i - s.peek() - 1;
            areaWithTop = hist[tp] * w;

            if (maxArea < areaWithTop)
                maxArea = areaWithTop;
        }
    }

    while (!s.empty()) {
        tp = s.pop();
        int w = s.empty() ? i : i - s.peek() - 1;
        areaWithTop = hist[tp] * w;

        if (maxArea < areaWithTop)
            maxArea = areaWithTop;
    }

    return maxArea;
}
```

The number of iterations is quite complicated to compute.

#### Worse case

We first see the fully ascending and descending examples:

![](/images/2018-01-14-largest-rectangular-area-in-histogram/img-07.png)

Given ascending histogram, the number of iterations is 2N, where N by walking through the bars and N by popping the stack. So the time complexity is O(n);  
Given descending histogram, the number of iterations is 1+2+2+…+2≅2N, Where one is by walking the first bar, and two is by walking through the rest bars along with popping the stack with one bar index. So the time complexity is still O(n).

#### Best case

![](/images/2018-01-14-largest-rectangular-area-in-histogram/img-08.png)

Given the histogram with uniform height, the number of iteration is 2N, where N is by walking through the bars, and the other N is by popping the stack. So the time complexity is O(n)

#### Conclusion

The expected iterations are between the lower bound and upper bound. Both time complexity of them is O(n), we could deduct the time complexity is O(n).

### Extend to 2D, O(w×h)

Given a 2D binary matrix filled with 0’s and 1’s, find the largest rectangle containing only 1’s and return its area.  
For example: `matrix=[[1,0,1,1,1,1],[0,1,1,1,1,1],[0,1,1,0,1,1],[0,0,1,1,1,1],[1,0,1,1,0,1]]`

![](/images/2018-01-14-largest-rectangular-area-in-histogram/img-09.png)

The height of the matrix varies, and that reasonably derives that it is also a *Dynamic Programming* problem. The 2D version could be broken down to the 1D sub-problems:

-   Imagine you use your hand to hide rows except the first one, you get a histogram, and you could get the largest rectangular area with the previous optimal solution.
-   Then you move your hand one row down to show one more row, you get another histogram.
-   Repeat it and keep moving your hand one row down at a time until you see the complete matrix.

For example:

![](/images/2018-01-14-largest-rectangular-area-in-histogram/img-10.png)

The code:

```java
public int maximalRectangle(char[][] matrix) {
    if (matrix == null) return 0;

    final int maxRow = matrix.length;
    if (maxRow == 0) return 0;
    final int maxCol = matrix[0].length;
    if (maxCol == 0) return 0;
    final int[] lookupTable = new int[maxCol];

    int maxArea = 0;

    for (int row = 0; row < maxRow; ++row) {
        for (int col = 0; col < maxCol; ++col) {
            int value = matrix[row][col] - '0';
            if (value > 0) {
                lookupTable[col] += 1;
            } else {
                lookupTable[col] = 0;
            }
        }
        maxArea = Math.max(
            maxArea,
            largestRectangleArea(lookupTable));
    }

    return maxArea;
}
```

Since the computation each row is only visited once and computing the largest rectangular area for each row is linear (as we proved before), the time complexity is *O(w×h)*, where *w* is width and *h* is the height of the matrix. Of course, you could rotate the matrix if the width is larger than height.

### Challenge

Let’s find out the rectangle with x, y, width and height too. I’m still working on this so please stay tuned.

[View embedded content](https://giphy.com/embed/3o7TKx2UxFTXjGEEFO/twitter/iframe)

### Reference

-   Divide&Conquer solution on GeeksForGeeks, [link](https://www.geeksforgeeks.org/largest-rectangular-area-in-a-histogram-set-1/).
-   Stack solution on GeeksForGeeks, [link](https://www.geeksforgeeks.org/largest-rectangle-under-histogram/).
-   “largest rectangle in histogram” on LeetCode, [link](https://leetcode.com/problems/largest-rectangle-in-histogram/description/).
-   “maximal rectangle” on LeetCode, [link](https://leetcode.com/problems/maximal-rectangle/description/).
