/*
 * @blinkmobile/angular-camera: v1.0.0
 * undefined
 *
 * Copyright 2017 BlinkMobile
 * Released under the ISC license
 *
 * 
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

CameraController.$inject = ['$scope', '$element', '$attrs', 'Camera'];
function CameraController($scope, $element, $attrs, Camera) {
  const vm = this;

  const DEFAULT_WIDTH = 640;
  const DEFAULT_HEIGHT = 480;

  const updateImageProp = (name, changes) => {
    if (!changes) {
      return;
    }

    const value = changes.currentValue;

    if (value === changes.previousValue) {
      return;
    }

    if (!angular.isUndefined(value) || value === null) {
      return vm.imageEl.removeAttribute(name);
    }

    return vm.setAttribute(name, value);
  };

  const webrtcOptions = () => ({ video: { width: vm.width, height: vm.height } });
  const cordovaOptions = () => ({ targetWidth: vm.width, targetHeight: vm.height });
  const getOptions = () => vm.webRTC ? webrtcOptions() : cordovaOptions();

  vm.$onInit = () => {
    vm.videoEl = $element.find('video')[0];
    vm.imgEl = $element[0].querySelector('[camera-target]');
    vm.camera = Camera(vm.videoEl);

    vm.isCameraOpen = false;
    vm.hasImage = false;
    vm.webRTC = !!vm.camera.close;

    vm.width = vm.width || DEFAULT_WIDTH;
    vm.height = vm.height || DEFAULT_HEIGHT;
  };

  vm.$onChanges = changesObj => {
    if (!changesObj) {
      return;
    }

    if (vm.imageEl) {
      updateImageProp('width', changesObj.width);
      updateImageProp('height', changesObj.height);
    }
  };

  vm.openCamera = function openCamera() {
    return vm.camera.open(getOptions()).then(() => {
      $scope.$apply(() => vm.isCameraOpen = true && vm.webRTC);
    });
  };

  vm.closeCamera = function closeCamera() {
    vm.camera.close && vm.camera.close();
    vm.isCameraOpen = false;
  };

  vm.takePhoto = function takePhoto() {
    vm.isCameraOpen = false;
    return vm.camera.getPicture(getOptions()).then(img => {
      $scope.$apply(() => {
        vm.ngModel.$setViewValue(img);
        vm.hasImage = true;
        vm.closeCamera();
      });
    });
  };
}

var template = "<div class=\"bm-camera-container\">\n  <div class=\"bm-camera-preview-container\">\n    <video class=\"bm-video\" autoplay width=\"{{$ctrl.width}}\" height=\"{{$ctrl.height}}\" data-ng-show=\"$ctrl.isCameraOpen\" width=\"{{$ctrl.width}}\" height=\"{{$ctrl.height}}\"></video>\n    <!-- allows the developer to include their own image manipulation controls -->\n    <div data-ng-transclude>\n      <!-- fallback if no target and image processing tools provided -->\n      <img ng-src=\"{{$ctrl.ngModel.$viewValue}}\" camera-target width=\"{{$ctrl.width}}\" height=\"{{$ctrl.height}}\" data-ng-show=\"$ctrl.ngModel.$viewValue\">\n    </div>\n  </div>\n  <div ng-if=\"$ctrl.webRTC\">\n    <button class=\"btn\" name=\"open-camera\" data-ng-click=\"$ctrl.openCamera()\" data-ng-hide=\"$ctrl.isCameraOpen\">Open Camera</button>\n    <button class=\"btn ng-hide\" name=\"close-camera\" data-ng-click=\"$ctrl.closeCamera()\" data-ng-show=\"$ctrl.isCameraOpen\">Close Camera</button>\n    <button class=\"btn\" name=\"take-photo\" data-ng-click=\"$ctrl.takePhoto()\" data-ng-show=\"$ctrl.isCameraOpen\">Take Photo</button>\n  </div>\n  <div ng-if=\"!$ctrl.webRTC\">\n    <button class=\"btn\" name=\"open-camera\" data-ng-click=\"$ctrl.takePhoto()\">Take Photo</button>\n  </div>\n</div>\n";

const privateVars = new WeakMap();

function CordovaCamera () {
  /* eslint-disable no-undef */
  this.availableDevices = [{deviceId: Camera.Direction.BACK, label: 'Rear Camera'},
                           {deviceId: Camera.Direction.FRONT, label: 'Front Camera'}];

  this.defaultConstraints = {
    cameraDirection: Camera.Direction.BACK,
    quality: 50,
    destinationType: Camera.DestinationType.FILE_URI,
    encodingType: Camera.EncodingType.PNG,
    sourceType: Camera.PictureSourceType.CAMERA,
    correctOrientation: true
  };
  /* eslint-enable no-undef */

  privateVars.set(this, {result: null});
}

