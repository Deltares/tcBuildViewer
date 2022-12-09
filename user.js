function getCurrentUser() {
    fetch(`${teamcity_base_url}/app/rest/users/current`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })
        .then((result) => {

            console.log(result);

            if (result.ok) {
                return result.json();
            } else {
                console.log("User is not logged in to TeamCity.");
                showLogin();
            }
            
        })
        .catch(err => { return null; })
}

function showLogin() {
    document.getElementById('login').classList.toggle('hidden');
}