/*
 * @blinkmobile/angular-camera: v1.1.1 | https://github.com/blinkmobile/angular-camera#readme
 * (c) 2018 Blink Mobile Technologies | Released under the MIT license
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.bmCameraFactory = factory());
}(this, (function () { 'use strict';

var DEFAULT_WIDTH = 640;
var DEFAULT_HEIGHT = 480;
var DEFAULT_THUMB_WIDTH = 320;
var DEFAULT_THUMB_HEIGHT = 240;
var CLEAR_CONFIRM = 'Are you sure you want to clear?';

CameraController.$inject = ['$scope', '$element', '$window', 'Camera'];
function CameraController($scope, $element, $window, Camera) {
  var vm = this;
  var initialized = false;
  var takingPhoto = false;

  function toWebRTCOptions() {
    var userDefinedOptions = vm.cameraOptions && vm.cameraOptions.video || {};
    var newVideoOptions = {
      width: { exact: +vm.width },
      height: { exact: +vm.height }
    };

    var mergedVideoOptions = Object.assign({}, userDefinedOptions, newVideoOptions);
    return {
      audio: false,
      video: mergedVideoOptions
    };
  }

  function toCordovaOptions() {
    return Object.assign({}, vm.cameraOptions, { targetWidth: vm.width, targetHeight: vm.height });
  }

  var getOptions = function getOptions() {
    return vm.webRTC ? toWebRTCOptions() : toCordovaOptions();
  };

  function setCameraOptions() {
    vm.cameraOptions = getOptions();
    vm.camera.defaultConstraints = vm.cameraOptions;
  }

  vm.$onInit = function () {
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

  vm.$onChanges = function (changesObj) {
    if (!changesObj) {
      return;
    }

    for (var prop in changesObj) {
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
    return vm.camera.open().then(function () {
      return vm.camera.getDevices();
    }).then(function () {
      return $scope.$apply(function () {
        vm.isCameraOpen = true && vm.webRTC;
        vm.error = null;
        vm.onCameraOpen({ videoEl: vm.videoEl });
      });
    }).catch(function (err) {
      $scope.$apply(function () {
        vm.error = err.name === 'NotAllowedError' ? 'You must grant access to your webcam to take photos' : null;
        // eslint-disable-next-line no-console
        console.warn('There was an error opening the camera: ' + err);
        vm.onCameraError({ err: err });
      });
    });
  };

  vm.closeCamera = function closeCamera() {
    vm.camera.close && vm.camera.close();
    vm.isCameraOpen = false;
    takingPhoto = false;
  };

  vm.takePhoto = function takePhoto() {
    if (takingPhoto) {
      return;
    }
    takingPhoto = true;
    return vm.camera.getPicture().then(function (img) {
      $scope.$apply(function () {
        vm.ngModel.$setViewValue(img);
        vm.closeCamera();
      });
    }).catch(function (err) {
      vm.error = err.toString();
      // eslint-disable-next-line no-console
      console.warn('There was an error opening the camera: ' + err);
      vm.closeCamera();
      vm.onCameraError({ err: err });
    });
  };

  vm.clearImage = function clearImage() {
    if ($window.confirm(CLEAR_CONFIRM)) {
      vm.ngModel.$setViewValue(null);
    }
  };

  vm.useDevice = function useDevice() {
    vm.selectedDevice && vm.camera.useDevice(vm.selectedDevice);
  };
}

var template = "<div class=\"bm-camera\">\n  <div class=\"bm-camera__video-image-container\">\n    <figure class=\"bm-camera__video-container\">\n    <video class=\"bm-camera__video\" autoplay width=\"{{$ctrl.width}}\" height=\"{{$ctrl.height}}\" ng-show=\"$ctrl.isCameraOpen\" width=\"{{$ctrl.width}}\" height=\"{{$ctrl.height}}\"></video>\n    </figure>\n    <figure class=\"bm-camera__image-container\">\n      <img ng-src=\"{{$ctrl.ngModel.$viewValue}}\" camera-target width=\"{{$ctrl.thumbWidth}}\" height=\"{{$ctrl.thumbHeight}}\" ng-if=\"$ctrl.ngModel.$viewValue\" class=\"bm-camera__image\">\n    </figure>\n    <!-- allows the developer to include their own image manipulation controls -->\n    <div ng-transclude></div>\n  </div>\n  <div class=\"bm-camera__selector-container\" ng-show=\"$ctrl.showDeviceSelect && $ctrl.camera.availableDevices.length > 1\">\n    <select class=\"bm-camera__selector\" ng-model=\"$ctrl.selectedDevice\" ng-options=\"device.label for device in $ctrl.camera.availableDevices\" ng-change=\"$ctrl.useDevice()\">\n\n    </select>\n  </div>\n  <div ng-if=\"$ctrl.webRTC\" class=\"bm-camera__button-container\">\n    <button class=\"bm-button bm-button__clear-photo\" name=\"take-photo\" ng-click=\"$ctrl.clearImage()\" ng-show=\"$ctrl.ngModel.$viewValue\">Clear</button>\n    <button class=\"bm-button bm-button__open\" name=\"open-camera\" ng-click=\"$ctrl.openCamera()\" ng-hide=\"$ctrl.isCameraOpen\">Open Camera</button>\n    <button class=\"bm-button bm-button__close ng-hide\" name=\"close-camera\" ng-click=\"$ctrl.closeCamera()\" ng-show=\"$ctrl.isCameraOpen\">Close Camera</button>\n    <button class=\"bm-button bm-button__take-photo\" name=\"take-photo\" ng-click=\"$ctrl.takePhoto()\" ng-show=\"$ctrl.isCameraOpen\">Take Photo</button>\n\n    <div class=\"bm-error\" ng-show=\"$ctrl.error\">\n      <p class=\"bm-error__text\">{{::$ctrl.error}}</p>\n    </div>\n  </div>\n  <div ng-if=\"!$ctrl.webRTC\" class=\"bm-camera__button-container\">\n    <button class=\"bm-button bm-button__clear-photo\" name=\"take-photo\" ng-click=\"$ctrl.clearImage()\" ng-show=\"$ctrl.ngModel.$viewValue\">Clear</button>\n    <button class=\"bm-button bm-button__take-photo\" name=\"open-camera\" ng-click=\"$ctrl.takePhoto()\">Take Photo</button>\n  </div>\n</div>\n";

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
    showDeviceSelect: '@?',
    cameraOptions: '<?',
    onCameraError: '&?',
    onCameraOpen: '&?'
  }
};

var privateVars = new WeakMap();

function CordovaCamera() {
  /* eslint-disable no-undef */
  this.availableDevices = [{ deviceId: Camera.Direction.BACK, label: 'Rear Camera' }, { deviceId: Camera.Direction.FRONT, label: 'Front Camera' }];

  this.defaultConstraints = {
    cameraDirection: Camera.Direction.BACK,
    quality: 50,
    destinationType: Camera.DestinationType.FILE_URI,
    encodingType: Camera.EncodingType.PNG,
    sourceType: Camera.PictureSourceType.CAMERA,
    correctOrientation: true
    /* eslint-enable no-undef */

  };privateVars.set(this, { result: null });
}

