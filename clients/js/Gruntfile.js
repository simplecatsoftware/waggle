/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        jshint: {
            application: {
                src: ['src/**.js']
            }
        },
        jsdoc: {
            dist : {
                src: ['src/*.js', './README.md'],
                options: {
                    destination: 'docs'
                }
            }
        },
        watch: {
            src: {
                files: ['src/**.js'],
                tasks: ['jshint', 'jsdoc']
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsdoc');

    // Register Default Task
    grunt.registerTask('default', ['jshint']);

    // Register Build tasks
    grunt.registerTask('build', ['build:clients']);
    grunt.registerTask('build:clients', ['build:clients:js']);

    // Build documentation
    grunt.registerTask('docs', ['jsdoc']);

};
