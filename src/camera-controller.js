'use strict'

const DEFAULT_WIDTH = 640
const DEFAULT_HEIGHT = 480
const DEFAULT_THUMB_WIDTH = 100
const DEFAULT_THUMB_HEIGHT = 100

CameraController.$inject = ['$scope', '$element', 'Camera']
function CameraController ($scope, $element, Camera) {
  const vm = this
  let initialized = false

  function toWebRTCOptions () {
    const userDefinedOptions = (vm.cameraOptions && vm.cameraOptions.video) || {}
    const newVideoOptions = {
      width: {exact: +vm.width},
      height: {exact: +vm.height}
    }

    const mergedVideoOptions = Object.assign({}, userDefinedOptions, newVideoOptions)
    return {
      audio: false,
      video: mergedVideoOptions
    }
  }

  function toCordovaOptions () {
    return Object.assign({}, vm.cameraOptions, {targetWidth: vm.width, targetHeight: vm.height})
  }

  const getOptions = () => vm.webRTC ? toWebRTCOptions() : toCordovaOptions()

  function setCameraOptions () {
    vm.cameraOptions = getOptions()
    vm.camera.defaultConstraints = vm.cameraOptions
  }

  vm.$onInit = () => {
    vm.videoEl = $element.find('video')[0]
    vm.imgEl = $element[0].querySelector('[camera-target]')
    vm.camera = Camera(vm.videoEl)

    vm.onCameraOpen = vm.onCameraOpen || function () {}
    vm.onCameraError = vm.onCameraError || function () {}

    vm.isCameraOpen = false
    vm.webRTC = !!vm.camera.close

    vm.width = vm.width || DEFAULT_WIDTH
    vm.height = vm.height || DEFAULT_HEIGHT

    vm.thumbWidth = vm.thumbWidth || DEFAULT_THUMB_WIDTH
    vm.thumbHeight = vm.thumbHeight || DEFAULT_THUMB_HEIGHT

    setCameraOptions(vm.cameraOptions)

    initialized = true
  }

  vm.$onChanges = (changesObj) => {
    if (!changesObj) {
      return
    }

    for (let prop in changesObj) {
      if (prop === 'cameraOptions') {
        setCameraOptions(changesObj[prop].currentValue)
      } else {
        vm[prop] = changesObj[prop].currentValue
      }
    }

    if (initialized) {
      setCameraOptions(vm.cameraOptions)

      if (vm.isCameraOpen) {
        vm.camera.close()
        vm.openCamera()
      }
    }
  }

  vm.openCamera = function openCamera () {
    return vm.camera.open()
             .then(() => vm.camera.getDevices())
             .then(() => $scope.$apply(() => {
               vm.isCameraOpen = true && vm.webRTC
               vm.error = null
               vm.onCameraOpen({videoEl: vm.videoEl})
             }))
             .catch((err) => {
               $scope.$apply(() => {
                 vm.error = err.name === 'NotAllowedError' ? 'You must grant access to your webcam to take photos'
                                                            : null
                  // eslint-disable-next-line no-console
                 console.warn(`There was an error opening the camera: ${err}`)
                 vm.onCameraError({err: err})
               })
             })
  }

  vm.closeCamera = function closeCamera () {
    vm.camera.close && vm.camera.close()
    vm.isCameraOpen = false
  }

  vm.takePhoto = function takePhoto () {
    vm.isCameraOpen = false
    return vm.camera.getPicture().then((img) => {
      $scope.$apply(() => {
        vm.ngModel.$setViewValue(img)
        vm.closeCamera()
      })
    }).catch((err) => {
      vm.error = err.toString()
      // eslint-disable-next-line no-console
      console.warn(`There was an error opening the camera: ${err}`)
      vm.onCameraError({err: err})
    })
  }

  vm.useDevice = function useDevice () {
    vm.selectedDevice && vm.camera.useDevice(vm.selectedDevice)
  }
}

export default CameraController
