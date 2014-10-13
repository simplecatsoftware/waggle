/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        // Task configuration.
        jshint: {
            options: {
                curly: false,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                boss: true,
                eqnull: true,
                esnext: true,
                globals: {
                    require: true,
                    module: true,
                    console: true,
                    process: true,
                    __dirname: true
                }
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            lib_test: {
                src: ['lib/**/*.js', 'test/**/*.js', 'main.js']
            }
        },
        jsdoc: {
            dist : {
                src: ['lib/*.js', './main.js', './README.md'],
                options: {
                    destination: 'doc'
                }
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsdoc');

    grunt.registerTask('default', ['jshint']);
    grunt.registerTask('docs', ['jsdoc']);

};
