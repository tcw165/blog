---
title: "How to Reason About Weighted Matrices in Neural Network"
description: "Weights matrix is a linear transformation that either squash space or expands space"
pubDate: 2020-10-11
categories:
  - Machine Learning
toc: true
---

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-01.png)

Neural networks often contain repeated patterns of logical regression. Here, logical regression is the formula for making a “decision”.

![Hypothesis function](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-02.png)  
*Hypothesis function*

![Activation function](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-03.png)  
*Activation function*

The first step in a logical regression is the hypothesis function. This function converts a vector of inputs to a single scalar value (pass/fail, lose/win, temperature value, etc). If you look at the hypothesis function, you notice the variables **W** and **X** which represent the weight and input vector respectively. This concept can be expanded and improved upon with the application of matrix multiplication of **W** and **X** in a geometric view.

To measure the input **X**, we tend to consider the **X** as a column vector with n features. And **W** is a weighting calculation to map **X** from n-D to 1-D.

![The hypothesis function with the non-transposed W (preferred)](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-04.png)  
*The hypothesis function with the non-transposed W (preferred)*

It is worth mentioning that some people might write the hypothesis function with a transposed **W** as seen below. That is a different notation in which people consider the **W** as a column vector. For this article, we will prefer the non-transposed notation. And I will explain my rationale later in the article.

![The hypothesis function with the transposed W](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-05.png)  
*The hypothesis function with the transposed W*

Intuitively, the transformation of **W** squashes the space of **X** from n-D to 1-D. To understand that, let’s revisit the concept of Linear Transform from Linear Algebra.

### Step 1. Linear Transform

A linear transformation is a function from one vector space to another that respects the underlying structure of each vector space.

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-06.png)

You could imagine plotting the space with grids in 2-D, the grid lines remain parallel and evenly spaced after applying a linear transformation. Following is a demo of skewing a space:

[Watch on YouTube](https://youtu.be/XUw95PFP1RE)

Linear transformations are useful because they preserve the structure of a vector space. So, many qualitative assessments of a vector space still hold!

### Step 2. Linear Transform with Square Matrix

The following equation represents a linear transformation, where **W** is a squared matrix.

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-07.png)

Multi-dimensional computations are complicated. So, let’s use 2-D linear transformation, which is a lot simpler and can be plotted geometrically.

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-08.png)

The above equation is to transform **X** from *(3, 4)* to *(6, -3)*.

To get the idea of a linear transformation, let’s rewrite the equation to the following:

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-09.png)

-   In statement (a), I rewrite the vector *(3, 4)* as a combination of two scaled unit vectors. We shall call the unit vectors, x-hat and y-hat respectively.
-   In statement (b), I apply the same transformation to the x-hat and y-hat vectors respectively.
-   In statement (c), you’ll see x-hat vector becomes *(-2, -1)*; y-hat vector becomes *(3, 0)*.

**Each column of W is the new unit vector for the new space!**

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-10.png)

In the following visual plot, the black grid shows the current coordinates and the light gray grid shows the previous coordinates. Here are the interesting observations:

-   From the view of old space, the vector looks changed.
-   However, from the view of the new space, the vector stays the same.

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-11.png)

### Step 3. Linear Transform with Non-square Matrix

Above, the linear transformation does not alter the space dimension. What if given the transformation matrix is not square?

Let’s use a fat **W** in 2-D transformation with the same **X**:

Let’s use a fat **W** in 2-D transformation with the same **X**:

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-12.png)

The input is a 2D vector and the output is a number! In this example, the space gets squashed! This is in fact the transformation used by the Logistic Regression.

Here is the visual plot:

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-13.png)

Now, let’s use a tall **W** in 2D transformation with the same **X** as another example:

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-14.png)

A 2D vector becomes a 3D vector! In this example, space gets expanded.

### Observation

The **W** matrix can be any size. This transformation either squashes space or expands space depending on the shape of the **W** matrix. Let’s expand the hypothesis function to fit more than just a Logistic Regression such that it can be used for a Neural Network.

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-15.png)

When we think of the **W** matrix is a linear transformation and each column of the **W** matrix is the new unit vector (column vector) for the new space, we can conclude:

-   The number of rows = output dimensions
-   The number of columns = input dimensions

Usually, we stack the samples in columns in a matrix for a Neural Network, which changes the equation to follow the more generic form:

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-16.png)

As you can see, it is like we applied the same **W** transformation to all the k sample vectors. This means that the column number of **X** has nothing to do with the **W**’s dimension.

Side note, this is why I prefer to use the non-transposed **W** form for the hypothesis function.

### Summary

![](/images/2020-10-11-reason-about-weighted-matrices-in-neural-network/img-17.png)

-   The **W** is a linear transformation matrix that either squash space or expands space.  
    In NN, some layer’s **W** expands the space for exploring more decision trees; some layer’s **W** squash the space for reaching decisions on the observations.
-   The **W**’s row number = dimensions of the new space.
-   The **W**’s column number = dimensions of the old space.

### Reference

-   [3Blue1Brown](https://www.youtube.com/channel/UCYO_jab_esuFRV4b17AJtAw) has a course giving the full ideas of the intuition of linear transformation, [“The Essence of Linear Algebra” on YouTube](https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab).

[Watch on YouTube](https://youtu.be/kjBOesZCoqc)

-   Brilliant also explains the concept of [“Linear Transformation”](https://brilliant.org/wiki/linear-transformations/) very well, in a robust and scientific way.
