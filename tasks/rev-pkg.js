/*global module:false, require:false */

module.exports = function (grunt) {
    'use strict';

    var fs = require('fs'),
        path = require('path'),
        crypto = require('crypto');

    // rev task - suggested use is in a temp directory
    grunt.registerMultiTask('revPackage', 'Automate the renaming of files to include the package.json revision',
        function () {
            var files = this.data;

            grunt.file.expandFiles(files).forEach(function (oneFile) {
                var pkg = grunt.task.directive('<json:package.json>'),
                    ver = pkg.version,
                    renamed = [ver, path.basename(oneFile)].join('.');

                // create the new file
                fs.renameSync(oneFile, path.resolve(path.dirname(oneFile), renamed));
                grunt.log.write(oneFile + ' ').ok(renamed);
            });
        });
};



