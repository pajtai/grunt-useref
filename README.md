grunt-useref
============

## Description

Use build blocks to simply update the references in your html and perform file concatenation and minification. The build
block file names are run through the grunt templating engine.

Utilize build blocks in your html to indicate the files to be concatenated and minified. This task will parse the build
blocks by updating the `<script>` and `<style>` blocks in your html, and it will schedule the concatenation and
minification of the desired files by modifying the `concat`, `min`, and `css` tasks.

**This tasks modifies files, so it should be executed on a temp directory on final build directory.**

**This task relies on the built in concat, min, and css tasks to be run after it... concat first**

Inspiration (and large chunks of code) for `grunt-useref` was taken from the `usemin` tasks of
[H5BP](https://raw.github.com/h5bp/node-build-script/master/tasks/usemin.js) and
[Yeoman](https://raw.github.com/h5bp/node-build-script/master/tasks/usemin.js).

## Usage

To look at a working example see the `grunt.js` of this module and look at `test/input` of this module. See the testing
section to see how to run these.

Example usage with grunt.init:

```javascript
    useref: {
        // specify which files contain the build blocks
        html: 'output/**/*.html',
        // explicitly specify the temp directory you are working in
        temp: 'output'
    }
```

Corresponding example build blocks in the referenced html files. Multiple build blocks may be used in a single file.
The grunt templating engine can be used in the build file descriptions. The data passed to the template processing is
the entire config object.

```html
        <!-- build:js scripts/combined.<%= pkg.version %>.concat.min.js -->
        <script type="text/javascript" src="scripts/this.js"></script>
        <script type="text/javascript" src="scripts/that.js"></script>
        <!-- endbuild -->

        <!-- build:js scripts/script1.<%= grunt.template.today('yyyy-mm-dd') %>.min.js -->
        <script type="text/javascript" src="scripts/script1.js"></script>
        <!-- endbuild -->
```

The example above has two build blocks on the same page. The first block concats and minifies. The second block minifies
one file. They both put the new scripts into a newly named file. The original JavaScript files remain untouched in this
case.

The above example assumes that your initConfig contains:

```javascript
    pkg: '<json:package.json>'
```

Finally, make sure to schedule `concat`, `min` and `css` in your `grunt.js`. You must schedule these after `useref`.
You do not need to create `grunt.init` entries for them. If the build blocks do not create work for any one of these
tasks, you can leave that one out.

For example:

```javascript
grunt.registerTask('build', 'cp useref concat min css');
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
