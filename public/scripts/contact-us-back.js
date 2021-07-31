// import axios from 'axios';

async function helper(form_id) {
    try {
      const res = await axios({
        method: 'GET',
        url: 'http://localhost:8080/portal/contact/view-form',
        params: {
          form_id
        }
      });
      // console.log(res);
      if (res.data.status === 'success') {
        return res.data;
      }
    } catch (err) {
      console.log(err);
    }
}

// document.querySelectorAll(".contact_form_open").forEach(button => {})
console.log(helper(0));
console.log("test");