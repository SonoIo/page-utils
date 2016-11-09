;(function (root, factory) {

	if (typeof exports !== 'undefined') {
		var Backbone = require('backbone');
		var _ = require('underscore');
		var $ = require('jquery');
		var context = require('context-utils');
		var waterfall = require('async').waterfall;
		module.exports = factory(root, Backbone, _, $, context, waterfall);
	}
	else {
		root.Page = factory(root, root.Backbone, root._, root.$, root.context, root.async.waterfall);
	}

}(this, function (root, Backbone, _, $, context, waterfall) {

	var Page = function Page() {
		var self = this;

		this._middleware    = [];
		this._urlMiddleware = [];

		this.context = context;
		this.context.page = self;

		this.activeUrl = null;
		this.routes = {};
		this.router = new Backbone.Router();
		this.router.on('route', this.onRoute, this);
		this.initialized = false;
		this.init();
	};
	_.extend(Page.prototype, Backbone.Events);

	// Metodo astratto per l'inizializzazione
	Page.prototype.init = function init() {};

	// Fa partire l'applicazione
	Page.prototype.start = function start(pushState) {
		var self = this;
		pushState = pushState || false;

		var actions = [];
		_(this._middleware).forEach(function (aMiddleware) {
			if (typeof aMiddleware === 'undefined')
				throw new Error('Middleware is undefined');

			actions.push(function (cb) {
				aMiddleware(context, function(err){
					return cb(err);
				});
			});

		});
		waterfall(
			actions,
			function (err) {
				if ( err )
					return self.onRouteError(err, context);
				self.initialized = true;
				Backbone.history.start({ pushState: pushState });
			}
		);

		return this;
	};
	Page.prototype.run = Page.prototype.start; // Alias

	// Cambia l'URL dell'applicazione utilizzando il router di Backbone.
	Page.prototype.navigate = function navigate(url, options) {
		var defaultOptions = {
			trigger: false,
			replace: false
		};

		if (!options)
			options = defaultOptions;

		this.router.navigate(url, options);
		return this;
	};

	// Effettua un vero e proprio redirect
	Page.prototype.redirect = function redirect(url) {
		window.location.href = url;
	};

	Page.prototype.back = function back(url) {
		window.history.back();
	};

	// Aggiunge una nuova middleware. Accetta una funzione che deve
	// avere come pattern fn(context, next).
	//
	// Attenzione!
	// Le middleware vengono eseguite nell'ordine con cui sono state
	// inserite.
	Page.prototype.use = function use(middleware) {
		this._middleware.push(middleware);
		return this;
	};

	// Aggiunge un nuovo url e assegna tutte le middleware caricate
	// tramite .use()
	Page.prototype.url = function() {
		var self = this;
		var args = _.values(arguments);
		var url = args.shift();
		var name = null;
		var concatMiddleware = true;

		if (url === undefined || url === null)
			throw new Error('No route passed');

		if (typeof url === 'object') {
			name = url.name;
			concatMiddleware = typeof url.concatMiddleware !== 'undefined' ? url.concatMiddleware : concatMiddleware;
			url = url.url;
		}

		if (url == '*') {
			_.each(args, function (aMiddleware) {
				if ( typeof aMiddleware === 'function' )
					self._urlMiddleware.push(aMiddleware);
			});
			return this;
		}

		var middlewares = this.routes[url] = this._createArrayOfMiddleware(args, concatMiddleware);
		var route = function route() {
			var args = arguments;
			context.params = args;

			var actions = [];
			_(middlewares).forEach(function (aMiddleware) {
				if (typeof aMiddleware === 'undefined')
					throw new Error('Middleware is undefined');

				if ( typeof aMiddleware === 'function' ){
					actions.push(function (cb) {
						aMiddleware(context, function(err){
							return cb(err);
						});
					});
				}

			});
			waterfall(
				actions,
				function (err) {
					if ( err )
						return self.onRouteError(err, context);
					self.initialized = true;
					self.onCompleteRoute(context);
				}
			);

		};

		if (name)
			this.router.route(url, name, route);
		else
			this.router.route(url, route);

		return this;
	};
	Page.prototype.route = Page.prototype.url; // Alias

	// Restituisce l'elenco delle route assegnate fino a questo momento
	// all'oggetto Page
	Page.prototype.getRoutes = function getRoutes() {
		return Backbone.history.handlers;
	};

	// Apre un link, se è interno all'app fa un navigate se è esterno apre un popup.
	// In caso di app mobile includere InAppBrowser e sovrascrivere window.open.
	Page.prototype.openUrl = function openUrl(url) {
		if (!url) return this;
		var self = this;
		var routes = this.getRoutes();
		var ref = null;
		var fragment = Backbone.history.getFragment(url);
		_.any(routes, function(handler) {
			if (url.toLowerCase().indexOf('http') === 0) {
				ref = window.open(url, '_blank', 'location=no,closebuttoncaption=' + __('Chiudi'));
				return true;
			}
			else if (handler.route.test(fragment)) {
				Backbone.history.loadUrl(fragment);
				return true;
			}
		});
		return ref;
	};

	Page.prototype.onRoute = function onRoute(route) {
		this.currentRoute = route;
	};

	Page.prototype.onCompleteRoute = function onCompleteRoute(context) {
		// console.log(context);
	};

	// Evento chiamato quando una route esegue la funzione next() della
	// middleware passando l'oggetto errore
	Page.prototype.onRouteError = function onRouteError(err, context) {
		this.trigger('error', err, context);
	};


	Page.prototype._createArrayOfMiddleware = function _createArrayOfMiddleware(middlewares, concatMiddleware) {
		if (concatMiddleware)
			return this._urlMiddleware.concat(middlewares || []);
		else
			return middlewares || [];
	};

	return Page;

}));
