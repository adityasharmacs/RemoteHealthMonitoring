var gulp = require('gulp');
var gulpsync = require('gulp-sync')(gulp);
var gulpNgConfig = require('gulp-ng-config');
var connect = require('gulp-connect');
var less = require('gulp-less');
var concat = require('gulp-concat');
var protractor = require("gulp-protractor").protractor;
var webdriver_standalone = require("gulp-protractor").webdriver_standalone;
var webdriver_update = require("gulp-protractor").webdriver_update;
var del = require('del');
var argv = require('yargs').argv;
var addStream = require('add-stream');
var path = require('path');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var history = require('connect-history-api-fallback');

var environment = argv.server || 'development';

// function adding config module
function makeConfig() {
  return gulp.src('./config/service/' + environment + '.json')
    .pipe(gulpNgConfig('Service'));
}

// gulp Connect Task
gulp.task('connect', function () {
    connect.server({
        root: 'public',
        port: 4000,
        livereload: true,
        middleware: function(connect, opt) {
          return [
            history({})
           ]
        }
    })
})

// gulp for running tests
gulp.task('test-connect', function() {
    connect.server({
        root:'public',
        port: 2000
    });
});

// gulp task for closing server
gulp.task('disconnect', function(){
    connect.serverClose({
        port: 2000
    });
}); 

// Deleting older combined-app.js
gulp.task('clean-js', function () {
  return del([
    './app/config_app.js'
  ]);
});

// Config task with default development parameter
gulp.task('config', ['clean-js'], function() {
  return gulp.src('./app/app.js')
    .pipe(addStream.obj(makeConfig())) // makeConfig is defined a few code blocks up
    .pipe(concat('config_app.js'))
    .pipe(gulp.dest('./app'));
});

// gulp update webdriver task
gulp.task('webdriver_update', webdriver_update);

// gulp start standalone webdriver
gulp.task('webdriver_standalone', webdriver_standalone);

// gulp run protractor tests
gulp.task('protractor', function(){
    return gulp.src(['./tests/*.js'])
        .pipe(protractor({
            configFile: "./protractor.conf.js"
        }))
        .on('error', function(e) {throw e})
});

// gulp browersify task
gulp.task('browserify', function() {
    return browserify('./app/config_app.js')
        .bundle()
        .pipe(source('main.js'))
        .pipe(gulp.dest('./public/js/'));
});

// gulp less task
gulp.task('less', function () {
  return gulp.src('./less/*.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('./public/css'));
});

// gulp watch task
gulp.task('watch', function() {
    gulp.watch('./app/**/*.js', gulpsync.sync(['config', 'browserify']))
    gulp.watch('./less/*.less', ['less'])
});

// gulp build application
gulp.task('build', gulpsync.sync(['config', 'browserify', 'less']));

// gulp task for development (arguments: --server production/development)
gulp.task('develop', gulpsync.sync(['config', 'browserify', 'less', 'connect', 'watch']));

// gulp task to start application
gulp.task('start', gulpsync.sync(['config', 'browserify', 'less', 'connect']));

// gulp task to test the application
gulp.task('test', gulpsync.sync(['config', 'browserify', 'less', 'test-connect', 'protractor', 'disconnect']));
