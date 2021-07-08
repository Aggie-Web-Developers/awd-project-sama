const officerBtns = document.querySelectorAll('.officerProfileBtn');

officerBtns.forEach(btn => {
    btn.addEventListener('change', function(){
        const officerProfileImg = btn.parentNode.children[0].children[0]
        officerProfileImg.src = URL.createObjectURL(this.files[0]);
    });
});

// Show cancel button on form change
const forms = document.getElementsByTagName('FORM');

// Track input changes
for(let form of forms) {
    const inputs = form.getElementsByTagName('INPUT');
    const cancelBtn = form.getElementsByClassName('cancelBtn')[0];
    const deleteBtn = form.getElementsByClassName('deleteBtn')[0];

    for(let input of inputs){
        input.addEventListener('change', function(){
            cancelBtn.classList.remove('d-none');
            deleteBtn.classList.add('d-none');
        });
    }

    const textArea = form.getElementsByTagName('TEXTAREA')[0];
    textArea.addEventListener('change', function(){
        cancelBtn.classList.remove('d-none');
        deleteBtn.classList.add('d-none');
    });

    cancelBtn.addEventListener('click', function() {
        cancelBtn.classList.add('d-none');
        deleteBtn.classList.remove('d-none');
    });
}

// Officer creation
const createOfficerBtn = document.querySelector('.addOfficerBtn');
const newOfficerForm = document.querySelector('.newOfficerForm');

createOfficerBtn.addEventListener('click', function(){
    createOfficerBtn.classList.add('d-none');
    newOfficerForm.classList.remove('d-none');
});