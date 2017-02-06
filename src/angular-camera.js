'use strict'

import CameraComponent from './camera-component.js'
import CameraService from './camera-service.js'

// eslint-disable-next-line no-undef
angular.module('bmCamera', [])
  .service('Camera', CameraService)
  .component('bmCamera', CameraComponent)
