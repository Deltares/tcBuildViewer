async function checkLogin(){
    var response = getCurrentUser();
    await response;
}

function getCurrentUser() {
    fetch(`${teamcity_base_url}/app/rest/users/current`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })
        .then((result) => {

            if (result.ok) {
                user = result.json();
            } else {
                console.log("User is not logged in to TeamCity.");
                showLogin();
                user = null;
            }
            
        })
        .catch(err => {

            showLogin();
            user = null;

        })
}

function showLogin() {
    document.getElementById('login').classList.toggle('hidden');
}