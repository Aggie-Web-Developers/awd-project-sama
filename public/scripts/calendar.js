document.addEventListener('DOMContentLoaded', function () {
	var calendarEl = document.getElementById('calendar');

	var calendar = new FullCalendar.Calendar(calendarEl, {
		eventClick: function (info) {
			console.log(info.event);

			if (info.event.url) {
				info.jsEvent.preventDefault(); // don't let the browser navigate

				var fancyContent =
					'<div class="header">Event Details</div> <div id="prac" class="pracform"> <label><b>Event: </b></label>' +
					info.event.title +
					'<br>' +
					'<label><b>Date: </b></label>' +
					info.event.date +
					'<br>' +
					'<label><b>Start Time: </b></label>' +
					info.event.start +
					'<br>' +
					'<label><b>End Time: </b></label>' +
					info.event.end +
					'<br>' +
					'<label><b>Description: </b></label>' +
					'<div class="event_desc">' +
					info.event.description +
					'</div>' +
					'<br>' +
					'<label><b>Add to Calendar: </b></label><a href=' +
					info.event.url +
					'>' +
					info.event.location +
					'</a>' +
					'<br>' +
					'</div>';

				new Fancybox([
					{
						src: fancyContent,
						type: 'html',
					},
				]);

				return false;
			}
		},
		googleCalendarApiKey: 'AIzaSyDhH653b21qFywRN53Yf_byvXrNreumn5Q',
		headerToolbar: {
			left: 'prev,next',
			center: 'title',
			right: 'timeGridDay,timeGridWeek,dayGridMonth',
		},
		events: {
			googleCalendarId: 'cdconn00@tamu.edu',
		},
	});

	calendar.render();
});
