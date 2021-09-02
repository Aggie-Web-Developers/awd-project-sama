// import axios from 'axios';

async function helper(form_id) {
	let result;
	try {
		$.ajax({
			type: 'GET',
			url: `/portal/contact/view-form/${form_id}`,
			success: function (data) {
				result = data;
			},
			error: function (data) {
				console.error('error');
			},
			async: false,
		});
	} catch (err) {
		console.error(err);
	}
	return result;
}

document.querySelectorAll('.contact_form_open').forEach((button) => {
	button.addEventListener('click', async (event) => {
		// get the id from the button
		const id = event.target.id.substring(10);

		// helper function
		let result = await helper(id);
		result = result.data[0];

		// with the data, create html that contains our data
		// html for the modal
		let html = `
      <div class="modal fade" id="modal_${id}" tabindex="-1" role="dialog" aria-labelledby="exampleModalLongTitle" aria-hidden="true">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="exampleModalLongTitle">${result.name}</h5>
              <button type="button" class="close button-close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <p>Email: ${result.email}</p>
              <p>Company: ${result.company}</p>
              <p>${result.message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn button-close btn-secondary" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
		// add the html to the page
		// get body
		document.getElementById('content').insertAdjacentHTML('afterend', html);
		document.querySelectorAll('.button-close').forEach((button) => {
			button.addEventListener('click', () => {
				document.querySelector('.modal').remove();
			});
		});
		// activate modal
		$(`#modal_${id}`).modal();
	});
});
