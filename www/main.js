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