// instance methods
CordovaCamera.prototype.getDevices = function () {
  return Promise.resolve(this.availableDevices)
};

CordovaCamera.prototype.useDevice = function (device) {
  if (!('deviceId' in device)) {
    throw new TypeError('Invalid device selected, must be of type MediaDeviceInfo')
  }

  this.defaultConstraints.cameraDirection = device.deviceId;
};

CordovaCamera.prototype.open = function (constraints = this.defaultConstraints) {
  constraints = Object.assign({}, this.defaultConstraints, constraints);

  return new Promise((resolve, reject) => {
    const onSuccess = (data) => {
      privateVars.get(this).result = data;
      resolve(data);
    };
    navigator.camera.getPicture(onSuccess, reject, constraints);
  })
};

CordovaCamera.prototype.getPicture = function (constraints = this.defaultConstraints) {
  const privates = privateVars.get(this);

  if (!privates.result) {
    return this.open(constraints).then(() => privates.result)
  }

  return Promise.resolve(privates.result)
};

function cordovaFactory (...args) {
  // allows constructor to accept variable number of arguments.
  args.unshift(null);
  return new (CordovaCamera.bind.apply(CordovaCamera, args))()
}

const privateVars$1 = new WeakMap();

// constructor
function WebRTCCamera (videoEl) {
  if (!videoEl) {
    throw new TypeError('WebRTCCamera expects a video element during instansiation')
  }

  this.defaultConstraints = {video: true, audio: false};
  this.availableDevices = [];

  privateVars$1.set(this, {
    videoEl: videoEl,
    stream: null,
    videoTrack: null,
    authorised: false,
    result: null
  });
}

// instance methods
WebRTCCamera.prototype.useDevice = function (device) {
  this.stopVideo();

  if (!('deviceId' in device)) {
    throw new TypeError('Invalid device selected, must be of type MediaDeviceInfo')
  }

  this.defaultConstraints.video = this.defaultConstraints.video || {};
  this.defaultConstraints.video.deviceId = {exact: device.deviceId};
};

WebRTCCamera.prototype.getDevices = function () {
  if (!privateVars$1.get(this).authorised) {
    return Promise.resolve([])
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return Promise.reject(new Error('Media Devices API not supported in this browser'))
  }

  return navigator.mediaDevices.enumerateDevices().then((devices) => {
    this.availableDevices = devices.filter((d) => d.kind.toLowerCase() === 'videoinput');

    return this.availableDevices
  })
};

WebRTCCamera.prototype.open = function (constraints = this.defaultConstraints) {
  constraints = Object.assign({}, this.defaultConstraints, constraints);

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line
    getUserMedia(constraints, (err, stream) => {
      if (err) {
        return reject(err)
      }

      const videoTracks = stream.getVideoTracks();
      const vars = privateVars$1.get(this);
      vars.authorised = true;

      if (!videoTracks.length) {
        vars.stream = null;
        vars.videoTrack = null;

        return reject(new Error('Could not get a video track from stream'))
      }

      vars.videoEl.addEventListener('canplay', resolve, {once: true});

      vars.videoTrack = videoTracks[0];
      vars.stream = stream;
      vars.videoEl.srcObject = stream;
    });
  })
};

WebRTCCamera.prototype.getPicture = function () {
  if (!privateVars$1.get(this).authorised) {
    // eslint-disable-next-line
    return Promise.reject(new DOMException('User has not authorised use of the camera', 'NotAllowedError'))
  }

  const vars = privateVars$1.get(this);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const videoEl = vars.videoEl;

  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  ctx.drawImage(vars.videoEl, 0, 0);
  vars.result = canvas.toDataURL('image/png');

  return Promise.resolve(vars.result)
};

WebRTCCamera.prototype.close = function () {
  privateVars$1.get(this).videoTrack.stop();
};

function webRTCFactory (...args) {
  // allows constructor to accept variable number of arguments.
  args.unshift(null);
  return new (WebRTCCamera.bind.apply(WebRTCCamera, args))()
}

function cameraFactory (...args) {
  const useCordova = !!(window.Camera && navigator.camera);

  if (useCordova) {
    return cordovaFactory.apply(null, args)
  }

  return webRTCFactory.apply(null, args)
}

function CameraService() {
  return (...args) => cameraFactory.apply(cameraFactory, args);
}

angular.module('bmCamera', []).service('Camera', CameraService).component('bmCamera', {
  controller: CameraController,
  template: template,
  transclude: true,
  require: {
    ngModel: 'ngModel'
  },
  bindings: {
    width: '@?',
    height: '@?'
  }
});

})));