// instance methods
CordovaCamera.prototype.getDevices = function () {
  return Promise.resolve(this.availableDevices);
};

CordovaCamera.prototype.useDevice = function (device) {
  if (!('deviceId' in device)) {
    throw new TypeError('Invalid device selected, must be of type MediaDeviceInfo');
  }

  this.defaultConstraints.cameraDirection = device.deviceId;
};

CordovaCamera.prototype.open = function () {
  var _this = this;

  var constraints = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.defaultConstraints;

  constraints = Object.assign({}, this.defaultConstraints, constraints);

  return new Promise(function (resolve, reject) {
    var onSuccess = function onSuccess(data) {
      privateVars.get(_this).result = data;
      resolve(data);
    };
    navigator.camera.getPicture(onSuccess, reject, constraints);
  });
};

CordovaCamera.prototype.getPicture = function () {
  var constraints = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.defaultConstraints;

  var privates = privateVars.get(this);

  if (!privates.result) {
    return this.open(constraints).then(function () {
      var result = privates.result;
      privates.result = null;
      return result;
    });
  }

  return Promise.resolve(privates.result);
};

function cordovaFactory() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  // allows constructor to accept variable number of arguments.
  args.unshift(null);
  return new (CordovaCamera.bind.apply(CordovaCamera, args))();
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var privateVars$1 = new WeakMap();

