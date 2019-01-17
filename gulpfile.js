/*jshint undef: false*/
var gulp = require('gulp');
var concat = require('gulp-concat');
var nghtml2js = require('gulp-ng-html2js');
var gulpJsBeautifier = require('gulp-jsbeautifier');
var filter = require('gulp-filter');
var babel = require('gulp-babel');
var path = require('path');
var exec = require('child_process').execSync;

var scriptPath = './src/javascript/';
var templatePath = './src/templates/';
var outputPath = './dist/';
var buildPath = './build/';
var cssPath = './css/';

gulp.task('jshint', function() {
  return exec('./node_modules/jshint/bin/jshint . --reporter ./node_modules/jshint-stylish/index.js', { stdio: 'inherit' });
});

gulp.task('eslint', function() {
  return exec('./node_modules/eslint/bin/eslint.js --fix --ignore-path .jshintignore .', { stdio: 'inherit' });
});

gulp.task('lint-html', function lintHtmlTask() {
  gulp.src(templatePath + '*.html')
    .pipe(gulpJsBeautifier({
      indent_size: 2,
      end_with_newline: true,
      unformatted: []
    }))
    .pipe(gulpJsBeautifier.reporter())
    .pipe(gulp.dest(templatePath));
  gulp.src(templatePath + '**/*.html')
    .pipe(gulpJsBeautifier({
      indent_size: 2,
      end_with_newline: true,
      unformatted: []
    }))
    .pipe(gulpJsBeautifier.reporter())
    .pipe(gulp.dest(templatePath));
});

gulp.task('compileTemplates', function() {
  return gulp.src(templatePath + '**/*.html')
      .pipe(nghtml2js({ moduleName: 'angucomplete-alt.templates' }))
      .pipe(gulp.dest(buildPath + 'templates/'));
});

gulp.task('mergeTemplates', ['compileTemplates'], function() {
  var templateJavaScript = [buildPath + 'templates/**/*.js'];

  return gulp.src(templateJavaScript)
      .pipe(concat('merged_templates.js', {newLine: ';'}))
      .pipe(gulp.dest(buildPath));
});

gulp.task('mergeScripts', ['mergeTemplates'], function() {
  var scriptsToMerge = [
    scriptPath + 'modules.js',
    scriptPath + '*.js',
    scriptPath + '**/*.js',
    buildPath + 'merged_templates.js'
  ];

  var coreScriptFilter = filter([ 'app/assets/javascripts/**'], {restore: true});
  var mergeTemplatesFilter = filter([ 'build/merged_templates.js'], {restore: true});

  return gulp.src(scriptsToMerge)
    .pipe(coreScriptFilter)
    .pipe(coreScriptFilter.restore)
    .pipe(mergeTemplatesFilter)
    .pipe(mergeTemplatesFilter.restore)
    .pipe(babel())
    .pipe(concat('angucomplete-alt.js', {newLine: ';\n'}))
    .pipe(gulp.dest(outputPath))
});

gulp.task('lint', ['eslint', 'jshint', 'lint-html']);
gulp.task('clean', function() {
  return exec('rm -r build/', { stdio: 'inherit' });
});

gulp.task('build', ['lint', 'mergeScripts']);
