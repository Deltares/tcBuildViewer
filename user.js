// 1. Check if the user is logged in.
// 2. Present login button if not logged in.
// 3. Check every second if the user is logged in.
// 4. Return user when the user is logged in.
async function getCurrentUser() {

    if (!await userLoggedIn()) {

        // Show login button if the user is not logged in.
        document.getElementById('login').classList.toggle('hidden');
        document.getElementById('user_name').innerHTML = 'waiting for login.';

        do {
            console.log("waiting for TeamCity login ...");
            await new Promise(resolve => setTimeout(resolve, 1000));
        } while (! await userLoggedIn());

        // Remove login button if the user is logged in.
        document.getElementById('login').classList.toggle('hidden');

    }

    document.getElementById('user_name').innerHTML = user.username;
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

async function getFavoriteProjects() {

    // Every child of favorite:
    // https://dpcbuild.deltares.nl/app/rest/projects?locator=archived:false,selectedByUser:(user:(current),mode:selected)&fields=project(id,parentProjectId)

    await fetch(`${teamcity_base_url}/app/rest/projects?locator=archived:false,selectedByUser:(user:(current),mode:selected)&fields=project(id,parentProjectId)`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })
        .then((result) => result.json())
        .then((output) => {
            var favoriteProjectObjects = output.project.filter( project => {
                return project.parentProjectId == '_Root';
            })
            favorite_projects = favoriteProjectObjects.map(x => x.id);
        })
        .catch(err => { console.log(err) });

}