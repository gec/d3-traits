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
      files: ['src/<%= pkg.name %>.js', 'test/*.spec.js'],
      tasks: ['jshint', 'concat', 'karma:continuous', 'uglify']
    },

    karma: {
      options: testConfig('karma.conf.js'),

      continuous: {
        singleRun: true,
        autoWatch: false,
        browsers: ['PhantomJS']
      },

      unit: {
        singleRun: true,
        autoWatch: false,
        coverageReporter: {
          type : 'html',
          dir : 'coverage/'
        },
        browsers: ['PhantomJS']
      }
    },

    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      js: {
        src: ['src/<%= pkg.name %>.js', 'src/*/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      },
      css: {
        src: ['src/<%= pkg.name %>.css'],
        dest: 'dist/<%= pkg.name %>.css'
      },
      test: {
        src: ['test/spec.prefix', 'test/*.spec.js' ,'test/spec.suffix'],
        dest: 'dist/<%= pkg.name %>.spec.js'
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
    }
  });

  // Default task.
  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'karma:continuous']);

  grunt.registerTask('fast-build', ['concat', 'uglify']);
  grunt.registerTask('coverage', ['concat', 'karma:unit']);
};
