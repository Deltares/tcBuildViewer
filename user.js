// 1. Check if the user is logged in.
// 2. Present login button if not logged in.
// 3. Check every second if the user is logged in.
// 4. Return user when the user is logged in.
async function getCurrentUser() {

    if (!await userLoggedIn()) {

        // Show login button if the user is not logged in.
        document.getElementById('login').classList.toggle('hidden');

        do {
            console.log("Waiting for the user to log into TeamCity.");
            return new Promise(resolve => setTimeout(resolve, 1000));
        } while (! await userLoggedIn());

    }

    // Remove login button if the user is logged in.
    document.getElementById('login').classList.toggle('hidden');

    return user;

}

// Basically just showing a login button.
function showLoginButton() {

    document.getElementById('login').classList.toggle('hidden');

}

// Returns true/false.
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