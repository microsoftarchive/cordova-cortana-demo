var app = (function() {
	var sessionData = null;
	var templateOpts = {
		imports: {
			moment: moment
		}
	};
	var templates = {
		schedule: _.template($('.content .schedule script[type="text/template"]').text(), null, templateOpts),
		details: _.template($('.content .details script[type="text/template"]').text(), null, templateOpts)
	}

	function fillTemplate(name, data) {
		$('.' + name + ' .template').html(templates[name](data));
	}

	var res = {
	    // Application Constructor
	    initialize: function() {
	        this.bindEvents();
	    },
	    // Bind Event Listeners
	    //
	    // Bind any events that are required on startup. Common events are:
	    // 'load', 'deviceready', 'offline', and 'online'.
	    bindEvents: function() {
	        document.addEventListener('deviceready', this.onDeviceReady, false);
	    },
	    // deviceready Event Handler
	    //
	    // The scope of 'this' is the event. In order to call the 'receivedEvent'
	    // function, we must explicitly call 'app.receivedEvent(...);'
	    onDeviceReady: function () {
	        cordova.plugins.cortana.installVoiceCommandSet('ms-appx:///www/assets/commands.vcd', function () {
	            console.log('COMMANDS INSTALLED <from callback>');
	            app.data().then(function(data) {
	                var names = data.schedule.map(function (session) {
	                    return !session.speakers ? [] : session.speakers.map(function (speaker) {
	                		return !speaker ? [] : speaker.split(' '); 
	                	}); 
	                }).reduce(Function.prototype.apply.bind(Array.prototype.concat));
		            cordova.plugins.cortana.setPhraseList('phonegapday', 'name', names, function () {
		                console.log('PHRASE LIST SET <from callback>');
		            }, function (err) {
		                console.error('PHRASE LIST NOT SET <from callback> DUE TO ' + JSON.stringify(err));
		            });
		        });
	        }, function (err) {
	            console.error('COMMANDS NOT INSTALLED <from callback> DUE TO ' + JSON.stringify(err));
	        });

	        document.addEventListener('onVoiceCommand', app.onVoiceCommand, false);

	        app.schedule();
	    },
	    // voicecommand Event Handler
	    //
	    // The scope of 'this' is the event. In order to call the 'receivedEvent'
	    // function, we must explicitly call 'app.receivedEvent(...);'
	    onVoiceCommand: function (command) {
	        console.log('GOT VOICE COMMAND:');
	        console.log(JSON.stringify(command));
	        if (command.rulePath[0] === "showAt") {
	            console.log("at -> " + command.semanticInterpretation.properties.time[0]);
	        } else if (command.rulePath[0] === "showBy") {
	            console.log("by -> " + command.semanticInterpretation.properties.name[0]);
	            app.find(command.semanticInterpretation.properties.name[0], true);
	        } else if (command.rulePath[0] === "showNext") {
	            console.log("next!");
	            app.findByTime(Date.now(), false);
	        }
	    },
		data: function() {
			if (sessionData) {
				return $.when(sessionData);
			} else {
				return $.getJSON('data.json').then(function(data) {
					sessionData = data;
					return sessionData;
				});
			}
		},
		findByTime: function(time, ignoreDate) {
			time = new Date(time);
			if (ignoreDate) {
				time = moment(time).date(24).month('October').year(2014).toDate();
			}
			return res.data().then(function(data) {
				return _.find(data.schedule, function(session) {
					return session.start <= time.getTime() && time.getTime() < session.end;
				});
			});
		},
		find: function(text, searchSpeakers) {
			var query = new RegExp(text, 'i');
			return res.data().then(function(data) {
				return _.filter(data.schedule, function(session) {
					if (searchSpeakers) {
						return _.filter(session.speakers, function(speaker) {
							return query.test(speaker);
						}).length > 0;
					} else {
						return query.test(session.title);
					}
				});
			});
		},
		schedule: function() {
			app.data().then(function(data) {
				fillTemplate('schedule', data);
				$('.schedule').fadeIn();
				$('.details').fadeOut();
			});
		},
		details: function(title) {
			app.data().then(function(data) {
				fillTemplate('details', _.find(data.schedule, {
					title: title
				}));
				$('.schedule').fadeOut();
				$('.details').fadeIn();
			});
		}
	};

	return res
}());

app.initialize();