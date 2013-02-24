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

            pkg: grunt.file.readJSON('package.json'),

            // Copy things to a temp dir, and only change things in the temp dir
            copy: {
                test: {
                    files: [
                        {expand: true, cwd: 'test/input/', src : ['**'], dest: 'test/output/' }
                    ]
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
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.loadTasks('./tasks/');

    grunt.registerTask('test', ['copy', 'useref', 'concat', 'uglify', 'cssmin']);
};