
# Translate

Basic translate library for browser.

## Getting started

```
var translate = require('translate');
var translations = {
	'default': {
		'it_IT': {
			"%s records founded in the table": "Ho trovato %s record nella tabella",
			"...": "..."
		}
	},
	'error': {
		'it_IT': {
			"User denied geolocation": "Negato l'accesso al GPS",
			"...": "..."
		}
	}
};
translate.setTranslations(translations);
translate.setLocale('it_IT');

// Load other libraries language files
// Ex. require('moment-it');

```

When you call setLocale() an `change:locale` event will be triggered.

```
translate.on('change:locale', function (newLocale) {
	console.log('New locale: ' + newLocale);
});
```

## __(msg [, ...])

Returns translated string matched in the *default* namespace. From the second argument it works like `sprintf`.

```
translate.__('%s records founded in the table', 150);
// Output: Ho trovato 150 record nella tabella
```

## __n(namespace, msg)

Returns translated string matched in the specified namespace. From the second argument it works like `sprintf`.

```
translate.__n('error', 'User denied geolocation');
// Output: Negato l'accesso al GPS
```
