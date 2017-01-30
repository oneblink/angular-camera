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

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 480;
const DEFAULT_THUMB_WIDTH = 100;
const DEFAULT_THUMB_HEIGHT = 100;

CameraController.$inject = ['$scope', '$element', 'Camera'];
function CameraController($scope, $element, Camera) {
  const vm = this;
  let initialized = false;

  function toWebRTCOptions() {
    const userDefinedOptions = vm.cameraOptions && vm.cameraOptions.video || {};
    const newVideoOptions = {
      width: { exact: +vm.width },
      height: { exact: +vm.height }
    };

    const mergedVideoOptions = Object.assign({}, userDefinedOptions, newVideoOptions);
    return {
      audio: false,
      video: mergedVideoOptions
    };
  }

  function toCordovaOptions() {
    return Object.assign({}, vm.cameraOptions, { targetWidth: vm.width, targetHeight: vm.height });
  }

  const getOptions = () => vm.webRTC ? toWebRTCOptions() : toCordovaOptions();

  function setCameraOptions() {
    vm.cameraOptions = getOptions();
    vm.camera.defaultConstraints = vm.cameraOptions;
  }

  vm.$onInit = () => {
    vm.videoEl = $element.find('video')[0];
    vm.imgEl = $element[0].querySelector('[camera-target]');
    vm.camera = Camera(vm.videoEl);

    vm.onCameraOpen = vm.onCameraOpen || function () {};
    vm.onCameraError = vm.onCameraError || function () {};

    vm.isCameraOpen = false;
    vm.webRTC = !!vm.camera.close;

    vm.width = vm.width || DEFAULT_WIDTH;
    vm.height = vm.height || DEFAULT_HEIGHT;

    vm.thumbWidth = vm.thumbWidth || DEFAULT_THUMB_WIDTH;
    vm.thumbHeight = vm.thumbHeight || DEFAULT_THUMB_HEIGHT;

    setCameraOptions(vm.cameraOptions);

    initialized = true;
  };

  vm.$onChanges = changesObj => {
    if (!changesObj) {
      return;
    }

    for (let prop in changesObj) {
      if (prop === 'cameraOptions') {
        setCameraOptions(changesObj[prop].currentValue);
      } else {
        vm[prop] = changesObj[prop].currentValue;
      }
    }

    if (initialized) {
      setCameraOptions(vm.cameraOptions);

      if (vm.isCameraOpen) {
        vm.camera.close();
        vm.openCamera();
      }
    }
  };

  vm.openCamera = function openCamera() {
    return vm.camera.open().then(() => vm.camera.getDevices()).then(() => $scope.$apply(() => {
      vm.isCameraOpen = true && vm.webRTC;
      vm.error = null;
      vm.onCameraOpen({ videoEl: vm.videoEl });
    })).catch(err => {
      $scope.$apply(() => {
        vm.error = err.name === 'NotAllowedError' ? 'You must grant access to your webcam to take photos' : null;
        console.warn(`There was an error opening the camera: ${ err }`);
        vm.onCameraError({ err: err });
      });
    });
  };

  vm.closeCamera = function closeCamera() {
    vm.camera.close && vm.camera.close();
    vm.isCameraOpen = false;
  };

  vm.takePhoto = function takePhoto() {
    vm.isCameraOpen = false;
    return vm.camera.getPicture().then(img => {
      $scope.$apply(() => {
        vm.ngModel.$setViewValue(img);
        vm.closeCamera();
      });
    }).catch(err => {
      vm.error = err.toString();
      console.warn(`There was an error opening the camera: ${ err }`);
      vm.onCameraError({ err: err });
    });
  };

  vm.useDevice = function useDevice() {
    vm.selectedDevice && vm.camera.useDevice(vm.selectedDevice);
  };
}

var template = "<div class=\"bm-camera-container\">\n  <div class=\"bm-camera-preview-container\">\n    <video class=\"bm-camera-video\" autoplay width=\"{{$ctrl.width}}\" height=\"{{$ctrl.height}}\" ng-show=\"$ctrl.isCameraOpen\" width=\"{{$ctrl.width}}\" height=\"{{$ctrl.height}}\"></video>\n    <!-- allows the developer to include their own image manipulation controls -->\n    <div ng-transclude>\n      <!-- fallback if no target and image processing tools provided -->\n      <img ng-src=\"{{$ctrl.ngModel.$viewValue}}\" camera-target width=\"{{$ctrl.thumbWidth}}\" height=\"{{$ctrl.thumbHeight}}\" ng-show=\"$ctrl.ngModel.$viewValue\" class=\"bm-camera-still-image ng-hide\">\n    </div>\n  </div>\n  <div class=\"bm-camera-selector-container\" ng-show=\"$ctrl.camera.availableDevices.length > 1\">\n    <select class=\"bm-camera-selector\" ng-model=\"$ctrl.selectedDevice\" ng-options=\"device.label for device in $ctrl.camera.availableDevices\" ng-change=\"$ctrl.useDevice()\">\n\n    </select>\n  </div>\n  <div ng-if=\"$ctrl.webRTC\">\n    <button class=\"btn\" name=\"open-camera\" ng-click=\"$ctrl.openCamera()\" ng-hide=\"$ctrl.isCameraOpen\">Open Camera</button>\n    <button class=\"btn ng-hide\" name=\"close-camera\" ng-click=\"$ctrl.closeCamera()\" ng-show=\"$ctrl.isCameraOpen\">Close Camera</button>\n    <button class=\"btn\" name=\"take-photo\" ng-click=\"$ctrl.takePhoto()\" ng-show=\"$ctrl.isCameraOpen\">Take Photo</button>\n\n    <div class=\"bm-field-error\" ng-show=\"$ctrl.error\">\n      <p>{{::$ctrl.error}}</p>\n    </div>\n  </div>\n  <div ng-if=\"!$ctrl.webRTC\">\n    <button class=\"btn\" name=\"open-camera\" ng-click=\"$ctrl.takePhoto()\">Take Photo</button>\n  </div>\n</div>\n";

var CameraComponent = {
  controller: CameraController,
  template: template,
  transclude: true,
  require: {
    ngModel: 'ngModel'
  },
  bindings: {
    width: '@?',
    height: '@?',
    thumbWidth: '@?',
    thumbHeight: '@?',
    cameraOptions: '<?',
    onCameraError: '&?',
    onCameraOpen: '&?'
  }
};

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
    return this.open(constraints).then(() => {
      const result = privates.result;
      privates.result = null;
      return result
    })
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
  this.close();

  if (!('deviceId' in device)) {
    throw new TypeError('Invalid device selected, must be of type MediaDeviceInfo')
  }

  const newConstraints = typeof this.defaultConstraints.video === 'object'
                         ? this.defaultConstraints.video
                         : {};

  newConstraints.deviceId = {exact: device.deviceId};
  this.defaultConstraints.video = newConstraints;

  return this.open()
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

  return Promise.resolve(canvas.toDataURL('image/png'))
};

WebRTCCamera.prototype.close = function () {
  const track = privateVars$1.get(this).videoTrack;
  track && track.stop();
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

angular.module('bmCamera', []).service('Camera', CameraService).component('bmCamera', CameraComponent);

})));
