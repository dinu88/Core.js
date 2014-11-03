
//Page Constructor
var Page = function(data) {
	var page = this,
			events = {},
			additionalData = {},
//			loaded = data.loaded,
			Self = Math.floor((Math.random() * 9999999) + 1),
			availableEvents = new Array('pageReady'),
			location = data.location,
			eventsIdentifiers = [],
			settings = {
				autoUpdateData : true
			};

	//declare events functions that should be called (identified by key);
	this.eventsToCall = [];

	var eventHandler = function(event, key, fn) {
		if (arguments.length == 0){
			return {call : function(event){
				if (events[event]) {
					var length = events[event].length;
					for (var i = 0; i < length; i++) {
						if (page.eventsToCall.indexOf(events[event][i]['key']) != -1) {
							events[event][i]['fn']();
						}
					}
				}
				prepareActions();
			}}
		} else if (typeof key == 'function') {

		} else if (eventsIdentifiers.indexOf(key) == -1){
			page.eventsToCall.push(key);
			if (availableEvents.indexOf(event) != -1) {
				eventsIdentifiers.push(key);
				if (!events[event]) events[event] = [];
				events[event].push({key : key, fn: fn});
			}
		} else {
			page.eventsToCall.push(key);
		}
	};

	var setAdditionalData = function(key, value) {
		return additionalData[key] = value;
	};
	var unsetAdditionalData = function(key) {
		if (additionalData[key]) {
			delete additionalData[key];
			return true;
		} else return false;
	};
	var getAdditionalData = function(key) {
		return additionalData[key];
	};

	var getHtmlPage = function() {
		var newPage = $('<div data-role="page" data-pagename="' + this.name + '" class="page" id="' + this.name + '" ></div>');
		newPage = newPage.append($(data.header).clone()).append($(data.content).clone()).append($(data.footer).clone());
		return newPage;
	};

	Object.defineProperty(this, "name", {value: data.name});
	Object.defineProperty(this, "on", {value: eventHandler});
	Object.defineProperty(this, "html", {value: getHtmlPage});
	Object.defineProperty(this, "settings", {value: settings, writable: true});

	/**
	 * Data Constructor. Load initial data on page create.
	 */
	data = (function(data) {
		var pageData = {};
		if (typeof data == 'object') {
			if (data['header']) {
//				if ($('div[data-role="header"]', data['header']).length == 0) {
//					var container = '<div data-role="header" class="header ' + this.name + '"></div>';
//					data['header'] = $(container).append(data['header']);
//				}
				pageData['header'] = data['header'];
			}
			if (data['content']) {
				var tmp = $(data['content']);
				if ($(tmp).data('role') != 'content') {
					var container = '<div data-role="content" class="content ' + this.name + '"></div>';
					data['content'] = $(container).append(data['content']);
				}
				pageData['content'] = data['content'];
			}
			if (data['footer']) {
//				if ($('div[data-role="footer"]', data['footer']).length == 0) {
//					var container = '<div data-role="footer" class="footer ' + this.name + '"></div>';
//					data['footer'] = $(container).append(data['footer']);
//				}
				pageData['footer'] = data['footer'];
			}
			if (pageData.length == 0) {
				pageData['content'] = data;
			}
		}

		return pageData;
	})(data.data);

	/**
	 * Data setters and getters.
	 * @type {{}}
	 */
	this.data = {};
	Object.defineProperties(this.data, {
		"header" : {
			get : function(){ return data.header; },
			set : function(newValue){
				var tmp = $(newValue);
				if (tmp.length == 0 && newValue.length > 0) {
					newValue = '<span>' + newValue + '</span>';
				}

				if ($(tmp).data('role') != 'header') {
					var container = '<div data-role="header" class="header ' + page.name + '"></div>';
					newValue = $(container).append(newValue);
				}
				tmp = null;

				if (typeof newValue == 'string') {
					newValue = $(newValue);
				}

				if (settings.autoUpdateData) page.updateHtml('header', newValue, Self);
				data.header = $(newValue).clone();
			},
			enumerable : true,
			configurable : true},
		"content" : {get : function(){ return data.content; },
			set : function(newValue){

				var tmp = $(newValue);
				if (tmp.length == 0 && newValue.length > 0) {
					newValue = '<span>' + newValue + '</span>';
				}

				if ($(tmp).data('role') != 'content') {
					var container = $('<div data-role="content" class="content ' + page.name + '"><div class="inner-content"></div></div>');
					$('.inner-content', container).append(newValue);
					newValue = container;
				}
				tmp = null;

				if (typeof newValue == 'string') {
					newValue = $(newValue);
				}
				if (settings.autoUpdateData) page.updateHtml('content', newValue, Self);
				data.content = $(newValue).clone();
			},
			enumerable : true,
			configurable : true},
		"footer" : {get : function(){ return data.footer; },
			set : function(newValue){

				var tmp = $(newValue);
				if (tmp.length == 0 && newValue.length > 0) {
					newValue = '<span>' + newValue + '</span>';
				}

				if ($(tmp).data('role') != 'footer') {
					var container = '<div data-role="footer" class="footer ' + page.name + '"></div>';
					newValue = $(container).append(newValue);
				}
				tmp = null;
				if (typeof newValue == 'string') {
					newValue = $(newValue);
				}
				if (settings.autoUpdateData) page.updateHtml('footer', newValue, Self);
				data.footer = $(newValue).clone();
			},
			enumerable : true,
			configurable : true},
		"set": {value: setAdditionalData},
		"unset": {value: unsetAdditionalData},
		"get": {value: getAdditionalData}
	});

	Object.defineProperties(this, {
		location : {get : function(){
										if (location && location.indexOf(':') != -1) {
											var l = location.split('/');
											var length = l.length;
											for (var i = 0; i < length; i++) {
												if (l[i].indexOf(':') != -1) {
													if (page.data.get(l[i].substr(1))){
														l[i] = page.data.get(l[i].substr(1));
													}
													else {
														//TODO:  find value in root place
														console.log('location placeholder not found');
													}
												}
											}
											return l.join('/');
										} else
												return location;
								},
								set : function(newValue) {
									location = newValue;
								}}
	});

	this.checkSelf = function(self) {
		return self == Self;
	}

};

