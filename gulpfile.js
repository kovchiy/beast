var gulp = require('gulp')
var minify = require('gulp-minify')
var concat = require('gulp-concat')

gulp.task('default', function() {
    gulp.src(['./src/core.js', './src/bml-parser.js', './src/bem-node.js'])
        .pipe(concat('beast.js'))
        .pipe(minify())
        .pipe(gulp.dest('./build'))
});