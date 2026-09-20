---
title: "How To Fix: Ghost Image By Glide In the RecyclerView"
description: "I use Glide library to load image in the RecyclerView and happen to meet this “ghost image” problem like following."
pubDate: 2017-03-31
categories:
  - Android
toc: true
---

I use Glide library to load image in the `RecyclerView` and happen to meet this **“ghost image”** problem like following.

> I’m using `Glide` of version `3.7.0`.

[Watch on YouTube](https://youtu.be/Nzs2-1I3dvo)

It is easy to reproduce this bug by simply scrolling down and up fast for several times. The “ghost images” problem seems from the reused `Drawable`. I checked the layout boundary of every list item and they are all right. So I guess that loading images into the same `View` by `Glide` too frequently would break the `Drawable` somehow.

```java
@Override
public void onBindViewHolder(final RecyclerView.ViewHolder viewHolder,
                             final int position,
                             List<Object> payloads) {
    final ImageView imageView = (ImageView) viewHolder.itemView;
    final IPhoto photo = getPhotoAt(position);

    Glide.with(getContext())
         .load(photo.thumbnailPath())
         // Setting the placeholder will fix the "ghost images" problem.
//         .placeholder(ContextCompat.getDrawable(
//             getContext(), R.drawable.bg_borderless_rect_light_gray))
         .priority(Priority.IMMEDIATE)
         .into(imageView);
}
```

If you set the `placeholder` before loading the image, the problem would be solved. That’s so far I know. :(
