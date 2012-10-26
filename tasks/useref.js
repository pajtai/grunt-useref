/*global module:false, require:false */
// From https://raw.github.com/yeoman/yeoman/master/cli/tasks/usemin.js
// which is rooted in: https://raw.github.com/h5bp/node-build-script/master/tasks/usemin.js
// Couldn't find the npm

module.exports = function (grunt) {
    'use strict';

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
                sections[[build[1], build[2].trim()].join(':')] = last = [];
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

        return sections;
    }

    grunt.registerMultiTask('useref', 'Replaces references to non-minified scripts / stylesheets', function () {

        // TODO: kick off usemin-handler and add packaga.json rev
        // Assumption is that we are now in a temp directory, so act accordingly

        var name = this.target,
            data = this.data,
            files = grunt.file.expand(data);

        files.map(grunt.file.read).forEach(function (content, i) {
            var p = files[i];

            grunt.log.subhead('usemin:' + name + ' - ' + p);

            // make sure to convert back into utf8, `file.read` when used as a
            // forEach handler will take additional arguments, and thus trigger the
            // raw buffer read
            content = content.toString();

            // ext-specific directives handling and replacement of blocks
            if (!!grunt.task._helpers['usemin:pre:' + name]) {
                content = grunt.helper('usemin:pre:' + name, content);
            }

            // actual replacement of revved assets
            if (!!grunt.task._helpers['usemin:post:' + name]) {
                content = grunt.helper('usemin:post:' + name, content);
            }

            // write the new content to disk
            grunt.file.write(p, content);
        });

    });

    // TODO - combine this with regular usemin
    grunt.registerMultiTask('usemin-handler', 'Using HTML markup as the primary source of information', function () {

        // collect files
        var files = grunt.file.expandFiles(this.data);

        // concat / min / css / rjs config
        var concat = grunt.config('concat') || {},
            min = grunt.config('min') || {},
            css = grunt.config('css') || {};

        grunt.log
            .writeln('Going through ' + grunt.log.wordlist(files) + ' to update the config')
            .writeln('looking for build script HTML comment blocks');

        files = files.map(function (filepath) {
            return {
                path:filepath,
                body:grunt.file.read(filepath)
            };
        });

        files.forEach(function (file) {
            var blocks = getBlocks(file.body);
            Object.keys(blocks).forEach(function (dest) {
                var lines = blocks[dest].slice(1, -1),
                    parts = dest.split(':'),
                    type = parts[0],
                    output = parts[1];

                // Handle absolute path (i.e. with respect to th eserver root)
                if (output[0] === '/') {
                    output = output.substr(1);
                }

                // parse out the list of assets to handle, and update the grunt config accordingly
                var assets = lines.map(function (tag) {

                    var asset = (tag.match(/(href|src)=["']([^'"]+)["']/) || [])[2];

                    return asset;
                }).reduce(function (a, b) {
                        b = ( b ? b.split(',') : '');
                        return a.concat(b);
                    }, []);

                grunt.log.subhead('Found a block:')
                    .writeln(grunt.log.wordlist(lines, { separator:'\n' }))
                    .writeln('Updating config with the following assets:')
                    .writeln('    - ' + grunt.log.wordlist(assets, { separator:'\n    - ' }));

                // update concat config for this block
                concat[output] = assets;
                grunt.config('concat', concat);

                grunt.log.writeln("**** output is: " + JSON.stringify(output));
                // min config, only for js type block
                if (type === 'js') {
                    min[output] = output;
                    grunt.config('min', min);
                }

                // css config, only for css type block
                if (type === 'css') {
                    css[output] = output;
                    grunt.config('css', css);
                }
            });
        });

        // log a bit what was added to config
        grunt.log.subhead('Configuration is now:')
            .subhead('  css:')
            .writeln('  ' + grunt.helper('inspect', css))
            .subhead('  concat:')
            .writeln('  ' + grunt.helper('inspect', concat))
            .subhead('  min:')
            .writeln('  ' + grunt.helper('inspect', min))
            .subhead('  rjs:')
            .writeln('  ' + grunt.helper('inspect', rjs));

    });

    // Helpers
    // -------

    // usemin:pre:* are used to preprocess files with the blocks and directives
    // before going through the global replace
    grunt.registerHelper('usemin:pre:html', function (content) {

        // XXX extension-specific for get blocks too.
        //
        // Eg. for each predefined extensions directives may vary. eg <!--
        // directive --> for html, /** directive **/ for css
        var blocks = getBlocks(content),

        // Determine the linefeed from the content
            linefeed = /\r\n/g.test(content) ? '\r\n' : '\n';

        // handle blocks
        Object.keys(blocks).forEach(function (key) {
            var block = blocks[key].join(linefeed),
                parts = key.split(':'),
                type = parts[0],
                target = parts[1];

            content = grunt.helper('usemin', content, block, target, type);
        });

        return content;
    });

    // usemin and usemin:* are used with the blocks parsed from directives
    grunt.registerHelper('usemin', function (content, block, target, type) {
        target = target || 'replace';
        return grunt.helper('usemin:' + type, content, block, target);
    });

    grunt.registerHelper('usemin:css', function (content, block, target) {
        var linefeed = /\r\n/g.test(content) ? '\r\n' : '\n';
        var indent = (block.split(linefeed)[0].match(/^\s*/) || [])[0];
        return content.replace(block, indent + '<link rel="stylesheet" href="' + target + '"\/>');
    });

    grunt.registerHelper('usemin:js', function (content, block, target) {
        var linefeed = /\r\n/g.test(content) ? '\r\n' : '\n';
        var indent = (block.split(linefeed)[0].match(/^\s*/) || [])[0];
        return content.replace(block, indent + '<script src="' + target + '"></script>');
    });

    // usemin:post:* are the global replace handlers, they delegate the regexp
    // replace to the replace helper.
    grunt.registerHelper('usemin:post:html', function (content) {

        grunt.log.verbose.writeln('Update the HTML to reference our concat/min/revved script files');
        content = grunt.helper('replace', content, /<script.+src=['"](.+)["'][\/>]?><[\\]?\/script>/gm);

        grunt.log.verbose.writeln('Update the HTML with the new css filenames');
        content = grunt.helper('replace', content, /<link[^\>]+href=['"]([^"']+)["']/gm);

        return content;
    });

    //
    // global replace handler, takes a file content a regexp to macth with. The
    // regexp should capture the assets relative filepath, it is then compared to
    // the list of files on the filesystem to guess the actual revision of a file
    //
    grunt.registerHelper('replace', function (content, regexp) {

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
    });
};
