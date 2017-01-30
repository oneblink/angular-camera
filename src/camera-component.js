import CameraController from './camera-controller.js'
import template from './camera-controller.html'

export default {
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
}
