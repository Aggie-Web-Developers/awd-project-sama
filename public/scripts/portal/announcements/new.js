// JS File for New Announcement View

$(function () {
	document.title = 'Aggie SAMA - Add Announcement';

	$('#frm').validate({
		ignore: ':hidden',
		rules: {
			txtSubject: { required: true, maxlength: 100 },
			txtBody: { required: true, maxlength: 2000 },
		},
		messages: {
			txtSubject: { required: 'Please enter a subject.' },
			txtBody: { required: 'Please enter some content.' },
		},
		errorPlacement: function (error, element) {
			error.appendTo(element.closest('.form-group'));
		},
	});

	$('.alert').click(function () {
		$(this).hide();
	});
});
