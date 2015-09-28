//config
var libraries = [
  {
    css: [],
    js: ["bower_components/jquery/dist/jquery.js"]
  },
  {
    css: ["bower_components/bootstrap/dist/css/bootstrap.css"],
    js: ["bower_components/bootstrap/dist/js/bootstrap.js"]
  },
  {
    css: [],
    js: ["bower_components/bootbox.js/bootbox.js"]
  },
  {
    css: [],
    js: ["bower_components/async/dist/async.js"]
  },
  {
    css: [],
    js: ["bower_components/dexie/dist/latest/Dexie.js"]
  },
  {
    css: [],
    js: ["bower_components/moment/moment.js"]
  },
  {
    css: ["bower_components/pickadate/lib/thtmes/classic.css", "bower_components/pickadate/lib/thtmes/classic.date.css"],
    js: ["bower_components/pickadate/lib/picker.js", "bower_components/pickadate/lib/picker.date.js"]
  },
];
var pages = [
  "tometable"
];
//end config

var gulp = require("gulp"),
    concat = require("gulp-concat"),
    minifycss = require("gulp-minify-css"),
    autoprefixer = require("gulp-autoprefixer"),
    uglify = require("gulp-uglify"),
    inject = require("gulp-inject"),
    minifyHTML = require("gulp-minify-html"),
    merge = require("merge-stream"),
    declare = require("gulp-declare"),
    handlebars = require("gulp-handlebars"),
    wrap = require("gulp-wrap");

gulp.task("default", ["libraries", "pages", "other"]);
gulp.task("watch", ["libraries#watch", "pages#watch", "other#watch"]);

gulp.task("libraries", ["libraries:css", "libraries:js"]);
gulp.task("libraries#watch", ["libraries:css#watch", "libraries:js#watch"]);

  gulp.task("libraries:css", function(){
    cssfiles = [];
    for(var library in libraries){
      for(var cssfile in libraries[library].css){
        cssfiles.push(libraries[library].css[cssfile]);
      }
    }
    gulp.src(cssfiles)
    .pipe(autoprefixer())
    .pipe(minifycss())
    .pipe(concat("libs.css"))
    .pipe(gulp.dest("./frontend_build/css"));
  });

  gulp.task("libraries:js", function(){
    var jsfiles = [];
    for(var library in libraries){
      for(var jsfile in libraries[library].js){
        jsfiles.push(libraries[library].js[jsfile]);
      }
    }

    gulp.src(jsfiles)
    .pipe(concat("libs.js"))
    .pipe(uglify())
    .pipe(gulp.dest("./frontend_build/js"));
  });

gulp.task("pages", ["pages:css", "pages:js", "pages:html", "pages:templates"]);

  gulp.task("pages:css", function(){
    var cssfiles = [];
    for(var pageid in pages){
      cssfiles.push("./frontend/pages/" + pages[pageid] + "/*.css");
    }

    gulp.src(cssfiles)
    .pipe(autoprefixer())
    .pipe(minifycss())
    .pipe(concat("pages.css"))
    .pipe(gulp.dest("./frontend_build/css"));
  });

  gulp.task("pages:js", function(){
    var jsfiles = [];
    for(var pageid in pages){
      jsfiles.push("./frontend/pages/" + pages[pageid] + "/*.js");
    }

    gulp.src(jsfiles)
    .pipe(concat("pages.js"))
    .pipe(uglify())
    .pipe(gulp.dest("./frontend_build/js"));
  });

  gulp.task("pages:html", function(){
    var htmlfiles = [];
    for(var pageid in pages){
      htmlfiles.push("./frontend/pages/" + pages[pageid] + "/*.html");
    }

    gulp.src("./frontend/index.html")
    .pipe(inject(gulp.src(htmlfiles), {
      starttag: '<!-- inject:pages -->',
      transform: function(filePath, file){
        return file.contents.toString("utf8");
      }
    }))
    .pipe(minifyHTML())
    .pipe(gulp.dest("./frontend_build"));
  });
