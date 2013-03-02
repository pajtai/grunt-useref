/*global module:false, require:false */
// From https://raw.github.com/yeoman/yeoman/master/cli/tasks/usemin.js
// which is rooted in: https://raw.github.com/h5bp/node-build-script/master/tasks/usemin.js
// Couldn't find the npm

module.exports = function (grunt) {
    'use strict';


    grunt.loadNpmTasks('grunt-useref/node_modules/grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-useref/node_modules/grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-useref/node_modules/grunt-css');


    // TODO: check that `temp` is defined before proceeding

    var fs = require('fs'),
        path = require('path'),


        // start build pattern: <!-- build:[target] output -->
        // $1 is the type, $2 is the file
        regbuild = /<!--\s*build:(\w+)\s*(.+)\s*-->/,

        // end build pattern -- <!-- endbuild -->
        regend = /<!--\s*endbuild\s*-->/;


    //
    // Returns a hash object of all the directives for the given html. Results is
    // of the following form:
    //
    //     {
    //        'css/site.css ':[
    //          '  <!-- build:css css/site.css -->',
    //          '  <link rel="stylesheet" href="css/style.css">',
    //          '  <!-- endbuild -->'
    //        ],
    //        'js/head.js ': [
    //          '  <!-- build:js js/head.js -->',
    //          '  <script src="js/libs/modernizr-2.5.3.min.js"></script>',
    //          '  <!-- endbuild -->'
    //        ],
    //        'js/site.js ': [
    //          '  <!-- build:js js/site.js -->',
    //          '  <script src="js/plugins.js"></script>',
    //          '  <script src="js/script.js"></script>',
    //          '  <!-- endbuild -->'
    //        ]
    //     }
    //
    function getBlocks(body) {
        'use strict';

        var lines = body.replace(/\r\n/g, '\n').split(/\n/),
            block = false,
            sections = {},
            last;

        lines.forEach(function (l) {
            var build = l.match(regbuild),
                endbuild = regend.test(l);

            if (build) {
                block = true;
                // Run the build block file through the template engine
                sections[[build[1], grunt.template.process(build[2].trim())].join(':')] = last = [];
            }

            // switch back block flag when endbuild
            if (block && endbuild) {
                last.push(l);
                block = false;
            }

            if (block && last) {
                last.push(l);
            }
        });

        // sections is an array of lines starting with the build block comment opener,
        // including all the references and including the build block comment closer.
        return sections;
    }

    function updateReferences(blocks, content) {

        // Determine the linefeed from the content
        var linefeed = /\r\n/g.test(content) ? '\r\n' : '\n';

        // handle blocks
        Object.keys(blocks).forEach(function (key) {
            var block = blocks[key].join(linefeed),
                parts = key.split(':'),
                type = parts[0],
                target = parts[1];

            content = helpers.useref(content, block, target, type);
        });

        return content;
    }

    function compactContent(blocks) {

        // concat / uglify / css / rjs config
        var concat = grunt.config('concat') || {},
            uglify = grunt.config('uglify') || {},
            css = grunt.config('cssmin') || {},
            temp = grunt.config('useref.temp');

        // make certain to have a traling slash
        if (temp[-1] !== '/') {
            temp += '/';
        }

        grunt.log.subhead('Running compactContent');

         Object.keys(blocks).forEach(function (dest) {
                 // Lines are the included scripts w/o the use blocks
             var lines = blocks[dest].slice(1, -1),
                 parts = dest.split(':'),
                 type = parts[0],
                 // output is the useref block file
                 output = parts[1];

             // Handle absolute path (i.e. with respect to th eserver root)
             if (output[0] === '/') {
                output = output.substr(1);
             }

             output = temp + output;

             grunt.log.subhead("assets are: ");
             // parse out the list of assets to handle, and update the grunt config accordingly
             var assets = lines.map(function (tag) {

                 // The asset is the string of the referenced source file
                 var asset = (tag.match(/(href|src)=["']([^'"]+)["']/) || [])[2];

                 // Allow white space and comment in build blocks by checking if this line has an asset or not
                 if (asset) {
                     grunt.log.writeln(asset);
                     // remove leading slashing, since we know we have a trailing slash in temp
                     if (asset[0] === '/') {
                         asset = asset.substr(1);
                     }
                     return temp + asset;
                 }
             }).reduce(function (a, b) {
                     b = ( b ? b.split(',') : '');
                     return b ? a.concat(b) : a;
                 }, []);

             grunt.log.writeln("\n");
             // update concat config for this block
             concat[output] = assets;
             grunt.config('concat', concat);

             // uglify config, only for js type block
             if (type === 'js') {
                uglify[output] = output;
                grunt.config('uglify', uglify);
             }

             // css config, only for css type block
             if (type === 'css') {
                css[output] = output;
                grunt.config('cssmin', css);
             }
         });

         // log a bit what was added to config
         grunt.verbose.subhead('Configuration is now:')
         .subhead('  cssmin:')
         .writeln('  ' + JSON.stringify(grunt.config.get('cssmin')))
         .subhead('  concat:')
         .writeln('  ' + JSON.stringify(grunt.config.get('concat')))
         .subhead('  uglify:')
         .writeln('  ' + JSON.stringify(grunt.config.get('uglify')));

    }

    grunt.registerMultiTask('useref', 'Replaces references to non-minified scripts / stylesheets', function () {

        // Assumption is that we are now in a temp directory, so act accordingly

        var name = this.target, data, files;

        grunt.log.subhead("beginning useref " + name);

        // temp target is for data storag and is not actionable
        if ('temp' === name) {
            return;
        }

        data = this.data;
        files = grunt.file.expand(data);

        // After this the file references will be updated
        files.map(grunt.file.read).forEach(function (content, i) {
            var theFile = files[i];

            grunt.log.subhead('useref_' + name + ' - ' + theFile);

            // make sure to convert back into utf8, `file.read` when used as a
            // forEach handler will take additional arguments, and thus trigger the
            // raw buffer read
            content = content.toString();

            // ext-specific directives handling and replacement of blocks
            // First check if the helper exists
            content = helpers['useref_pre_' + name](content);

            // actual replacement of revved assets
            content = helpers['useref_post_' + name](content);

            // write the new content to disk
            grunt.file.write(theFile, content);
        });

        grunt.log.subhead("ending useref " + name);
    });

    // Helpers
    // -------
    var helpers = {
        // useref:pre:* are used to preprocess files with the blocks and directives
        // before going through the global replace
        useref_pre_html : function (content) {

            // XXX extension-specific for get blocks too.
            //
            // Eg. for each predefined extensions directives may vary. eg <!--
            // directive --> for html, /** directive **/ for css
            var blocks = getBlocks(content);

            content = updateReferences(blocks, content);

            compactContent(blocks);

            return content;
        },

        // useref and useref:* are used with the blocks parsed from directives
        useref : function (content, block, target, type) {
            target = target || 'replace';

            return helpers['useref_' + type](content, block, target);
        },

        useref_css : function (content, block, target) {
            var linefeed = /\r\n/g.test(content) ? '\r\n' : '\n';
            var indent = (block.split(linefeed)[0].match(/^\s*/) || [])[0];
            return content.replace(block, indent + '<link rel="stylesheet" href="' + target + '"\/>');
        },

        useref_js : function (content, block, target) {
            var linefeed = /\r\n/g.test(content) ? '\r\n' : '\n';
            var indent = (block.split(linefeed)[0].match(/^\s*/) || [])[0];
            return content.replace(block, indent + '<script src="' + target + '"></script>');
        },

        // useref:post:* are the global replace handlers, they delegate the regexp
        // replace to the replace helper.
        // TODO: this can be removed
        useref_post_html : function (content) {

            content = helpers.replaceCustom(content, /<script.+src=['"](.+)["'][\/>]?><[\\]?\/script>/gm);

            content = helpers.replaceCustom(content, /<link[^\>]+href=['"]([^"']+)["']/gm);

            return content;
        },

        //
        // global replace handler, takes a file content a regexp to macth with. The
        // regexp should capture the assets relative filepath, it is then compared to
        // the list of files on the filesystem to guess the actual revision of a file
        //
        // TODO: may not be needed in full
        replaceCustom : function (content, regexp) {

            return content.replace(regexp, function (match, src) {
                var basename, dirname, filepaths, filepath, filename, res;

                //do not touch external files or the root
                if (src.match(/\/\//) || src.match(/^\/$/)) {
                    return match;
                }

                // Consider reference from site root
                if (src.match(/^\//)) {
                    src = src.substr(1);
                }

                basename = path.basename(src);
                dirname = path.dirname(src);

                // XXX files won't change, the filepath should filter the original list
                // of cached files (we need to treat the filename collision -- i.e. 2 files with same names
                // in different subdirectories)
                filepaths = grunt.file.expand(path.join('**/*') + basename);
                filepath = filepaths.filter(function (f) {
                    return dirname === path.dirname(f);
                })[0];

                // not a file in temp, skip it
                if (!filepath) {
                    return match;
                }

                filename = path.basename(filepath);
                // handle the relative prefix (with always unix like path even on win32)
                filename = [dirname, filename].join('/');

                // if file not exists probaly was concatenated into another file so skip it
                if (!filename) {
                    return '';
                }

                res = match.replace(src, filename);
                // output some verbose info on what get replaced
                grunt.log.ok(src).writeln('was ' + match).writeln('now ' + res);

                return res;
            });
        }
    };
   
};
