// JS File for New Announcement View

$(function () {
	document.title = 'Aggie SAMA - Add Announcement';

	$('#frm').validate({
		ignore: ':hidden',
		rules: {
			txtEmail: { required: true, email: true, maxlength: 100 },
			txtPassword: { required: true, maxlength: 50 },
		},
		messages: {
			txtEmail: { required: 'Please enter an email address.' },
			txtPassword: { required: 'Please enter a password.' },
		},
		errorPlacement: function (error, element) {
			error.appendTo(element.closest('.form-group'));
		},
	});

	$('.alert').click(function () {
		$(this).hide();
	});

	$('.alert').click(function () {
		$(this).hide();
	});
});
