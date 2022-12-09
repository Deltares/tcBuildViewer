// 1. Check if the user is logged in.
// 2. Present login button if not logged in.
// 3. Check every second if the user is logged in.
// 4. Return user when the user is logged in.
async function getCurrentUser() {

    if (!await userLoggedIn()) {

        showLogin();

        do {
            console.log("sleep some more");
            await sleep(1000);
        } while (! await userLoggedIn());
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