async function getCurrentUser() {
    var response = await fetch(`${teamcity_base_url}/app/rest/users/current`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    });
    if (await response.ok) {
        user = result.json();
    } else {
        user = null;
        showLogin();
    }
    return user;
}

function showLogin() {
    document.getElementById('login').classList.toggle('hidden');
}