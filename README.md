grunt-useref
============

## Description

Use build blocks to do three things:

1. update the references in your html from orginals to an optionally versioned, optimized file
2. perform file concatenation 
3. Perform file minification.

Utilize build blocks in your html to indicate the files to be concatenated and minified. This task will parse the build
blocks by updating the `<script>` and `<style>` blocks in your html, and it will schedule the concatenation and
minification of the desired files by dynamically updating the `concat`, `min`, and `cssmin` (part of `grunt-css` - this is
auto included as a dependency for `grunt-useref`) tasks.

**This tasks modifies files, so it should be executed on a temp directory or the final build directory.**

**This task relies on the concat, min, and cssmin tasks to be run after it... concat first.**

Inspiration (and large chunks of code) for `grunt-useref` was taken from the `usemin` tasks of
[H5BP](https://raw.github.com/h5bp/node-build-script/master/tasks/usemin.js) and
[Yeoman](https://raw.github.com/h5bp/node-build-script/master/tasks/usemin.js).

## Usage

To look at a working example see the [`grunt.js`](https://github.com/pajtai/grunt-useref/blob/master/grunt.js) of this module and look at [`test/input`](https://github.com/pajtai/grunt-useref/tree/master/test/input) of this module.

Example usage with grunt.init:

**in `grunt.js`:**

```javascript
    useref: {
        // specify which files contain the build blocks
        html: 'output/**/*.html',
        // explicitly specify the temp directory you are working in
        temp: 'output'
    }
```

Below are example corresponding build blocks in an example referenced html file. Multiple build blocks may be
used in a single file. The grunt templating engine can be used in the build file descriptions. The data passed to the
template processing is the entire config object.

**in an html file within the `output` directory**

```html
<!-- build:css /css/combined.css -->
<link href="/css/one.css" rel="stylesheet">
<link href="/css/two.css" rel="stylesheet">
<!-- endbuild -->

<!-- build:js scripts/combined.<%= pkg.version %>.concat.min.js -->
<script type="text/javascript" src="scripts/this.js"></script>
<script type="text/javascript" src="scripts/that.js"></script>
<!-- endbuild -->

<!-- build:js scripts/script1.<%= grunt.template.today('yyyy-mm-dd') %>.min.js -->
<script type="text/javascript" src="scripts/script1.js"></script>
<!-- endbuild -->
```

The example above has three build blocks on the same page. The first block concats and minifies. The second block minifies
one file. They both put the new scripts into a newly named file. The original JavaScript files remain untouched in this
case.

The above example assumes that your initConfig contains:

```javascript
    pkg: '<json:package.json>'
```

Assuming your `package.json.version` is `0.1.0` and it is October 31, 2012 running `grunt useref` would create the
following three files:

```bash
# concat and minified one.css + two.css
output/css/combined.css

# concat and minified this.js + that.js
output/scripts/combined.0.1.0.concat.min.js

# minified script1.js
output/scripts/script1.2012-10-31.min.js
```

Also the html in the file with the build blocks would be updated to:

```html
<link href="/css/combined.css" rel="stylesheet">

<script type="text/javascript" src="scripts/combined.0.1.0.concat.min.js"></script>

<script type="text/javascript" src="scripts/script1.2012-10-31.min.js"></script>
```

Finally, make sure to schedule `concat`, `min` and `cssmin` in your `grunt.js`. You must schedule these after `useref`.
You do not need to create `grunt.init` entries for them. If the build blocks do not create work for any one of these
tasks, you can leave that one out.

For example:

```javascript
grunt.registerTask('build', 'cp useref concat min cssmin');
```

Or, if you are do not have any css build blocks:

```javascript
grunt.registerTask('build', 'cp useref concat min');
```

## Installation and Use

To use this package put it as a dependency in your `package.json`, and then run `npm install`.

Then load the grunt task in your `grunt.js`

```javascript
grunt.loadNpmTasks('grunt-useref');
```

## Tests

Currently there are no autmated tests, but the `test` directory does have a working sample setup. To try out the sample
run it from the `grunt-useref` directory using:

```bash
npm install
npm test
```

You can inspect the sample output created. The tests can be run by either cloning the git repo or from this module's
directory inside the `node_modules` folder of your project.

## Change Log

* 0.0.7 - Nov 27, 2012 - fixed the css minification task so it does not have to be included in your grunt.js as a dependency
* 0.0.6 - Nov 26, 2012 - updated css minification task and its dependency

---

[NPM module](https://npmjs.org/package/grunt-useref)
