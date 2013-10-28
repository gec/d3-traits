// Karma configuration
// Generated on Mon May 06 2013 08:16:19 GMT+0200 (CEST)

module.exports = function(config) {
    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: '',

        preprocessors: {
          'dist/d3-traits.js': 'coverage'
        },

        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
          'bower_components/d3/d3.js',
          'test/lib/jquery-2.0.3.min.js',  // jasmine-fixture needs this
          //'http://code.jquery.com/jquery-2.0.3.min.js',  // jasmine-fixture needs this
          'test/lib/jasmine-fixture.js', // https://github.com/searls/jasmine-fixture
          //'dist/d3-traits.js',

          // Use the actual source files for testing.
          'src/d3-traits.js',
          'src/layout.js',
          'src/*/*.js',

          'test/jasmine-matchers.js',
          'test/**/*.spec.js'
        ],


        // list of files to exclude
        exclude: [],

        plugins: [
            'karma-jasmine',
            'karma-coverage',
            'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-firefox-launcher'
        ],

        coverageReporter: {
            type : 'text-summary',
            dir : 'coverage/'
        },

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit'
        reporters: ['dots', 'coverage'],

        // web server port
        port: 9876,

        // cli runner port
        runnerPort: 9100,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: 'LOG_INFO',

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        // browsers: ['PhantomJS'],
        browsers: ['PhantomJS']//, 'Firefox']
        //browsers: ['Chrome']
    })
}





