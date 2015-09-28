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

gulp.task("default", ["libraries", "pages", "other"]);
gulp.task("watch", ["pages#watch", "other#watch"]);

gulp.task("libraries", ["libraries:css", "libraries:js"]);

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
gulp.task("pages#watch", function(){
  gulp.watch("./frontend/pages/**/*.html", ["pages:html"]);
  gulp.watch("./frontend/pages/**/*.hbs", ["pages:templates"]);
  gulp.watch("./frontend/pages/**/*.js", ["pages:js"]);
  gulp.watch("./frontend/pages/**/*.*css", ["pages:css"]);
})

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

  gulp.task("pages:templates", function(){
    var templates = [];
    var partials = [];
    for(var pageid in pages){
      templates.push("./frontend/pages/" + pages[pageid] + "/[^_]*.hbs");
      partials.push("./frontend/pages/" + pages[pageid] + "/_*.hbs");
    }

    merge(
      gulp.src(templates, {base: "./frontend/pages/"})
      .pipe(handlebars({
        handlebars: require("handlebars")
      }))
      .pipe(wrap("Handlebars.template(<%= contents %>)"))
      .pipe(declare({
        namespace: "templates",
        noRedeclare: true,
        processName: function(filePath){return declare.processNameByPath(filePath.replace("frontend\\pages\\", ""))}
      })),
      gulp.src(partials)
      .pipe(handlebars({
        handlebars: require("handlebars")
      }))
      .pipe(wrap("Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));", {}, {
        imports: {
          processPartialName: function(fileName) {
            return JSON.stringify(fileName.replace(".js", "").substr(1));
          }
        }
      }))
    )
    .pipe(concat("templates.js"))
    .pipe(gulp.dest("./frontend_build/js"));
  });

gulp.task("other", ["other:mainjs", "other:maincss", "other:imgs"]);

  gulp.task("other:mainjs", function(){
    gulp.src("./frontend/js/*.js")
    .pipe(uglify())
    .pipe(concat("main.js"))
    .pipe(gulp.dest("./frontend_build/js"))
  });

  gulp.task("other:maincss", function(){
    gulp.src("./frontend/css/*.css")
    .pipe(autoprefixer())
    .pipe(minifycss())
    .pipe(concat("main.css"))
    .pipe(gulp.dest("./frontend_build/css"))
  });

  gulp.task("other:imgs", function(){
    gulp.src("./frontend/imgs/*")
    .pipe(gulp.dest("./frontend_build/imgs"))
  });
