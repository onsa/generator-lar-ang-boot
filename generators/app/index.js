'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var appName;

var prepareAppName = function(rawAppName) {
	rawAppName = rawAppName.replace(/(-.)/g, function(letter){return letter.toUpperCase()});
	rawAppName = rawAppName.replace(/(&.)/g, function(letter){return letter.toUpperCase()});
	rawAppName = rawAppName.replace(/(\s.)/g, function(letter){return letter.toUpperCase()});
	return rawAppName.charAt(0).toUpperCase() + rawAppName.slice(1);
};

module.exports = yeoman.generators.Base.extend({
	init: function () {
		this.baseDir = this.destinationRoot();
	},
	prompting: function () {
		var done = this.async();

		// Have Yeoman greet the user.
		this.log(yosay('Welcome to the ' + chalk.red('Bootstrap - Angular - Grunt - Laravel') + ' app generator!'));

		//  Questions to ask the user
		var prompts = [
			{
				type: 'input',
				name: 'name',
				message: 'What should we call the app?',
				default: this.appName
			},
			{
				type: 'input',
				name: 'description',
				message: 'How should we decribe the app?',
				default: this.appDescription
			},
			{
				type: 'input',
				name: 'DBName',
				message: 'Create a new MySQL user and a database with the same name; and enter the chosen name:',
				default: 'laravel'
			},
			{
				type: 'input',
				name: 'DBPassword',
				message: 'Enter the database password for the new user:',
				default: 'secret'
			},
			{
				type: 'confirm',
				name: 'authentication',
				message: 'Would you like to set up user authentication?',
				default: false
			},
			{
				type: 'confirm',
				name: 'router',
				message: 'Would you rather use UI Router instead of Angular Route?',
				default: false				
			}
		];

		//  Ask questions.
		this.prompt(prompts, function (props) {
			this.props = props;
			// To access props later use this.props.someOption;
			this.appName = this.props.name;
			appName = prepareAppName(this.appName);
			this.log(appName);
			this.appDescription = this.props.description;
			this.DBName = this.props.DBName;
			this.DBPassword = this.props.DBPassword;
			//	set variables based on authentication answer
			this.appAuth = this.props.authentication;
			if (this.props.authentication) {
				this.mainTemplate = '_main.auth.html';
				this.mainController = '_mainCtrl.auth.js';
			} else {
				this.mainTemplate = '_main.html';
				this.mainController = '_mainCtrl.js';
			}
			//	set variables based on route answer
			this.route = {};
			if (this.props.router) {
				this.route.module = 'angular-ui-router';
				this.route.viewDirective = 'ui-view="content"';
				this.route.config = '_app.ui.js';
				this.route.path = 'angular-ui-router/release/angular-ui-router.min.js';
				this.route.logout = 'window.location.reload();';
			} else {
				this.route.module = 'angular-route';
				this.route.viewDirective = 'ng-view';
				this.route.config = '_app.js';
				this.route.path = 'angular-route/angular-route.min.js';
				this.route.logout = 'window.location = \'login\';';
			}
			this.config.set('appName', this.appName);
			this.config.save();
			done();
		}.bind(this));
	},

	//  Install laravel.
	default: function () {
		var done = this.async();

		this.log(yosay('Please wait while ' + chalk.red('Laravel') + ' is being installed!'));
		var lar = this.spawnCommand('composer', ['create-project', 'laravel/laravel', this.appName]);
		lar.on('close', function (argument) {
			this.emit('environment');
			this.emit('permissions');
		}.bind(this));

		//  Set .env file.
		this.on('environment', function() {
			this.destinationRoot(this.baseDir+'/'+this.appName);
			this.log(yosay('Setting ' + chalk.red('environmental') + ' variables.'));
			var DBName = this.props.DBName;
			var DBPassword = this.props.DBPassword;
			this.fs.copy(
				this.destinationPath('.env'),
				this.destinationPath('.env'),
				{
					process: function(content) {
					var regExDBName = new RegExp('homestead', 'g');
					var regExDBPassword = new RegExp('secret', 'g');
					content = content.toString().replace(regExDBName, DBName);
					content = content.toString().replace(regExDBPassword, DBPassword);
					return content;
					}
				}
			);
			done();
		});

		//  Set laravel folder permissions.
		this.on('permissions', function() {
			var done = this.async();
			this.log(yosay('Setting permissions for laravel ' + chalk.red('/storage and /bootstrap/cache') + '.'));
			var permStorage = this.spawnCommand('chmod', ['-R', '777', 'storage']);
			var permBootstrapCache = this.spawnCommand('chmod', ['-R', '777', 'bootstrap/cache']);     
			permBootstrapCache.on('close', function(argument) {
				this.emit('authentication');
			}.bind(this));

			//  Install user authentication.
			this.on('authentication', function() {
				if (this.appAuth){

					//  Run laravel's own authentication scaffolders.
					this.log(yosay('Creating laravel ' + chalk.red('authentication') + '.'));
					this.destinationRoot(this.baseDir+'/'+this.appName);
					var makeAuth = this.spawnCommand('php', ['artisan', 'make:auth']);
					var migrate = this.spawnCommand('php', ['artisan', 'migrate']);
					var rmWelcome = this.spawnCommand('rm', ['-rf', 'resources/views/welcome.blade.php']);
					makeAuth.on('close', function(argument) {

						//  Change Login and Register Controllers.
						this.log(yosay('Preparing ' + chalk.red('Login and Register Controllers') + '.'));
						this.destinationRoot(this.baseDir+'/'+this.appName+'/app/Http/Controllers/Auth');
						this.fs.copy(
							this.destinationPath('LoginController.php'),
							this.destinationPath('LoginController.php'),
							{
								process: function(content) {
								var regExRedirectTo = new RegExp('/home', 'g');
								var regExLogout = new RegExp('}\n}', 'g');
								content = content.toString().replace('Controller;', 'Controller;\nuse Illuminate\\Http\\Request;');
								content = content.toString().replace(regExRedirectTo, '/');
								content = content.toString().replace(regExLogout, '}\n\n    /**\n     * Log the user out of the application.\n     *\n     * @param  Request  $request\n     * @return \Illuminate\Http\Response\n     */\n    public function logout(Request $request)\n    {\n        $this->guard()->logout();\n\n        $request->session()->flush();\n\n        $request->session()->regenerate();\n    }\n}');
								return content;            
								}
							}
						);
						this.fs.copy(
							this.destinationPath('RegisterController.php'),
							this.destinationPath('RegisterController.php'),
							{
								process: function(content) {
								var regExRedirectTo = new RegExp('/home', 'g');
								content = content.toString().replace(regExRedirectTo, '/');
								return content;            
								}
							}
						);

						//  Set app name in config file.
						this.destinationRoot(this.baseDir+'/'+this.appName+'/config');
						this.log(yosay('Setting ' + chalk.red('config file') + '.'));
						this.fs.copy(
							this.destinationPath('app.php'),
							this.destinationPath('app.php'),
							{
								process: function(content) {
									content = content.toString().replace("'Laravel'", "'"+appName+"'");
									return content;
								}
							}
						);

						//  Change route file.
						this.log(yosay('Preparing ' + chalk.red('route') + ' file.'));
						this.destinationRoot(this.baseDir+'/'+this.appName+'/routes')
						this.fs.copy(
							this.destinationPath('web.php'),
							this.destinationPath('web.php'),
							{
								process: function(content) {
								var regExRootRoutes = new RegExp('/home', 'g');
								content = content.toString().replace(regExRootRoutes, '/');
								content = content.toString().replace("Route::get('/', function () {\n    return view('welcome');\n});\n", '');
								return content;            
								}
							}
						);

						//  Change Home Controller.
						this.log(yosay('Preparing ' + chalk.red('Home Controller') + '.'));
						this.destinationRoot(this.baseDir+'/'+this.appName+'/app/Http/Controllers')
						this.fs.copy(
							this.destinationPath('HomeController.php'),
							this.destinationPath('HomeController.php'),
							{
								process: function(content) {
								var regExCtrlIndex = new RegExp('home', 'g');
								content = content.toString().replace(regExCtrlIndex, 'index');
								return content;            
								}
							}
						);

						//  Change authentication template.
						this.log(yosay('Preparing ' + chalk.red('authentication') + ' template.'));
						this.destinationRoot(this.baseDir+'/'+this.appName);
						this.fs.copy(
							this.destinationPath('/resources/views/layouts/app.blade.php'),
							this.destinationPath('/public/views/layouts/app.blade.php'),
							{
								process: function(content) {
								var regExCssPath = new RegExp('/css/app.css', 'g');
								var regExJsPath = new RegExp('<script src="/js/app.js"></script>', 'g');
								content = content.toString().replace(regExCssPath, '{{ url(\'/\') }}/styles/main.min.css');
								content = content.toString().replace(regExJsPath, '');
								return content;            
								}
							}
						);

						this.emit('default');
					}.bind(this));
				} else {
					//  Change route file.
					this.log(yosay('Preparing ' + chalk.red('route') + ' file.'));
					this.destinationRoot(this.baseDir+'/'+this.appName+'/routes')
					this.fs.copy(
						this.destinationPath('web.php'),
						this.destinationPath('web.php'),
						{
							process: function(content) {
							content = content.toString().replace("Route::get('/', function () {\n    return view('welcome');\n});\n", "Route::get('/', 'HomeController@index' );\n");
							return content;            
							}
						}
					);

					//  Copy Home Controller.
					this.log(yosay('Preparing ' + chalk.red('Home Controller') + '.'));
					this.destinationRoot(this.baseDir+'/'+this.appName+'/app/Http/Controllers')
					this.fs.copy(
						this.templatePath('_HomeController.php'),
						this.destinationPath('HomeController.php')
					);          
					this.emit('default');
				}
			});

			this.on('default', function(){
				var generator = this;

				//  Move views from /resources to /public.
				this.log(yosay('Moving ' + chalk.red('views') + ' directory to ' + chalk.red('public') + '.'));
				this.destinationRoot(this.baseDir+'/'+this.appName+'/resources');
				var moveView = this.spawnCommand('mv', ['views/', '../public']);
				this.destinationRoot(this.baseDir+'/'+this.appName+'/config');
				this.fs.copy(
					this.destinationPath('view.php'),
					this.destinationPath('view.php'),
					{
						process: function(content) {
						var regExMvViews = new RegExp('resources/views', 'g');
						content = content.toString().replace(regExMvViews, 'public/views');
						return content;            
						}
					}
				);

				//  Delete unnecessary views from /resources.
				this.destinationRoot(this.baseDir+'/'+this.appName+'/resources');
				var rmViews = this.spawnCommand('rm', ['-rf', '/views']);

				//  Copy angular files.
				this.log(yosay('Generating ' + chalk.red('angular') + ' app files.'));
				this.destinationRoot(this.baseDir+'/'+this.appName);
				var createPublicSrc = this.spawnCommand('mkdir', ['public-src']);
				createPublicSrc.on('close', function(argument) {
					this.fs.copyTpl(
						this.templatePath('_index.php'),
						this.destinationPath('public-src/index.php'),
						{ AppName: appName,
						  appName: this.appName,
						  appRoute: this.route.path,
						  routeView: this.route.viewDirective
						}
					);

					this.fs.copyTpl(
						this.templatePath(this.route.config),
						this.destinationPath('public-src/js/app.js'),
						{ appName: this.appName }
					);

					this.fs.copyTpl(
						this.templatePath(this.mainController),
						this.destinationPath('public-src/js/controllers/mainCtrl.js'),
						{ appName: this.appName,
						  logout: this.route.logout
						}
					);

					this.fs.copy(
						this.templatePath('_main.scss'),
						this.destinationPath('public-src/styles/main.scss')
					);

					this.fs.copy(
						this.templatePath('_404.html'),
						this.destinationPath('public-src/views/404.html')
					);

					this.fs.copy(
						this.templatePath(this.mainTemplate),
						this.destinationPath('public-src/views/main.html')
					);

					//  Fetch front dependencies.
					this.log(yosay('Fetching front ' + chalk.red('dependencies') + '.'));
					var npmInstall = this.spawnCommand('npm', ['install', '--save-dev',
																													'bootstrap',
																													'time-grunt',
																													'angular',
																													this.route.module,
																													'bootstrap-sass',
																													'grunt',
																													'grunt-contrib-clean',
																													'grunt-contrib-concat',
																													'grunt-contrib-copy',
																													'grunt-contrib-cssmin',
																													'grunt-contrib-jshint',
																													'grunt-contrib-uglify',
																													'grunt-contrib-watch',
																													'grunt-jscs',
																													'grunt-sass',
																													'grunt-usemin',
																													'jit-grunt',
																													'jshint',
																													'jshint-stylish'
																												 ]);

					npmInstall.on('close', function(argument) {
						this.destinationRoot(this.baseDir+'/'+this.appName+'/node_modules');
						var gitInstall = this.spawnCommand('git', ['clone', 'https://github.com/tagawa/bootstrap-without-jquery.git']);

						//  Copy Gruntfile + .jschintrc + .jscsrc
						this.log(yosay('Configuring and running ' + chalk.red('grunt') + '.'));
						this.destinationRoot(this.baseDir+'/'+this.appName);
						this.fs.copy(
							this.templatePath('Gruntfile.js'),
							this.destinationPath('Gruntfile.js')
						);

						this.fs.copy(
							this.templatePath('.jshintrc'),
							this.destinationPath('.jshintrc')
						);

						this.fs.copy(
							this.templatePath('.jscsrc'),
							this.destinationPath('.jscsrc')
						);

						//  Change .htaccess.
						this.destinationRoot(this.baseDir+'/'+this.appName+'/public');
						this.fs.copy(
							this.destinationPath('.htaccess'),
							this.destinationPath('.htaccess'),
							{
								process: function(content) {
								var regExCtrlIndex = new RegExp('home', 'g');
								content = content.toString().replace('RewriteEngine On', 'RewriteEngine On\n    RewriteBase /'+generator.appName);
								return content;
								}
							}
						);

						//  Run Grunt.
						var runGrunt = this.spawnCommand('grunt');
						runGrunt.on('close', function(argument){

							//  Create symlink for node_module to be accessible from within base href.
							generator.spawnCommand('ln', ['-s', generator.baseDir+'/'+generator.appName+'/node_modules', generator.baseDir+'/'+generator.appName+'/public']);
						}.bind(this));
					}.bind(this));
				}.bind(this));

			});
			done();
		});
	}
});
