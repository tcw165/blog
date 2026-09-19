---
title: "Face Landmarks Detection In Your Android App — Part 1"
description: "Related articles: Part 2, Part 3"
pubDate: 2017-04-15
categories:
  - Android
toc: true
---

Related articles: [Part 2](https://medium.com/@boyw165/face-landmarks-detection-in-your-android-app-part-2-ae049a4ac0d1), [Part 3](https://tech.pic-collage.com/face-landmarks-detection-in-your-android-app-part-3-4705ac34201f)

![](/images/2017-04-15-face-landmarks-detection-part-1/img-01.png)

I’m going to use [`dlib`](https://github.com/davisking/dlib) of [`v19.4`](https://github.com/davisking/dlib/releases/tag/v19.4) to do the face landmarks detection. Before I integrate the library to the Android end, I want to make sure the function (face landmarks detection) works on my Mac.

> The reference specification:  
> OS: Mac  
> dlib: [`v19.4`](https://github.com/davisking/dlib/releases/tag/v19.4)NDK: `14.1`

### Environment setup

-   Download the source [code](https://github.com/davisking/dlib/releases/tag/v19.4) (I’m using `v19.4`).
-   Install [`homebrew`](https://brew.sh/) to manage the development tools or packages.
-   Install the C/C++ compiler.  
    e.g. `brew install llvm`
-   Install `cmake`. It uses `cmake` as the build system to generate the Makefile.  
    e.g. `brew install cmake`
-   Install `xquartz`. It uses `x11/xlib` as GUI framework.  
    e.g. `brew cask install xquartz`
-   Install `lapack`. It uses ***L***inear ***A***lgebra ***PACK***age to compute the matrix operation.  
    e.g. `brew install lapack`
-   Download the pre-trained model.  
    e.g. [`http://dlib.net/files/shape_predictor_68_face_landmarks.dat`](http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2)
-   Prepare the photos with clear faces inside.

### Build the sample code

The sample code I’m interested is [`face_landmark_detection_ex.cpp`](https://github.com/davisking/dlib/blob/v19.4/examples/face_landmark_detection_ex.cpp) which is located in the `examples` directory. And it would be compiled to an executable binary file that could take the trained model and photos as inputs.

![](/images/2017-04-15-face-landmarks-detection-part-1/img-02.png)

Go into the examples folder and type:

```shell
cd examples && mkdir build && cd build && cmake .. && cmake — build .
```

If it is successfully compiled, you should see many generated executable binary files in the `examples/build/` directory.

![](/images/2017-04-15-face-landmarks-detection-part-1/img-03.png)

The sample relies on the `xquartz` server to display the result. So remember to launch `XQuartz.app` first (located at `/Applications/Utilities/XQuartz.app`) and keep it opened. Then run the sample to see how it performs:

```shell
# 1st parameter is the trained model; 2nd parameter is the photo
./face_landmark_detection_ex \
    shape_predictor_68_face_landmarks.dat \
    ../faces/*.jpg
```

### Error I encountered

If you encounter `DLIB_NO_GUI_SUPPORT` compiling error like me. It is probably because the generated `dlib/build/config.h` header file is not used. To solve it you simply copy the `dlib/build/config.h` to `dlib/config.h`.

The `cmake` I’m using doesn’t support interactive debugging. To do further debugging, I add debugging message to know what flags are turned on or off in the `CMakeLists.txt` file.

#### Here is the tips of debugging "`cmake”`:

```
# In CMakeLists.txtmessage(STATUS "The log message.")
```

Run `cmake` and dump the debugging message.

```shell
cmake . --debug-output -Wdev
```

### Stay tuned

The result looks pretty cool to me. In the next article, I will be trying to cross-compile the library to be used by an Android app.

Original paper: [pdf](https://pdfs.semanticscholar.org/d78b/6a5b0dcaa81b1faea5fb0000045a62513567.pdf)

[Watch on YouTube](https://youtu.be/oWviqXI9xmI)