Page.prototype.updateHtml = function(what, newData, self) {
	if (arguments.length == 0 && this.isCurrentPage()) {
		var newPage = '<div data-role="page" data-pagename="' + this.name + '" class="page" id="' + this.name + '" ></div>';
		newPage = $(newPage).append(this.data.header).append(this.data.content).append(this.data.footer);
		$('div[data-role="page"]').replaceWith($(newPage));
		this.on().call('pageReady');
	} else if (this.checkSelf(self) && this.isCurrentPage()) {
		if (typeof newData == 'object') {
				$('div[data-role="' + what + '"]').replaceWith(newData);
		} else {
			this.updateHtml(what, $(newData));
		}
	}
};

Page.prototype.isCurrentPage = function() {
	var hash = window.location.hash.substr(1);
	var tmp = hash.split('/');
	var page = tmp[0];
	return this.name == page;
};

Page.prototype.reloadData = function (fn) {
	var page = this;

	Core.ajaxGet({location: this.location}, function (err, res) {
		if (err) {
			console.log(err)
		} else {
			if (res.page && res.page != page.name) {
				window.location.replace('#' + res.page);
			} else {
				if (res.data) {
					for (var name in res.data) {
						if (res.data.hasOwnProperty(name))
							page.data.set(name, res.data[name]);
					}
				}

				if (res.html) {
					page.data.content = res.html;
				} else {
					if (res.header)
						page.data.header = res.header;
					if (res.content)
						page.data.content = res.content;
					if (res.footer)
						page.data.footer = res.footer;
				}
			}
		}
		if (fn) fn();
	});
};