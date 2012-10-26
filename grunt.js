/*global module:false */
// The line above is used for jshint plugins in your IDE

module.exports = function (grunt) {
    'use strict';

    var project = {

            dirs: {
                app     : 'application',
                live    : 'targets/live',
                temp    : 'temp'
            },

            files: {
                scripts     : '/scripts',
                vendor      : '/scripts/vendor',
                any         : '/**/*',
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
                    src : project.dirs.app,
                    dest: project.dirs.temp
                }
            },

            revPackage: {
                temp: project.dirs.temp + project.files.scripts
            },

            useref: {
                html: project.dirs.temp + project.files.any + project.files.dot.html
            },

            min: {
                live: ''
            }
        };

    grunt.initConfig(gruntConfig);

    grunt.loadNpmTasks('grunt-cp');

    grunt.loadTasks('./tasks/');

    grunt.registerTask('build', 'cp:temp useref cp:live');
};