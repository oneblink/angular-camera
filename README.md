[![npm](https://img.shields.io/npm/v/@blinkmobile/blink-angular-camera.svg?maxAge=2592000)](https://www.npmjs.com/package/@blinkmobile/blink-angular-camera)

# Angular 1 Camera

An Angular 1 wrapper around [https://github.com/blinkmobile/camera](@blinkmobile/camera)

# Installation

`npm i @blinkmobile/angular-camera --save`

# Requirements

Angular 1.5+ (tested on 1.6+)

If you are building for a Cordova project be sure to install the Cordova Camera plugin as well.

`cordova plugin add cordova-plugin-camera --save`

WebRTC projects require the [getUserMedia Shim](https://github.com/otalk/getUserMedia) to be loaded.

# Usage

First, you need to add the module to your angular 1.x project:

```javascript
angular.module('my-module', ['bmCamera'])
```

and in your markup:

```html
<bm-camera ng-model="myStillImage"></bm-camera>
```

# Advanced Usage

This component supports transclusion, easily allowing you to add your own buttons for image manipulation

```html
<bm-camera ng-model="myStillImage" width="320" height="240" on-camera-error="myErrorHandler(err)">

  <button ng-click="rotate(-90, myStillImage)">Rotate Left</button>
  <button ng-click="rotate(90, myStillImage)">Rotate Right</button>

</bm-camera>
```


# Configuration Options

Various options can be set via element attributes. See the [example/webrtc](webrtc example) for details on how to use the options.

## Attributes

### <a name="width"></a> width
### <a name="height"></a> height

Default: 640x480

Width and Height control the size of the image captured from the camera. It is important to note that not all Webcams and cameras support the same sizes. More often than not, the default size will suffice.

### thumbWidth
### thumbHeight

The size to display the thumbnail of the image camptured by the camera.

## Callbacks

### onCameraOpen(videoEl)

Arguments: videoEl (HTMLVideoElement)

Called once the camera has been opened and passed the HTML video element used to display the camera feed. This is useful for detecting the actual video dimensions

### onCameraError(err)

Arguments: err (Error)[https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia%20#Errors]

Called if there was an error in opening the camera. Usually this would be if the user has not granted access to the camera or if you have specified a size that the webcam does not support
