const officerBtns = document.querySelectorAll('.officerProfileBtn');

officerBtns.forEach(btn => {
    btn.addEventListener('change', function(){
        const officerProfileImg = btn.parentNode.children[0].children[0]
        officerProfileImg.src = URL.createObjectURL(this.files[0]);
    });
});