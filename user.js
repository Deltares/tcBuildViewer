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

    var response = await fetch(`${teamcity_base_url}/app/rest/projects?locator=archived:false,selectedByUser:(user:(current),mode:selected)&fields=project(id,parentProjectId)`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    });

    var projects = await response.json();

    var all_project_ids = projects.project.map(x => x.id);

    var favoriteProjectObjects = projects.project.filter( project => {
        return !all_project_ids.includes(project.parentProjectId);
    })

    var favorite_projects = favoriteProjectObjects.map(x => x.id);

    var api_settings = {
        include_projects: favorite_projects,
        exclude_projects: [],
    }

    return api_settings;

}

function updateFormSettings() {
    var settingsDiv = document.getElementById('settings_code');
    settings_textarea.value = JSON.stringify(edit_settings, undefined, 2);
    settingsDiv.innerText = JSON.stringify(settings, undefined, 2);
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }
  
  function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }