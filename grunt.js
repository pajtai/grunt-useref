/*global module:false */
// The line above is used for jshint plugins in your IDE

/**
 * This file is used when running npm test
 * @param grunt
 */
module.exports = function (grunt) {
    'use strict';

    var project = {

            dirs: {
                input     : 'test/input',
                output    : 'test/output',
                temp      : 'temp'
            },

            files: {
                scripts     : '/scripts',
                vendor      : '/scripts/vendor',
                any         : '/**/*',
                thisDir     : '/*',
                dot         : {
                    javascript  : '.js',
                    html        : '.html'
                }
            }
        },

        gruntConfig = {

            // allow grunt tasks easy access to the project object
            project: project,

            // Copy things to a temp dir, and only change things in the temp dir
            cp: {
                temp: {
                    src : project.dirs.input,
                    dest: project.dirs.temp
                },

                test: {
                    src : project.dirs.temp,
                    dest: project.dirs.output
                }
            },

            // For revisioning, we want to skip the "vendor" directory
            revPackage: {
                temp: project.dirs.temp + project.files.scripts + project.files.thisDir + project.files.dot.javascript
            },

            // Useref will got through all html files in temp
            useref: {
                html: project.dirs.temp + project.files.any + project.files.dot.html
            },

            min: {
                live: ''
            }
        };

    grunt.initConfig(gruntConfig);

    grunt.loadNpmTasks('grunt-cp');
    grunt.loadNpmTasks('grunt-rev-package');

    grunt.loadTasks('./tasks/');

    grunt.registerTask('build', 'cp:temp revPackage cp:test');
};