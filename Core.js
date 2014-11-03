var Core = (function() {
	var core = this;

	var pages = {},
			controllers = {},
			routeProvider = {},
			routeStates = {},
			pagesHistory = [],
			rootScope = Object();

	var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
	var ARGUMENT_NAMES = /([^\s,]+)/g;
	function getParamNames(func) {
		var fnStr = func.toString().replace(STRIP_COMMENTS, '');
		var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
		if(result === null)
			result = [];
		return result
	}


	var callController = function(pageName, routeState) {
		var func =  routeStates[routeState].controller;
		if (typeof func == "function") {
			var controllerParams = getParamNames(func);
			var argumentsToSend = [];
			for (var i in controllerParams) {
				if (controllerParams.hasOwnProperty(i)) {
					switch (controllerParams[i]){
						case 'page':
							argumentsToSend[i] = Core.pages(pageName);
							break;
						case 'rootScope':
							argumentsToSend[i] = rootScope;
							break;
						default:

							if (Core.pages(pageName).data.get(controllerParams[i])){
								argumentsToSend[i] = Core.pages(pageName).data.get(controllerParams[i]);
							} else if (rootScope[controllerParams[i]]) {
								argumentsToSend[i] = rootScope[controllerParams[i]];
							} else {
								argumentsToSend[i] = null;
							}
							break;
					}
				}
			}
			routeStates[routeState].controller(argumentsToSend[0],
					argumentsToSend[1],
					argumentsToSend[2],
					argumentsToSend[3],
					argumentsToSend[4],
					argumentsToSend[5]
			);
		}
	};

	var defineState = function(route, options) {
		if (!routeStates[route] && options.controller &&
				(typeof options.controller == 'function' ||
						(options.controller.length > 1 && window[options.controller] && typeof window[options.controller] == 'function'))) {

			var newState = {};
			if (options.location && options.location.length > 1) {
				newState['location'] = options.location;
			}

			if (typeof options.controller == 'function')
				newState['controller'] = options.controller;
			else
				newState['controller'] = window[options.controller];

			routeStates[route] = newState;
//			console.log(routeStates);
			newState = null;
		} else {
			console.warn('route ' + route + ' allready defined or invalid route options');
		}
		return core.routeProvider;
	};

	var stateExists = function(state) {
		if (routeStates[state]) {
			return {routeState : state};
		} else {

			state = state.split('/');
			var exists = false,
					foundState;
			for (var currentState in routeStates){
				if (routeStates.hasOwnProperty(currentState)) {
					currentState = currentState.split('/');
					var lengthJ = currentState.length;
					if (lengthJ == state.length) {
						var isCurrent = true;
						for (var j = 0; j < lengthJ && isCurrent == true; j++) {
							if (currentState[j].indexOf(':') != 0) {
								if (currentState[j] != state[j]) {
									isCurrent = false;
								}
							} else {
								if (typeof tokens == 'undefined') tokens = {};
								tokens[currentState[j].replace(':','')] = state[j];
							}
						}
					}
					if (isCurrent) {
						if (typeof currentState != 'string') currentState = currentState.join('/');
						if (!foundState)
							foundState = currentState;
						else if (typeof foundState == 'object'){
							foundState.push(currentState);
						} else {
							foundState = new Array(foundState);
							foundState.push(currentState);
						}
						exists = true;
						isCurrent = false;
					}
				}
			}

			if (exists) {
				if (typeof tokens != 'undefined'){
//					if (typeof foundState != 'string') foundState = foundState.join('/');
					return {tokens : tokens, routeState : foundState};
				}
				else return {routeState : foundState};
			} else {
				return false;
			}
		}
	};

	var routeChanged = function (e) {
//		console.log(window.location.hash);
//		console.log(e);

		var hash = window.location.hash.substr(1);
//		if (e) {
//			console.log(e.oldURL.split('#')[1]);
//		}
		if (hash == 'home') {
			window.location.replace('#' + SETTINGS.homepage);
			return;
		} else if (hash == 'back' || hash == '') {
			if (window.history.length <= 2 || e.oldURL.split('#')[1] == 'back') {
				window.location = '#home';
			} else  {
				window.history.go(-2);
			}
			return false;
		} else {
			pagesHistory.push(hash);
			var tmp = hash.split('/');
			var page = tmp[0];
			var action = hash.replace(tmp[0], '');
			var exists = stateExists(hash);
//			console.log(exists);
//			console.log(page);
			tmp = null;
			if (exists && !Core.pages(page)) {
				if (exists.routeState && routeStates[exists.routeState].location) {
					var newPage = {data: {}};
					newPage['name'] = page;
					newPage['loaded'] = true;
					newPage['location'] = routeStates[exists.routeState].location;
					pages[newPage.name] = new Page(newPage);
					if (exists.tokens) {
						for (var name in exists.tokens) {
							if (exists.tokens.hasOwnProperty(name))
								Core.pages(newPage.name).data.set(name, exists.tokens[name]);
						}
					}
					callController(newPage.name, exists.routeState);
					Core.ajaxGet({location: Core.pages(newPage.name).location}, function (err, res) {
						if (err) {
						} else {
							if (res.page && res.page != page) {
								if (res.page.indexOf('#') == 0) {
									if ((res.page == '#signIn') || (page == 'signIn' && res.page == '#profile')) {
										window.location.replace(res.page);
									} else {
										window.location = res.page;
									}
								} else {
									if ((res.page == 'signIn') ||(page == 'signIn' && res.page == 'profile')) {
										window.location.replace('#' + res.page);
									} else {
										window.location = '#' + res.page;
									}
								}
							} else {
								if (res.data) {
									for (var name in res.data) {
										if (res.data.hasOwnProperty(name)) {
											Core.pages(newPage.name).data.set(name, res.data[name]);
										}
									}
								}

								if (res.html) {
									Core.pages(newPage.name).data.content = res.html;
								} else {
									if (res.header)
										Core.pages(newPage.name).data.header = res.header;
									if (res.content)
										Core.pages(newPage.name).data.content = res.content;
									if (res.footer)
										Core.pages(newPage.name).data.footer = res.footer;
								}
								Core.pages(newPage.name).updateHtml();
							}
							newPage = hash = null;
						}
					})
				}
			}
			else if (exists && Core.pages(page)) {
				//reset eventsToCall;
				Core.pages(page).eventsToCall = [];
				if (exists.tokens) {
					for (var name in exists.tokens) {
						if (exists.tokens.hasOwnProperty(name)) {
							Core.pages(page).data.set(name, exists.tokens[name]);
						}
					}
				}
				if (typeof exists.routeState == 'object') {
					for (var i in exists.routeState) {
						if (exists.routeState.hasOwnProperty(i)) {
							callController(page, exists.routeState[i]);
						}
					}
				} else {
					callController(page, exists.routeState);
				}
//			routeStates[exists.routeState].controller(Core.pages(page));
				Core.pages(page).updateHtml();
			} else {
				window.history.go(-1);
			}
		}

		hash  = action = null;
	};

	var deletePage = function() {
		pages[this.name] = null;
	};

	var getPage = function(name) {
		if (pages[name]) {
			pages[name].delete = deletePage;
			return pages[name];
		} else {
			return false;
		}
	};

	var notification = function() {
		if (navigator.notification) {
			return navigator.notification;
		} else {
			var notification = {
				alert : function(message, callback, title) {
					if (typeof title !== 'undefined') {
						message = title + '\n' + message;
					}
					alert(message);
					if (typeof callback !== 'undefined')
						callback();
				},
				confirm : function(message, resultCallback, title) {
					var x;
					if (typeof title !== 'undefined') {
						message = title + '\n' + message;
					}
					alert(message);
					var r = confirm(message);
					if (r == true) {
						x = 2;
					} else {
						x = 1;
					}
					resultCallback(x);
				},
				prompt : function(message, resultCallback, title, buttonLabels, defaultText) {
					var x;
					if (typeof title !== 'undefined') {
						message = title + '\n' + message;
					}
					var res = prompt(message, defaultText);
					if (res === null) {
						x = 2;
					} else {
						x = 1;
					}
					res = {
						input1 : res,
						buttonIndex : x
					}
					resultCallback(res);
				}
			}
			return notification;
		}
	};


	Object.defineProperty(routeProvider, "state", {value: defineState});
	Object.defineProperty(routeProvider, "has", {value: stateExists});
	Object.defineProperty(this, 'notification', {value : notification()});
	Object.defineProperty(this, "routeProvider", {value: routeProvider});
	Object.defineProperty(this, "rootScope", {value: rootScope});
	Object.defineProperty(this, "pages", {value: getPage});
	Object.defineProperty(this, "pagesHistory", {value: pagesHistory});


	this.ajaxGet = function(data, fn) {
		data.method = 'GET';
		Ajax(data, fn);
	};
	this.ajaxPost = function(data, fn) {
		data.method = 'POST';
		Ajax(data, fn);
	};

	this.controllers = function(name, fn) {
		controllers[name] = fn;
	};

	this.load = function() {
		$('div[data-role="page"]').each(function(){

			var page = {data : {}};
			page['name'] = $(this).data('pagename');
			page['loaded'] = $(this).data('loaded');
			page['location'] = $(this).data('location');
			page['data']['header'] = $('div[data-role="header"]', this);
			page['data']['content'] = $('div[data-role="content"]', this);
			page['data']['footer'] = $('div[data-role="footer"]', this);

			if (!page['name']) {
				$(this).remove();
				return;
			}
			pages[page.name] = new Page(page);
			if (window[page.name + 'Controller']) {
				core.routeProvider.state(page.name, {controller : window[page.name + 'Controller']});
			}

			if (page['name'] != SETTINGS.homepage) {
				$(this).remove();
			}
		});


		window.onhashchange = routeChanged;
		var hash = window.location.hash.substr(1);
		if (hash.length == 0) {
			console.log('go to homepage');
			window.location = '#' + SETTINGS.homepage;
		}

		if (window.location.hash.indexOf("#") == '0') {
			routeChanged();
		}

	};

	return this;
})();
