"use strict";

var gulp = require("gulp"),
    $ = require("gulp-load-plugins")(), // import a function so make sure we execute it and gulp plugins loads all the plugins that start with "gulp-" and stack them in $
    source = require("vinyl-source-stream"),
    browserify = require("browserify"),
    watchify = require("watchify"),
    babelify = require("babelify"),
    path = require("path"),
    fs = require("fs");


// build server task

gulp.task("scripts:server", () => {
   return gulp.src("./src-server/**/*.js")
   .pipe($.cached("server"))
   .pipe($.babel())
   .pipe(gulp.dest("./build"));
});

// gulp.task("watch:scripts:server", () => {
//    return gulp.watch("./src-server/**/*.js", gulp.series("scripts:server"));
// });

gulp.task("watch:scripts:server", gulp.series(
    "scripts:server", () => {
        return gulp.watch("./src-server/**/*.js", gulp.series("scripts:server"));
    }
))


gulp.task("watch:scripts:client", () => {
    // WE NEED 
    // fs = require("fs");

    
    // looks into our src-client folder finds all the files 
    // and initialize a watch on each of those files 

    const files = fs.readdirSync("./src-client");
    for (let i = 0; i< files.length; i++) {
      const file = files[i];
      if (path.extname(file) != '.js'){
        continue;
      }
    
      initBundlerWatch(path.join("src-client", file));

    }

    // then I want to watch for any new file.
    return gulp.watch("./src-client/**/*.js")
          .on("change", initBundlerWatch);
}); 



gulp.task("watch:scripts", gulp.parallel(
  "watch:scripts:client",
  "watch:scripts:server"));


let bundlers = {};

function initBundlerWatch(file){
    if(bundlers.hasOwnProperty(file))
    {
        return;
    }

    const bundler = createBundle(file);

    bundlers[file] = bundler;

    const watcher = watchify(bundler);
    const filename = path.basename(file);

    
    // This function instructs the bundler which is an instance of browserify 
    // to bundle all of the modules we imported into this transformation into this one object (bundler)// // pipe it into into vinyl source stream with the source 
    // of the given the name (filename) because browserify doesn't create files
    // with names AND IN ORDER TO WORK WITH GULP needs a name 
    // and that's what vinyl source stream does and we pipe it to public/build as the 
    // output.

    function bundle(){
      return bundler 
        .bundle()
        .on("error", error => console.log(error))
        .pipe(source(filename))
        .pipe(gulp.dest("./public/build"));
    }

    // we need to hook into the watchify events
    // which will notify us when the file changes
    // and we need to do a RE BUNDLE. 

    // we are saying watchify whenever you see a 
    // file change go ahead and RE BUNDLE IT.

    watcher.on("update", bundle);
    // the following will notify us when the 
    // build actually happens.
    watcher.on("time", time => console.log(`Built client in ${time}ms`));


    bundle();
}

// Takes a file and instructs browserify
// to use that file to compile it.
// we can't use babelify because it won't
// give us any module loading. 
// browserify pulls in the modules we import.

function createBundle(file) {
    const bundler = browserify(file);
    bundler.transform(babelify);
    return bundler;
}