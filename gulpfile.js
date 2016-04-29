/**
 * Created by user on 24.03.16.
 */

var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var plumber = require("gulp-plumber");
var browserify = require("browserify");
var babelify = require('babelify');
var runSequence = require('run-sequence');
var gutil = require('gulp-util');
var source  = require('vinyl-source-stream');
var jshint = require('gulp-jshint');
var eslint = require('gulp-eslint');
var postcss = require('gulp-postcss');

var globalConfig = {
    prodDir: "dist",
    baseDir: "./app",
    moduleDir: "node_modules"
};
var config = {
    pathDevSCSS: globalConfig.baseDir + "/scss",
    pathDevCSS: globalConfig.baseDir + "/css",
    pathDevJS: globalConfig.baseDir + "/js",
    pathDevWorkJS: globalConfig.baseDir + "/js/src",
    pathProdCSS: globalConfig.prodDir + "/css",
    pathProdJS: globalConfig.prodDir + "/js",
    pathFramework7: globalConfig.moduleDir + "/framework7/dist"
};
var dependencies = [                    //зависимости
    'react',
    'react-dom'
];
var scriptsCount = 0;
gulp.task('useref', function(){
    return gulp.src(globalConfig.baseDir + '/*.html')
        .pipe(plumber({
            errorHandler: onError
         }))
        .pipe(useref())
        .pipe(gulp.dest(globalConfig.prodDir))
});

gulp.task('minify', ['useref'], function() {
    // Минифицируем только CSS файлы
    gulp.src(config.pathProdCSS + '/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest(config.pathProdCSS));
    // Минифицируем только js файлы
    gulp.src(config.pathProdJS + '/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(config.pathProdJS));
});


gulp.task('prejs', function () {
    return gulp.src(config.pathDevWorkJS + '/*.js')
        /*.pipe(jshint({
            "lookup": true
        }))
        .pipe(jshint.reporter('default'))*/
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());

});

// --------------------------------------------------------------------
// Task: Clean app/js
// --------------------------------------------------------------------

// синхронизация окна браузера и изменения файлов

gulp.task('watch', ['browserSync', 'sass', 'prejs'], function(){
    gulp.watch(config.pathDevSCSS + '/**/*.scss', ['sass']);
    gulp.watch(config.pathDevCSS + '/*.css', ['css']);
    gulp.watch(globalConfig.baseDir + '/*.html', browserSync.reload);
    gulp.watch(config.pathDevJS + '/*.js', browserSync.reload);
    gulp.watch(config.pathDevWorkJS + '/*.js', ['deploy']);
});
gulp.task('css', function () {
    var cssnext = require('postcss-cssnext');
    var precss = require('precss');
    var processors = [cssnext, precss];
    return gulp.src(config.pathDevCSS + '/*.css')
        .pipe(postcss(processors))
        .pipe(gulp.dest(config.pathDevCSS))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('sass', function() {
    return gulp.src(config.pathDevSCSS + '/**/*.scss')
        .pipe(sass())
        .pipe(gulp.dest(config.pathDevCSS))
        .pipe(browserSync.reload({
            stream: true
        }))
});


// синхронизация окна браузера и изменения файлов
gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: globalConfig.baseDir
        }
    })
});
gulp.task('scripts', function () {
    bundleApp(false);
});
gulp.task('deploy', ['prejs'], function () {
    bundleApp(true);
});
function bundleApp(isProduction) {
    scriptsCount++;
    // Browserify will bundle all our js files together in to one and will let
    // us use modules in the front end.
    var appBundler = browserify({
        entries: config.pathDevWorkJS + '/app.js',
        debug: true
    });
    // If it's not for production, a separate vendors.js file will be created
    // the first time gulp is run so that we don't have to rebundle things like
    // react everytime there's a change in the js file
    if (!isProduction && scriptsCount === 1){
        // create vendors.js for dev environment.
        browserify({
            require: dependencies,
            debug: true
        })
            .bundle()
            .on('error', gutil.log)
            .pipe(source('vendors.js'))
            .pipe(gulp.dest(config.pathDevJS));
        // copy css framework7
        gulp.src(config.pathFramework7 + '/js/framework7.min.js')
            .pipe(gulp.dest(config.pathDevJS + '/lib/', {}));
        gulp.src(config.pathFramework7 + '/css/framework7.ios.colors.min.css')
            .pipe(gulp.dest(config.pathDevCSS + '/lib/', {}));
        gulp.src(config.pathFramework7 + '/css/framework7.ios.min.css')
            .pipe(gulp.dest(config.pathDevCSS + '/lib/', {}));
    }
    if (!isProduction){
        // make the dependencies external so they dont get bundled by the
        // app bundler. Dependencies are already bundled in vendor.js for
        // development environments.
        dependencies.forEach(function(dep){
            appBundler.external(dep);
        })
    }

    appBundler
    // transform ES6 and JSX to ES5 with babelify
        .transform("babelify", {presets: ["es2015", "react"]})
        .bundle()
        .on('error',gutil.log)
        .pipe(source('bundle.js'))
        .pipe(gulp.dest(config.pathDevJS));
}
// запуск рабочего проекта
gulp.task('default', function (callback) {
    runSequence(['sass', 'scripts', 'watch'],
        function(){ console.log('default'); }
    )
});

// --------------------------------------------------------------------
// Error Handler
// --------------------------------------------------------------------

var onError = function (err) {
    console.log(err);
    this.emit('end');
};
