function validateForm() {
	var n = document.getElementById('name').value;
	var e = document.getElementById('email').value;
	var s = document.getElementById('subject').value;
	var m = document.getElementById('message').value;

	var onlyLetters = /^[a-zA-Z\s]*$/;
	var onlyEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	var invalidForm = false;

	if (n == '' || n == null) {
		document.getElementById('nameLabel').innerHTML = 'Please enter your name';
		document.getElementById('name').style.borderColor = 'red';
		return false;
	} else {
		document.getElementById('nameLabel').innerHTML = '';
		document.getElementById('name').style.borderColor = 'black';
	}

	if (!n.match(onlyLetters)) {
		document.getElementById('nameLabel').innerHTML =
			'Please enter only letters';
		document.getElementById('name').style.borderColor = 'red';
		return false;
	} else {
		document.getElementById('nameLabel').innerHTML = '';
		document.getElementById('name').style.borderColor = 'black';
	}

	if (e == '' || e == null) {
		document.getElementById('emailLabel').innerHTML = 'Please enter your email';
		document.getElementById('email').style.borderColor = 'red';
		return false;
	} else {
		document.getElementById('emailLabel').innerHTML = '';
		document.getElementById('email').style.borderColor = 'black';
	}

	if (!e.match(onlyEmail)) {
		document.getElementById('emailLabel').innerHTML =
			'Please enter a valid email address';
		document.getElementById('email').style.borderColor = 'red';
		return false;
	} else {
		document.getElementById('emailLabel').innerHTML = '';
		document.getElementById('email').style.borderColor = 'black';
	}

	if (s == '' || s == null) {
		document.getElementById('subjectLabel').innerHTML =
			'Please enter your subject';
		document.getElementById('subject').style.borderColor = 'red';
		return false;
	} else if (!s.match(onlyLetters)) {
		document.getElementById('subjectLabel').innerHTML =
			'Please enter only letters';
		document.getElementById('subject').style.borderColor = 'red';
		return false;
	} else {
		document.getElementById('subjectLabel').innerHTML = '';
		document.getElementById('subject').style.borderColor = 'black';
	}

	if (m == '' || m == null) {
		document.getElementById('messageLabel').innerHTML =
			'Please enter your message';
		document.getElementById('message').style.borderColor = 'red';
		return false;
	} else {
		return true;
	}
}
