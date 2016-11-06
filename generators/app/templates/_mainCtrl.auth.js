'use strict';

angular.module('<%= appName %>App')
	.controller('mainCtrl', ['$scope', '$http', function($scope, $http) {

		$scope.logout = function() {
			$http.post('logout')
				.then(
					function() {
						<%= logout %>
					});
		};

	}]);