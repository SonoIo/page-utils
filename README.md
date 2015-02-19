
# Page

Middleware and page manager for single page web app and mobile app.

## Getting started

```
var page = new Page();

// Middleware executed only one time
page.use(function (context, next) {
	context.foo = 'bar';
	next();
});

// URL executed at every address change
page.url('*', function (context, next) {
	if (context.foo != 'bar')
		return next(new Error('Comething goes wrong'));
	next();
});

// URL accessible from the browser address bar
page.url({ url: 'customers/:id', name: 'customers' }, function (context, next) {
	console.log(context.foo); // print 'bar'
	next();
});

// Multiple functions called in waterfall
page.url('profile', BasicAuth.ensureAuthenticated(), function (context, next) {
	// If I'm not logged in this code wont be executed
	console.log(context.user);
	next();
});

page.start();


// Somewhere else in the code...
var context = require('context');
console.log(context.foo); // print 'bar'

```

