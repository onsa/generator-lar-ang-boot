'use strict';

angular.module('<%= appName %>App', ['ngRoute'])
	.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
		$locationProvider.html5Mode(true);

		$routeProvider
			.when('/', {								//	main page
				templateUrl: 'views/custom/main.html'
			})
			.otherwise({
				redirectTo: '/'
			});
	}]);