

Zepto(function ($) {
	Core.routeProvider
			.state('routeName/:placeholderName', {controller: controllerName, location: 'LocationOnServer'})


	Object.defineProperty(window, 'SETTINGS', {value: {}, writable: false});
	for (var key in settings) {
		if (settings.hasOwnProperty(key)) {
			Object.defineProperty(SETTINGS, key, {value: settings[key], writable: false});
		}
	}
	Core.load();
});
