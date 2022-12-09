async function getCurrentUser() {

    var response = await fetch(`${teamcity_base_url}/app/rest/users/current`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })
    .catch(err => {
        user = null;
        showLogin();
    });

    if (response && response.ok) {
        user = response.json();
        return user;
    } else {
        showLogin();
        return null;
    }
}

function showLogin() {
    document.getElementById('login').classList.toggle('hidden');
}