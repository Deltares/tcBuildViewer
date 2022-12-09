async function getCurrentUser() {

    if (!userLoggedIn()) {
        showLogin();
        do {
            await new Promise(r => setTimeout(r, 2000));
        } while (!userLoggedIn());
    }

    return await user;

}

function showLogin() {
    document.getElementById('login').classList.toggle('hidden');
}

async function userLoggedIn() {

    try {

        var response = await fetch(`${teamcity_base_url}/app/rest/users/current`, {
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });

        if (response && response.ok) {
            user = await response.json();
            return true;
        } else {
            return false;
        }
        
    } catch (err) {
        console.log(err);
        return false;
    }

}