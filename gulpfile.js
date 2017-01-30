'use strict'

const path = require('path')

const gulp = require('gulp')
const util = require('gulp-util')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const del = require('del')

const KarmaServer = require('karma').Server

const devBanner = require('./buildfiles/banner.js').devBanner
const prodBanner = require('./buildfiles/banner.js').prodBanner

const pkg = require('./package.json')

// rollup specific
const rollup = require('rollup').rollup
const babel = require('rollup-plugin-babel')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const eslint = require('rollup-plugin-eslint')
const inject = require('rollup-plugin-inject')
const htmltemplate = require('rollup-plugin-html')

// set based on command line flags
const PROD_BUILD = (util.env.buildmode || '').toLowerCase().indexOf('prod') >= 0
const USE_SHIM = util.env.shim || false

const DEST = 'dist'
const FILENAME = 'bm-angular-camera.js'
const FILENAME_CORDOVA = 'bm-angular-camera-cordova.js'
const FILENAME_WEBRTC = 'bm-angular-camera-webrtc.js'
const MODULE_FORMAT = 'umd'
const MODULE_NAME = 'bmCameraFactory'

const banner = PROD_BUILD ? prodBanner(pkg) : devBanner(pkg)

const makeBundle = function (entry, destFilename) {
  // notify the developer about what is being built
  // eslint-disable-next-line
  console.log(`Creating a ${PROD_BUILD ? 'production' : 'development'} build
  ${!USE_SHIM ? 'NOT ' : ''}using getUserMedia Shim
  -----------------------------
  ${banner.replace(/^\/?\s?\*\/?/gm, '')}`)

  const plugins = [
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs(),
    // eslint({
    //   exclude: []
    // }),
    htmltemplate(),
    babel({
      exclude: 'node_modules/**'
    })
  ]

  // if (USE_SHIM) {
  //   plugins.push(inject({
  //     include: './src/webrtc/camera.js',
  //     getUserMedia: 'getusermedia'
  //   }))
  // }

  return rollup({entry, plugins})
    .then(function (bundle) {
      const bundleOpts = {
        format: MODULE_FORMAT,
        moduleName: MODULE_NAME,
        dest: `${DEST}/${destFilename}`,
        banner: banner
      }

      if (USE_SHIM) {
        bundleOpts.globals = {
          getusermedia: 'getUserMedia'
        }
      }
      return bundle.write(bundleOpts)
    })
}

const minifiedName = (strings, filename) => filename.replace(/\.js$/, '.min.js')

const minify = function (fileName) {
  return () => {
    gulp.src(`${DEST}/${fileName}`)
        .pipe(rename(minifiedName`${fileName}`))
        .pipe(uglify({preserveComments: 'license'}))
        .pipe(gulp.dest(DEST))
  }
}

/* ///////////////////// gulp tasks */

gulp.task('clean', () => {
  return del(DEST)
})

gulp.task('test', (done) => {
  new KarmaServer({
    configFile: path.join(__dirname, './karma.conf.js'),
    singleRun: false,
    files: [
      'node_modules/babel-helpers/index.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/getusermedia/getusermedia.bundle.js',
      'dist/bm-angular-camera.js',
      // 'src/angular-camera.js',
      'test/**/*.js'
    ]
  }, done).start()
})

gulp.task('build', () => {
  let cb = () => true
  if (PROD_BUILD) {
    cb = minify(FILENAME)
  }
  return makeBundle('src/angular-camera.js', FILENAME).then(cb)
})

// gulp.task('cordova', () => {
//   let cb = () => true
//   if (PROD_BUILD) {
//     cb = minify(FILENAME_CORDOVA)
//   }
//   return makeBundle('src/cordova/cordova-factory.js', FILENAME_CORDOVA)
//     .then(cb)
// })

// gulp.task('webrtc', () => {
//   let cb = () => true
//   if (PROD_BUILD) {
//     cb = minify(FILENAME_WEBRTC)
//   }
//   return makeBundle('src/webrtc/webrtc-factory.js', FILENAME_WEBRTC)
//     .then(cb)
// })

gulp.task('default', ['clean', 'build'], () => {})
