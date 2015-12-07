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
    css: [],
    js: ["bower_components/handlebars/handlebars.runtome.js"]
  },
  {
    css: ["bower_components/pickadate/lib/themes/classic.css", "bower_components/pickadate/lib/themes/classic.date.css"],
    js: ["bower_components/pickadate/lib/picker.js", "bower_components/pickadate/lib/picker.date.js"]
  },
  {
    css: [],
    js: ["bower_components/devbridge-autocomplete/dist/jquery.autocomplete.js"]
  },
  {
    css: [],
    js: ["bower_components/node-uuid/uuid.js"]
  },
  {
    css: ["bower_components/quill/dist/quill.snow.css"],
    js: ["bower_components/quill/dist/quill.min.js"]
  }
];
var pages = [
  "loading",
  "login",
  "main",
  "tometable"
];
//end config

var gulp = require("gulp"),
    watch = require("gulp-watch"),
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
    sourcemaps = require("gulp-sourcemaps");
    sass = require("gulp-sass");
    gulputil = require("gulp-util");
    path = require("path");
    swPrecache = require("sw-precache");

  gulp.task("libraries:css", function(){
    cssfiles = [];
    for(var library in libraries){
      for(var cssfile in libraries[library].css){
        cssfiles.push(libraries[library].css[cssfile]);
      }
    }
    return gulp.src(cssfiles)
    .pipe(sourcemaps.init())
    .pipe(autoprefixer())
    .pipe(concat("libs.css"))
    .pipe(minifycss())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("./frontend_build/css"));
  });

  gulp.task("libraries:js", function(){
    var jsfiles = [];
    for(var library in libraries){
      for(var jsfile in libraries[library].js){
        jsfiles.push(libraries[library].js[jsfile]);
      }
    }

    return gulp.src(jsfiles)
    .pipe(sourcemaps.init())
    .pipe(concat("libs.js"))
    .pipe(uglify().on("error", gulputil.log))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("./frontend_build/js"));
  });

gulp.task("libraries", gulp.parallel("libraries:css", "libraries:js"));

  gulp.task("pages:css", function(){
    var cssfiles = [];
    for(var pageid in pages){
      cssfiles.push("./frontend/pages/" + pages[pageid] + "/**/*.*css");
    }

    return gulp.src(cssfiles)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(concat("pages.css"))
    .pipe(minifycss())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("./frontend_build/css"));
  });

  gulp.task("pages:js", function(){
    var jsfiles = [];
    for(var pageid in pages){
      jsfiles.push("./frontend/pages/" + pages[pageid] + "/**/*.js");
    }

    return gulp.src(jsfiles)
    .pipe(sourcemaps.init())
    .pipe(concat("pages.js"))
    .pipe(uglify().on("error", gulputil.log))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("./frontend_build/js"));
  });

  gulp.task("pages:html", function(){
    var htmlfiles = [];
    for(var pageid in pages){
      htmlfiles.push("./frontend/pages/" + pages[pageid] + "/*.html");
    }

    return gulp.src("./frontend/index.html")
    .pipe(inject(gulp.src(htmlfiles), {
      starttag: '<!-- inject:pages -->',
      transform: function(filePath, file){
        return file.contents.toString("utf8");
      }
    }))
    .pipe(minifyHTML())
    .pipe(gulp.dest("./frontend_build"));
  });

  gulp.task("pages:templates", function(){
    var templates = [];
    var partials = [];
    for(var pageid in pages){
      templates.push("./frontend/pages/" + pages[pageid] + "/**/*.hbs");
      partials.push("./frontend/pages/" + pages[pageid] + "/**/partials/*.hbs");
    }

    return merge(
      gulp.src(templates, {base: "./frontend/pages/"})
      .pipe(handlebars({
        handlebars: require("handlebars")
      }))
      .pipe(wrap("Handlebars.template(<%= contents %>)"))
      .pipe(declare({
        namespace: "templates",
        noRedeclare: true,
        processName: function(filePath){return declare.processNameByPath(filePath.replace(path.join("frontend", "pages") + path.sep, "").replace("templates" + path.sep, ""))}
      })),
      gulp.src(partials, {base: "./frontend/pages/"})
      .pipe(handlebars({
        handlebars: require("handlebars")
      }))
      .pipe(wrap("Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));", {}, {
        imports: {
          processPartialName: function(fileName) {
            return JSON.stringify(fileName.replace(".js", "").replace("templates" + path.sep, "").replace("partials" + path.sep, "").replace(path.sep, "."));
          }
        }
      }))
    )
    .pipe(concat("templates.js"))
    .pipe(uglify().on("error", gulputil.log))
    .pipe(gulp.dest("./frontend_build/js"));
  });

gulp.task("pages", gulp.parallel("pages:css", "pages:js", "pages:html", "pages:templates"));
gulp.task("pages#watch", function(){
  gulp.watch("./frontend/pages/**/*.html", gulp.series("pages:html", "serviceworker"));
  gulp.watch("./frontend/index.html", gulp.series("pages:html", "serviceworker"));
  gulp.watch("./frontend/pages/**/*.hbs", gulp.series("pages:templates", "serviceworker"));
  gulp.watch("./frontend/pages/**/*.js", gulp.series("pages:js", "serviceworker"));
  gulp.watch("./frontend/pages/**/*.*css", gulp.series("pages:css", "serviceworker"));
});

  gulp.task("other:mainjs", function(){
    return gulp.src("./frontend/js/*.js")
    .pipe(sourcemaps.init())
    .pipe(concat("main.js"))
    .pipe(uglify().on("error", gulputil.log))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("./frontend_build/js"))
  });

  gulp.task("other:maincss", function(){
    return gulp.src("./frontend/css/*.*css")
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(concat("main.css"))
    .pipe(minifycss())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("./frontend_build/css"))
  });

  gulp.task("other:imgs", function(){
    return gulp.src("./frontend/imgs/*")
    .pipe(gulp.dest("./frontend_build/imgs"))
  });

  gulp.task("other:bsfonts", function(){
    return gulp.src("bower_components/bootstrap/dist/fonts/*")
    .pipe(gulp.dest("./frontend_build/fonts"))
  });

gulp.task("other", gulp.parallel("other:mainjs", "other:maincss", "other:imgs", "other:bsfonts"));
gulp.task("other#watch", function(){
  gulp.watch("./frontend/js/**", gulp.series("other:mainjs", "serviceworker"));
  gulp.watch("./frontend/css/**", gulp.series("other:maincss", "serviceworker"));
  gulp.watch("./frontend/imgs/**", gulp.series("other:imgs", "serviceworker"));
});

gulp.task("serviceworker", function(callback) {
  swPrecache.write("frontend_build/sw.js", {
    staticFileGlobs: ["frontend_build/**/*.{html,js,css,png,eot,svg,tff,woff,woff2}"],
    stripPrefix: "frontend_build"
  }, callback);
});


gulp.task("default", gulp.series(gulp.parallel("libraries", "pages", "other"), "serviceworker"));
gulp.task("watch", gulp.parallel("pages#watch", "other#watch"));
