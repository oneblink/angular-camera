'use strict'

angular.module('bm-example', ['bmCamera']).controller('example', ['$scope', '$document',
function ($scope, $doc) {
  $scope.stillImage = null
  $scope.stillImage2 = null

  $scope.width = 320
  $scope.height = 240

  $scope.resWidth = 640
  $scope.resHeight = 480

  const canvas = $doc[0].getElementById('temp')
  canvas.width = $scope.width
  canvas.height = $scope.height

  function rotate (imgData, angle) {
    const i = new Image($scope.width, $scope.height)

    i.addEventListener('load', function () {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, $scope.width, $scope.height)
      ctx.save()
      ctx.translate(canvas.width * 0.5, canvas.height * 0.5)
      ctx.rotate((Math.PI/180) * angle)
      ctx.translate(-canvas.width * 0.5, -canvas.height * 0.5)
      ctx.drawImage(i, 0, 0)
      ctx.restore()

      $scope.$apply(function () {
        $scope.stillImage2 = canvas.toDataURL()
      })
    })

    i.src = imgData
  }

  $scope.rotateLeft = function (imgData) {
    rotate(imgData, -90)
  }

  $scope.rotateRight = function (imgData) {
    rotate(imgData, 90)
  }

  $scope.cameraError = function (err) {
    console.log('camera error - ' , err)
  }

  $scope.setRes = function (width, height) {
    $scope.resWidth = width
    $scope.resHeight = height
  }

  $scope.cameraOpen = function (videoEl) {
    $scope.actualWidth = videoEl.videoWidth
    $scope.actualHeight = videoEl.videoHeight

  }
}])
