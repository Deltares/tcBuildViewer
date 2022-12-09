function getCurrentUser() {

    if (!userLoggedIn()) {
        showLogin();
        do {
            console.log("sleep some more");
            sleep(1000);
        } while (!userLoggedIn());
    }

    return user;

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}