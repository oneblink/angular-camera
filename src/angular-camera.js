'use strict'

import CameraComponent from './camera-component.js'
import CameraService from './camera-service.js'

angular.module('bmCamera', [])
  .service('Camera', CameraService)
  .component('bmCamera', CameraComponent)