// constructor
function WebRTCCamera(videoEl) {
  if (!videoEl) {
    throw new TypeError('WebRTCCamera expects a video element during instansiation');
  }

  this.defaultConstraints = { video: true, audio: false };
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
    throw new TypeError('Invalid device selected, must be of type MediaDeviceInfo');
  }

  var newConstraints = _typeof(this.defaultConstraints.video) === 'object' ? this.defaultConstraints.video : {};

  newConstraints.deviceId = { exact: device.deviceId };
  this.defaultConstraints.video = newConstraints;

  return this.open();
};

WebRTCCamera.prototype.getDevices = function () {
  var _this = this;

  if (!privateVars$1.get(this).authorised) {
    return Promise.resolve([]);
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return Promise.reject(new Error('Media Devices API not supported in this browser'));
  }

  return navigator.mediaDevices.enumerateDevices().then(function (devices) {
    _this.availableDevices = devices.filter(function (d) {
      return d.kind.toLowerCase() === 'videoinput';
    });

    return _this.availableDevices;
  });
};

WebRTCCamera.prototype.open = function () {
  var _this2 = this;

  var constraints = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.defaultConstraints;

  constraints = Object.assign({}, this.defaultConstraints, constraints);

  return new Promise(function (resolve, reject) {
    // eslint-disable-next-line
    getUserMedia(constraints, function (err, stream) {
      if (err) {
        return reject(err);
      }

      var videoTracks = stream.getVideoTracks();
      var vars = privateVars$1.get(_this2);
      vars.authorised = true;

      if (!videoTracks.length) {
        vars.stream = null;
        vars.videoTrack = null;

        return reject(new Error('Could not get a video track from stream'));
      }

      vars.videoEl.addEventListener('canplay', resolve, { once: true });

      vars.videoTrack = videoTracks[0];
      vars.stream = stream;
      vars.videoEl.srcObject = stream;
    });
  });
};

WebRTCCamera.prototype.getPicture = function () {
  if (!privateVars$1.get(this).authorised) {
    // eslint-disable-next-line
    return Promise.reject(new DOMException('User has not authorised use of the camera', 'NotAllowedError'));
  }

  var vars = privateVars$1.get(this);
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var videoEl = vars.videoEl;

  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  ctx.drawImage(vars.videoEl, 0, 0);

  return Promise.resolve(canvas.toDataURL('image/png'));
};

WebRTCCamera.prototype.close = function () {
  var track = privateVars$1.get(this).videoTrack;
  track && track.stop();
};

function webRTCFactory() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  // allows constructor to accept variable number of arguments.
  args.unshift(null);
  return new (WebRTCCamera.bind.apply(WebRTCCamera, args))();
}

function cameraFactory() {
  var useCordova = !!(window.Camera && navigator.camera);

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (useCordova) {
    return cordovaFactory.apply(null, args);
  }

  return webRTCFactory.apply(null, args);
}

function CameraService() {
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return cameraFactory.apply(cameraFactory, args);
  };
}

// eslint-disable-next-line no-undef
var angularCamera = angular.module('bmCamera', []).service('Camera', CameraService).component('bmCamera', CameraComponent);

return angularCamera;

})));
