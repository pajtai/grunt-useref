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

            pkg: '<json:package.json>',

            // Copy things to a temp dir, and only change things in the temp dir
            cp: {
                test: {
                    src : project.dirs.input,
                    dest: project.dirs.output
                }
            },

            // Useref will got through all html files in output
            useref: {

                    html: project.dirs.output + project.files.any + project.files.dot.html,

                    temp: project.dirs.output

            }

        };

    grunt.initConfig(gruntConfig);

    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-cp');
    grunt.loadNpmTasks('grunt-css');

    grunt.loadTasks('./tasks/');

    grunt.registerTask('test', 'cp useref concat min cssmin');
};