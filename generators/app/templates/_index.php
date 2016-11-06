<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title><%= AppName %></title>
		<!-- 
				this path is relative to server root 
				it ends in a trailing slash for further relative paths!
				make it match with the apache2 alias (if any), otherwise app will be redirected instead of aliased
		-->
		<base href="/<%= appName %>/">
		<link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css">
		<link rel="stylesheet" href="styles/main.min.css">
		<link href="images/favicon.ico" rel="icon">
		<script src="node_modules/bootstrap-without-jquery/bootstrap3/bootstrap-without-jquery.min.js"></script>
		<script src="node_modules/angular/angular.min.js"></script>
		<script src="node_modules/<%= appRoute %>"></script>
		<!-- build:js js/main.min.js -->								<!-- this path is relative to base - this is where grunt creates js AND what it substitutes in output file's src attribute -->
		<script src="js/app.js"></script>								<!-- this path is relative to base - this is where usemin-prepare finds js -->
		<script src="js/controllers/mainCtrl.js"></script>
		<!-- endbuild -->
	</head>

	<body>
		<div <%= routeView %> ng-app="<%= appName %>App" ng-controller="mainCtrl">
		</div>
	</body>

</html>
