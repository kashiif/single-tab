"use strict;"
module.exports = function (grunt) {
    var distDir = "dist/"
        tempDir = distDir + "temp/",
        pkg = grunt.file.readJSON('package.json'),
        version = pkg.version,
        versionToken = version.replace(/\./g, '_');
        
    // Project configuration.
    grunt.initConfig({
        /* Copy all files to destination folder */    
        copy: {
            prod: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.*', '!**/*.txt', '!**/*@*.com', '!**/*sublime*.*'],
                    dest: tempDir
                }, {
                    expand: true,
                    cwd: tempDir + 'chrome/skin/',
                    src: ['*icon64.png'],
                    dest: tempDir
                }]
            }
        },
        "regex-replace": {
            prod: {
                src: [tempDir + '**/*.*'],
                actions: [{
                    search: '__version__',
                    replace: versionToken
                }, {
                    search: '_version_',
                    replace: version
                }]
            }            
        },
        // generate zip file and use custom extension for the output file
        compress: {
          main: {
            options: {
              archive: distDir + pkg.name + '-' + version + '.xpi',
              mode: 'zip'
            },
            files: [
              { expand:true, cwd: tempDir, src: [ '**']}, // includes files and subfolders in 'tempDir' 
            ]
          }
        }        
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-regex-replace');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('renameVersionDir', 'renames the __version__ directory', function() {
        var fs    = require('fs'),
            path  = require('path');

        var oldName = path.resolve(tempDir, '__version__'),
              newName = path.resolve(tempDir, versionToken);
          fs.renameSync(oldName, newName);
      });

    // Default task(s).
    grunt.registerTask('default', ['copy', 'regex-replace', 'renameVersionDir', 'compress']);
};