// JS File for Calendar
document.title = 'Aggie SAMA - Calendar';

document.addEventListener('DOMContentLoaded', function () {
	const calendarEl = document.getElementById('calendar');

	// Create full calendar object
	const calendar = new FullCalendar.Calendar(calendarEl, {
		googleCalendarApiKey: 'AIzaSyDhH653b21qFywRN53Yf_byvXrNreumn5Q', // API key to enable FullCalendar to Access GCal
		events: {
			googleCalendarId: 'cdconn00@tamu.edu', // determines which google calendar will be used
		},
		headerToolbar: {
			left: 'prev,next',
			center: 'title',
			right: 'timeGridDay,timeGridWeek,dayGridMonth',
		},
		contentHeight: 'auto',
		initialView: getView(),
		windowResize: function (arg) {
			calendar.changeView(getView());
		},
		eventClick: function (info) {
			if (info.event.url) {
				const location = info.event.extendedProps.location;

				// Create dates formatted in a way google calendar can understand
				const googleFormattedStartDate = info.event.start
					.toISOString()
					.replace(/-|:|\.\d\d\d/g, '');
				const googleFormattedEndDate = info.event.end
					.toISOString()
					.replace(/-|:|\.\d\d\d/g, '');

				// Prevent the calendar api from navigating away from the page
				info.jsEvent.preventDefault();

				// Create content to display in pop-up
				let fancyContent =
					`<h2>${info.event.title}</h2>` +
					`<p class="mt-4 mb-1"><i class="fas fa-calendar-alt mr-2"></i> ${info.event.start.toLocaleDateString(
						'en-US',
						{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
					)}</p>` +
					`<p class="my-1"><i class="fas fa-clock mr-2"></i> 
					${info.event.start.toLocaleString('en-US', {
						hour: 'numeric',
						minute: 'numeric',
						hour12: true,
					})} 
					 - 
					${info.event.end.toLocaleString('en-US', {
						hour: 'numeric',
						minute: 'numeric',
						hour12: true,
					})}</p>`;

				// Check if location exists, determine whether or not to wrap it in a link
				if (location) {
					if (location.toLowerCase().includes('http')) {
						fancyContent += `<p class="my-1"><i class="fas fa-map-marker-alt mr-2"></i> <a href='${location.toLowerCase()}' target='_blank'>Join Here</a></p>`;
					} else {
						fancyContent += `<p class="my-1"><i class="fas fa-map-marker-alt mr-2"></i> ${location}</p>`;
					}
				}

				// Append link that will create a google calendar event for the user when clicked
				fancyContent += `<a 
					href="http://www.google.com/calendar/render?
						action=TEMPLATE
						&text=${info.event.title}
						&dates=
						${googleFormattedStartDate}/${googleFormattedEndDate}
						&details=${
							info.event.extendedProps.description == null
								? ''
								: info.event.extendedProps.description
						}
						&location=${location == null ? '' : location}
						&trp=false"
					target='_blank' 
					class='btn btn-primary portal-button mt-4 text-center'>
					Add to Your Calendar
				</a>`;

				// Open popup window with content created
				new Fancybox([
					{
						src: fancyContent,
						type: 'html',
					},
				]);
			}
		},
	});

	calendar.render(); // Generate the calendar
});

function getView() {
	if ($(window).width() <= 700) {
		return 'timeGridDay';
	} else if ($(window).width() <= 790) {
		return 'timeGridWeek';
	} else if ($(window).width() <= 1030) {
		return 'timeGridWeek';
	} else {
		return 'dayGridMonth';
	}
}
