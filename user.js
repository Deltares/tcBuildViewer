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

    if (await response.ok) {
        user = response.json();
    } else {
        user = null;
        showLogin();
    }
    return user;
}

function showLogin() {
    document.getElementById('login').classList.toggle('hidden');
}