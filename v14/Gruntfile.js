'use strict';

module.exports = function(grunt){
	grunt.initConfig({
	 	sass: {
	 		dist:{
	 			options: {
	 				style: 'expanded'
	 			},
	 			files: {
	 				'styles/stylesheets/main.css': 'styles/sass/main.sass'
	 			}
	 		}
	 	},
	 	watch: {
			css: {
				files: 'styles/sass/*.sass',
				tasks: ['sass']
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-serve');

	grunt.registerTask('default',['watch']);
	grunt.registerTask('default',['sass']);
};

