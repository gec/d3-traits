/*global module:false, require:false*/
module.exports = function(grunt) {
  'use strict';

  // Load Deps
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Travis doesn't have chrome, so we need to overwrite some options
  var testConfig = function(configFile, customOptions) {
    var options = { configFile: configFile, keepalive: true };
    var travisOptions = process.env.TRAVIS && { browsers: ['Firefox'], reporters: 'dots' };
    return grunt.util._.extend(options, customOptions, travisOptions);
  };

  var srcFiles = [
    'src/<%= pkg.name %>.js',
    'src/core/utils.js',
    'src/core/*.js',
    'src/*/utils.js',
    'src/*/*.js'
  ]

  grunt.loadNpmTasks('grunt-contrib-watch');

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> d3-traits;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',

    watch: {
      files: srcFiles.concat(['test/*/*.js']),
      tasks: ['jshint', 'concat', 'karma:continuous', 'uglify']
    },

    karma: {
      options: testConfig('karma.conf.js'),

      continuous: {
        singleRun: false,
        autoWatch: true,
        plugins: [
          'karma-jasmine',
          'karma-coverage',
          'karma-phantomjs-launcher', // finally recognized phantomjs!
          'karma-chrome-launcher',
          'karma-firefox-launcher'
        ],
        reporters: ['progress', 'coverage'],
        preprocessors: {
          // source files, that you wanna generate coverage for
          // do not include tests or libraries
          // (these files will be instrumented by Istanbul)
          //
          // For debug, comment this out!
//          'src/**/*.js': ['coverage']
        },
        coverageReporter: {
          reporters: [
            {type : 'text'},
            {type: 'html', dir: 'coverage/'}
          ]
        },
        //browsers: ['PhantomJS']
        browsers: ['Chrome']
      },

      unit: {
        singleRun: true,
        autoWatch: false,
        plugins: [
          'karma-jasmine',
          'karma-coverage',
          'karma-phantomjs-launcher',
          'karma-chrome-launcher',
          'karma-firefox-launcher'
        ],
        reporters: ['progress', 'coverage'],
        preprocessors: {
          // source files, that you wanna generate coverage for
          // do not include tests or libraries
          // (these files will be instrumented by Istanbul)
          //
          // For debug, comment this out!
          'src/**/*.js': ['coverage']
        },
        coverageReporter: {
          reporters: [
            {type : 'text'}//,
//            {type: 'html', dir: 'coverage/'}
          ]
        },
        browsers: ['Chrome']
        //browsers: ['PhantomJS']
      }
    },

    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      js: {
        src: srcFiles,
        dest: 'dist/<%= pkg.name %>.js'
      },
      css: {
        src: ['src/<%= pkg.name %>.css'],
        dest: 'dist/<%= pkg.name %>.css'
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      js: {
        src: '<%= concat.js.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      test: {
        src: ['src/**/*.js']
      }
    },

    clean: ["dist"]
  });

  // Default task.
  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'karma:unit']);
  grunt.registerTask('test', ['jshint', 'karma:continuous']);

  grunt.registerTask('fast-build', ['concat', 'uglify']);
  grunt.registerTask('coverage', ['concat', 'karma:unit']);
};
