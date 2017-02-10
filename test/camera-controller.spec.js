'use strict'

const DEFAULT_WIDTH = 640
const DEFAULT_HEIGHT = 480

function makeCameraServiceInjector (serviceOverrides) {
  return module(function ($provide) {
    function mockCameraService () {
      return Object.assign({
        open: () => Promise.resolve(),
        getPicture: () => Promise.resolve(),
        useDevice: () => Promise.resolve(),
        getDevices: () => Promise.resolve([{deviceId: 'test-device'}]),
        close: () => true,
        defaultConstraints: {audio: false, video: true}
      }, serviceOverrides)
    }

    $provide.value('Camera', mockCameraService)
  })
}

describe('Camera Component - Access Granted', () => {
  let $componentController
  let $rootScope

  let ctrl = null

  beforeEach(module('bmCamera'))

  beforeEach(makeCameraServiceInjector())

  beforeEach(inject((_$componentController_, _$injector_, _$rootScope_) => {
    $componentController = _$componentController_
    $rootScope = _$rootScope_
  }))

  describe('init', () => {
    describe('bindings - default', () => {
      let ctrl = null

      beforeEach(() => {
        const bindings = {}
        const locals = {
          $scope: $rootScope.$new(),
          $element: angular.element('<div></div>')
        }
        ctrl = $componentController('bmCamera', locals, bindings)

        ctrl.$onInit()
      })

      it('should set defaults when none are supplied', () => {
        expect(ctrl).not.toBe(null)
        expect(ctrl.width).toBe(DEFAULT_WIDTH)
        expect(ctrl.height).toBe(DEFAULT_HEIGHT)
        expect(ctrl.thumbWidth).toBe(100)
        expect(ctrl.thumbHeight).toBe(100)
        expect(ctrl.webRTC).toBe(true)
      })

      it('should change the constraints to match the defaults', () => {
        expect(ctrl.cameraOptions).toEqual({
          audio: false,
          video: {
            width: {
              exact: DEFAULT_WIDTH
            },
            height: {
              exact: DEFAULT_HEIGHT
            }
          }
        })
      })
    })

    describe('bindings - user set', () => {
      beforeEach(() => {
        const bindings = {
          width: 320,
          height: 240,
          thumbWidth: 150,
          thumbHeight: 150
        }
        const locals = {
          $scope: $rootScope.$new(),
          $element: angular.element('<div></div>')
        }
        ctrl = $componentController('bmCamera', locals, bindings)

        ctrl.$onInit()
      })

      it('should use the template provided bindings', () => {
        expect(ctrl).not.toBe(null)
        expect(ctrl.width).toBe(320)
        expect(ctrl.height).toBe(240)
        expect(ctrl.thumbWidth).toBe(150)
        expect(ctrl.thumbHeight).toBe(150)
      })

      it('should change the constraints to match the defaults', () => {
        expect(ctrl.cameraOptions).toEqual({
          audio: false,
          video: {
            width: {
              exact: 320
            },
            height: {
              exact: 240
            }
          }
        })
      })
    })
  })

  describe('#openCamera', () => {
    let cameraOpenSpy
    let cameraErrorSpy

    beforeEach(() => {
      cameraOpenSpy = jasmine.createSpy('onCameraOpen')
      cameraErrorSpy = jasmine.createSpy('onCameraError')
    })

    beforeEach(() => {
      const bindings = {
        width: 320,
        height: 240,
        thumbWidth: 150,
        thumbHeight: 150,
        onCameraOpen: cameraOpenSpy,
        onCameraError: cameraErrorSpy
      }
      const locals = {
        $scope: $rootScope.$new(),
        $element: angular.element('<div></div>')
      }
      ctrl = $componentController('bmCamera', locals, bindings)

      ctrl.$onInit()
    })

    afterEach(() => {
      cameraOpenSpy.calls.reset()
      cameraErrorSpy.calls.reset()
    })

    it('should set error to null', (done) => {
      ctrl.error = 'bad'
      ctrl.openCamera().then(() => {
        expect(ctrl.error).toBe(null)
        done()
      }).catch(done.fail)
    })

    it('should call the onCameraOpen function', (done) => {
      ctrl.openCamera().then(() => {
        expect(cameraOpenSpy.calls.count()).toBe(1)

        // videoEl is undefined because we are just testing the controller, not the $compile'd component
        expect(cameraOpenSpy.calls.argsFor(0)[0]).toEqual({videoEl: undefined})
        done()
      }).catch(done.fail)
    })

    it('should NOT call the onCameraError function', (done) => {
      ctrl.openCamera().then(() => {
        expect(cameraErrorSpy.calls.count()).toBe(0)
        done()
      }).catch(done.fail)
    })

    it('should set isCameraOpen to false', (done) => {
      ctrl.openCamera().then(() => {
        expect(ctrl.isCameraOpen).toBe(true)
        return ctrl.takePhoto()
      }).then(() => {
        expect(ctrl.isCameraOpen).toBe(false)
        done()
      }).catch(done.fail)
    })
  })
})

describe('Camera Component - Access Denied', () => {
  let $componentController
  let $rootScope
  let cameraOpenSpy
  let cameraErrorSpy

  let ctrl = null

  beforeEach(module('bmCamera'))

  beforeEach(makeCameraServiceInjector({
    open: () => Promise.reject({name: 'NotAllowedError'})
  }))

  beforeEach(inject((_$componentController_, _$injector_, _$rootScope_) => {
    $componentController = _$componentController_
    $rootScope = _$rootScope_
  }))

  beforeEach(() => {
    cameraOpenSpy = jasmine.createSpy('onCameraOpen')
    cameraErrorSpy = jasmine.createSpy('onCameraError')

    cameraOpenSpy.and.returnValue(Promise.reject({name: 'NotAllowedError'}))
  })

  beforeEach(() => {
    const bindings = {
      width: 320,
      height: 240,
      thumbWidth: 150,
      thumbHeight: 150,
      onCameraOpen: cameraOpenSpy,
      onCameraError: cameraErrorSpy
    }
    const locals = {
      $scope: $rootScope.$new(),
      $element: angular.element('<div></div>')
    }
    ctrl = $componentController('bmCamera', locals, bindings)

    ctrl.$onInit()
  })

  afterEach(() => {
    cameraOpenSpy.calls.reset()
    cameraErrorSpy.calls.reset()
  })

  it('should set error to Denied message', (done) => {
    ctrl.openCamera().then(() => {
      expect(ctrl.error).toBe('You must grant access to your webcam to take photos')
      done()
    }).catch(done.fail)
  })

  it('should NOT call the onCameraOpen function', (done) => {
    ctrl.openCamera().then(() => {
      expect(cameraOpenSpy.calls.count()).toBe(0)
      done()
    }).catch(done.fail)
  })

  it('should call the onCameraError function', (done) => {
    ctrl.openCamera().then(() => {
      expect(cameraErrorSpy.calls.count()).toBe(1)
      done()
    }).catch(done.fail)
  })
})
