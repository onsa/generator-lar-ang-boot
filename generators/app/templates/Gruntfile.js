"use strict";

//  grunt is a module exporting a single function
module.exports = function (grunt) {

    //  shows detailed time information about tasks for optimizing build times
    require('time-grunt')(grunt);

    //  automatically load tasks upon encountering them in the config, so .loadNpmTasks() methods are no longer necessary
    require('jit-grunt')(grunt, {
        useminPrepare: 'grunt-usemin'                                       //  custom tasks must be given explicitly
    });

    //  configuration of all tasks
    grunt.initConfig({
		config: {                                                           //  define variables for later use
            src: 'public-src',
            dest: 'public'
		},
        jshint: {
            options: {
                jshintrc: '.jshintrc',                                      //  file containing rules to conform to
                reporter: require('jshint-stylish')                         //  optional module for reporting
            },
            all: {                                                          //  sub-task name (in this case there's just one, thence 'all')
                src: [                                                      //  array of source files to check
                    'Gruntfile.js',
                    '<%= config.src %>/js/{,*/}*.js'
                ]
            }
        },
		jscs: {
			options: {
				config: ".jscsrc"                                           //  file containing rules to conform to
			},
			src: "<%= config.src %>/js/{,*/}*.js"
		},
        clean: {                                                            //  deletes a folder to start new build
			options : {
				force: true
			},
            index: {
                src: ['<%= config.dest %>/views/index.php']
            },
            views:{                                                         //  sub-task name
                src: ['<%= config.dest %>/views/custom']                    //  source directory to be deleted
            },
            scripts: {
            	src: ['<%= config.dest %>/js/main.min.js']
            },
            style: {
            	src: ['<%= config.dest %>/css/main.min.css']
            }
        },
		sass: {                                                             //    sass compiler - automatically creates sourcemaps
			dist: {
				options: {
					style: 'compressed'
				},
				files: [{
					expand: true,
					cwd: '<%= config.src %>/styles',
					src: ['main.scss'],
					dest: '<%= config.dest %>/styles',
					ext: '.min.css'
				}]
			}
		},
        /*  
            prepare files between tags like
            <!-- build:js dist/app.min.js --> or <!-- build:css dist/style/css -->
                and
            <!-- endbuild -->
            for other tasks
            paths provided after build:[taksname] are used as relative paths for creating output files AND for replacing src attributes in the output template
        */
        useminPrepare: {
            php: '<%= config.src %>/index.php',                             //  source template with build comments
            options: {
                dest: '<%= config.dest %>'                                  //  destination folder to output processed assets - the source template must be copied separately (grunt-contribute-copy)
            }
        },
        concat: {                                                           //  concatenate files
            options: {
                separator: ';'
            }
            // concat configuration is provided by usemin-pepare
        },
        uglify: {
            // uglify configuration is provided by usemin-pepare
        },
        copy: {                                                             //  copy files to another location
            index: {
                cwd: '<%= config.src %>',
                src: ['index.php'],
                dest: '<%= config.dest %>/views',
                expand: true
            },
            views: {
                cwd: '<%= config.src %>/views',
                src: '**',
                dest: '<%= config.dest %>/views/custom',
                expand: true
            }
        },
        // change references for files prepared by usemin-pepare
        usemin: {
            php: '<%= config.dest %>/views/index.php'                       //  path where grunt-contrib-copy has copied template file - references within 
        },
        watch: {                                                            //  watch files for changes and run tasks
            copy: {
                files: [ '<%= config.src %>/*.html'],
                tasks: ['main']
            },
			views: {
                files: ['public-src/views/{,*/}*.html'],
                tasks:['main']
			},
            scripts: {                                                      //  sub-task name
                files: ['public-src/js/{,*/}*.js'],                         //  files watched
                tasks:['main']                        		                //  tasks to run
            },
            styles: {
                files: ['public-src/styles/*.scss', 'public-src/styles/*.css'],
                tasks:['main']
            }
        }
    });

    /**********************************************/

    //	define a list of tasks to be run
    grunt.registerTask('main', [
        'jshint',
        'jscs',
        'clean',
		'sass',
        'useminPrepare',
        'concat',
        'uglify',
        'copy',
        'usemin'
    ]);
	
	grunt.registerTask('ghost', [
		'main',
		'watch'
	]);

    //	define default tasks to be run when calling 'grunt'
    grunt.registerTask('default', [
        'main'
    ]);
};