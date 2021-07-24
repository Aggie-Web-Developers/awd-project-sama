// JS file for newsletter / files page
//Set delete function
document.querySelectorAll(".deleteBtn").forEach((element, index) => {
    element.addEventListener('click', function() {
        $.ajax({
            type: 'DELETE',
            url: `/portal/newsletter/delete/${index}`,
            contentType: 'application/json'
        })
    });
})