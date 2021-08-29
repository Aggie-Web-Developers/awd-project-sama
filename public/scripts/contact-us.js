$(function () {
	document.title = 'Aggie SAMA - Edit Announcement';

	$('#frm').validate({
		ignore: ':hidden',
		rules: {
			txtName: { required: true, maxlength: 75 },
			txtEmail: { required: true, maxlength: 75 },
			txtCompany: { maxlength: 75 },
			txtMessage: { required: true, maxlength: 1000 },
		},
		messages: {
			txtName: { required: 'Please enter your name.' },
			txtEmail: { required: 'Please enter your email.' },
			txtMessage: { required: 'Please enter a message.' },
		},
		errorPlacement: function (error, element) {
			error.appendTo(element.closest('.form-group'));
		},
	});

	$('.alert').click(function () {
		$(this).hide();
	});
});
