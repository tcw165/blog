---
title: "RecyclerView Pro Tips: Add Line Divider In XML"
description: "The RecyclerView supports addItemDecoration method since 22.1.0 and many people use this method to add line divider, but programmatically…"
pubDate: 2018-10-11
categories:
  - Android
toc: true
---

![](/images/2018-10-11-recyclerview-add-line-divider-in-xml/img-01.png)

The [**RecyclerView**](https://developer.android.com/reference/android/support/v7/widget/RecyclerView) supports [**addItemDecoration**](https://developer.android.com/reference/android/support/v7/widget/RecyclerView.html#addItemDecoration%28android.support.v7.widget.RecyclerView.ItemDecoration%29) method since **22.1.0** and many people use this method to programmatically add a line divider. As a visual person, I prefer **WYSIWYG** and propose an approach.

Here are the requirements for using **WYSIWYG:**

1.  Assign the list item layout for previewing in the AndroidStudio.  
    It is simple, just use the attribute `tools:listitem`. If you’re not familiar with the attribute, [check out the document here](https://developer.android.com/studio/write/tool-attributes#toolslistitem_toolslistheader_toolslistfooter).
2.  Assign the divider drawable in XML.
3.  Set the divider mode such as ***beginning***, ***middle***, and ***end*** *in XML.*

![divider mode, from left to right are beginning, middle, and end.](/images/2018-10-11-recyclerview-add-line-divider-in-xml/img-02.png)  
*divider mode, from left to right are beginning, middle, and end.*

Ideally, we want the following XML:

```
<android.support.v7.widget.RecyclerView    ...    android:orientation="vertical"    app:rvDividerDrawable="@drawable/row_item_divider"    app:rvDividerMode="beginning|middle|end"    tools:itemCount="7"    tools:listitem="@layout/recycler_view_item" />
```

The support library *RecyclerView* certainly doesn’t support our custom style attributes. To solve this we can add a *custom RecyclerView* which derives from the *RecyclerView and* supports the custom style, e.g. **StyledRecyclerView**.

### The XML

```
<com.yourdomain.StyledRecyclerView    ...    android:orientation="vertical"    app:rvDividerDrawable="@drawable/row_item_divider"    app:rvDividerMode="beginning|middle|end"    tools:itemCount="7"    tools:listitem="@layout/recycler_view_item" />
```

### File attrs.xml

The *custom RecyclerView* comes with the style attributes:

```
<!-- In file: res/attrs.xml --><declare-styleable name="StyledRecyclerView">    <attr name="rvDividerDrawable" format="reference" />    <attr name="rvDividerMode">        <flag name="none" value="0" />        <flag name="beginning" value="1" />        <flag name="middle" value="2" />        <flag name="end" value="4" />    </attr></declare-styleable>
```

### StyledRecyclerView snippet

```kotlin
constructor(...) : super(...) {
    val a = context.theme.obtainStyledAttributes(
        attrs,
        R.styleable.StyledRecyclerView, 0, 0)
    decorateView(a, getOrientation(attrs))
    a.recycle()
}

private fun decorateView(
    typedArray: TypedArray,
    orientation: Int
) {
    // Divider and the mode
    if (typedArray.hasValue(R.styleable.StyledRecyclerView_rvDividerDrawable)) {
        val dividerDrawable = typedArray.getDrawable(R.styleable.StyledRecyclerView_rvDividerDrawable)
        val dividerMode = typedArray.getInt(R.styleable.StyledRecyclerView_rvDividerMode, DividerMode.SHOW_DIVIDER_NONE)

        val decoration = DrawableDividerDecoration(
            dividerDrawable = dividerDrawable,
            dividerMode = dividerMode)
        addItemDecoration(decoration)
    }

    // Preview list item
    if (isInEditMode) {
        layoutManager = LinearLayoutManager(context, orientation, false)
    }
}
```

There are three lines that are particularly important. Without them, the preview will not work.

```
if (isInEditMode) {    layoutManager = LinearLayoutManager(context, orientation, false)}
```

**How does it work?**

The boolean `isInEditMode` is true when the view is currently used by AndroidStudio for previewing. To show the list items in a *RecyclerView*, a `RecyclerView.Adapter` and a `RecyclerView.LayoutManager` are necessary where the adapter provides the data and layout manager takes care of the item sizing and positioning. The preview adapter (the data provider) is magically created by AndroidStudio through the attribute `tools:listitem`. Therefore, we only need to create a `LinearLayoutManager` to successfully layout the list items.

**Dive into RecyclerView**

Actually, the support library *RecyclerView (version* ***27.1.1****)* sneakily creates a *LayoutManager* for previewing!

![It creates a LayoutManager through reflection](/images/2018-10-11-recyclerview-add-line-divider-in-xml/img-03.png)  
*It creates a LayoutManager through reflection*

### Next

Thanks for [Kevin Marlow](https://medium.com/u/5d6db1ec1532)’s feedback and we open source the project, please check out the [Github repository here](https://github.com/SodaLabs/styled-views-android).

[View embedded content](https://giphy.com/embed/l6Td5sKDNmDGU/twitter/iframe)
