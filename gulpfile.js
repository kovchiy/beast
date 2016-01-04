var gulp = require('gulp')
var minify = require('gulp-minify')
var concat = require('gulp-concat')
var header = require('gulp-header')

var pkg = require('./package.json')

gulp.task('default', function() {
    gulp.src(['./src/core.js', './src/bml-parser.js', './src/bem-node.js'])
        .pipe(concat('beast.js'))
        .pipe(minify())
        .pipe(
            header([
                '/**',
                ' * ' + pkg.name,
                ' * @version ' + pkg.version,
                ' * @homepage ' + pkg.homepage,
                ' */',
                ''
            ].join('\n'))
        )
        .pipe(gulp.dest('./build'))
});