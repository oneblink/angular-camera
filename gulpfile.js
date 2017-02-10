'use strict'

const path = require('path')

const gulp = require('gulp')
const util = require('gulp-util')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const del = require('del')
const pump = require('pump')

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
const htmltemplate = require('rollup-plugin-html')

// set based on command line flags
const PROD_BUILD = (util.env.buildmode || '').toLowerCase().indexOf('prod') >= 0

const DEST = 'dist'
const ENTRY_POINT = 'src/angular-camera.js'
const FILENAME = 'bm-angular-camera.js'
const MODULE_FORMAT = 'umd'
const MODULE_NAME = 'bmCameraFactory'

let banner = PROD_BUILD ? prodBanner(pkg) : devBanner(pkg)

const makeBundle = function (entry, destFilename) {
  // notify the developer about what is being built
  // eslint-disable-next-line
  console.log(`Creating a ${PROD_BUILD ? 'production' : 'development'} build
-----------------------------
${banner.replace(/^\/?\s?\*\/?/gm, '')}`)

  const plugins = [
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs(),
    eslint({
      exclude: []
    }),
    htmltemplate(),
    babel({
      // exclude: 'node_modules/**'
    })
  ]

  return rollup({entry, plugins})
    .then(function (bundle) {
      const bundleOpts = {
        format: MODULE_FORMAT,
        moduleName: MODULE_NAME,
        dest: `${DEST}/${destFilename}`,
        banner: banner
      }

      return bundle.write(bundleOpts)
    })
}

const minifiedName = (strings, filename) => filename.replace(/\.js$/, '.min.js')

const minify = function (fileName) {
  return (done) => pump([
    gulp.src(`${DEST}/${fileName}`),
    rename(minifiedName`${fileName}`),
    uglify({preserveComments: 'license'}),
    gulp.dest(DEST)
  ], done)
}

/* ///////////////////// gulp tasks */

gulp.task('clean', () => {
  return del(DEST)
})

const karmaFiles = [
  'node_modules/babel-helpers/index.js',
  'node_modules/angular/angular.js',
  'node_modules/angular-mocks/angular-mocks.js',
  'node_modules/getusermedia/getusermedia.bundle.js',
  'dist/bm-angular-camera.min.js',
  'test/**/*.js'
]

gulp.task('test', ['build-prod'], (done) => {
  new KarmaServer({
    configFile: path.join(__dirname, './karma.conf.js'),
    singleRun: true,
    files: karmaFiles
  }, done).start()
})

gulp.task('test-single-run', ['build-prod'], (done) => {
  new KarmaServer({
    configFile: path.join(__dirname, './karma.conf.js'),
    singleRun: true,
    autoWatch: false,
    files: karmaFiles
  }, done).start()
})

gulp.task('build', (done) => {
  let cb = (d) => d()
  if (PROD_BUILD) {
    cb = minify(FILENAME)
  }

  makeBundle(ENTRY_POINT, FILENAME).then(cb(done))
})

gulp.task('build-prod', (done) => {
  // force the banner to be production
  banner = prodBanner(pkg)
  makeBundle(ENTRY_POINT, FILENAME).then(minify(FILENAME)(done))
})

gulp.task('default', ['clean', 'build', 'test-single-run'], () => {})
