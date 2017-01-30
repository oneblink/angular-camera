'use strict'

import Camera from '@blinkmobile/camera'

function CameraService () {
  return (...args) => Camera.apply(Camera, args)
}

export default CameraService
