// 1. Check if the user is logged in.
// 2. Present login button if not logged in.
// 3. Check every second if the user is logged in.
// 4. When the user is logged in:"
// 5. Hide login button
// 6. Return function
async function getCurrentUser() {

    if (!await userLoggedIn()) {

        // Show login button if the user is not logged in.
        document.getElementById('login').classList.remove('hidden')
        document.getElementById('user_name').innerHTML = 'waiting for login.'

        do {
            console.log("waiting for TeamCity login ...")
            await new Promise(resolve => setTimeout(resolve, 1000))
        } while (! await userLoggedIn())

        // Remove login button if the user is logged in.
        document.getElementById('login').classList.add('hidden')

    }

    document.getElementById('user_name').innerHTML = user.username

}

// Basically just show a login button.
function showLoginButton() {

    document.getElementById('login').classList.remove('hidden')

}

// Returns true/false.
async function userLoggedIn() {

    try {

        const promise = await fetch(`${teamcity_base_url}/app/rest/users/current`, {
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        })

        if (await promise?.ok) {
            user = promise.json()
            return true
        } else {
            return false
        }
        
    } catch (err) {
        console.log(err)
        return false
    }

}

// Get favorite projects from TeamCity API.
async function getFavoriteProjects() {

    const promise = await fetch(`${teamcity_base_url}/app/rest/projects?locator=archived:false,selectedByUser:(user:(current),mode:selected)&fields=project(id,parentProjectId)`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    // Assume that things work, now that the user is logged in.
    const projects = await promise.json()

    const all_project_ids = projects.project.map(x => x.id) // Only need IDs to (array-)filter on.

    // Only projects whose parent projects are not in the list, to avoid redundancy.
    const favoriteProjectObjects = projects.project.filter( project => {
        return !all_project_ids.includes(project.parentProjectId)
    })

    const favorite_projects = favoriteProjectObjects.map(x => x.id) // Only need IDs for selection.

    // Selection JSON structure.
    return api_selection = {
        include_projects: favorite_projects,
        exclude_projects: [],
    }

}

// The part where the user can edit the selection JSON.
function updateSelectionForm() {
    const selectionDiv = document.getElementById('selection_code')
    selection_textarea.value = JSON.stringify(edit_selection, undefined, 2)
    selectionDiv.innerText = JSON.stringify(selection, undefined, 2)
}

// Create 'named project selection' to switch between.
function storeNamedSelection(name) {

    if (!named_selection[name]) {
        let option = document.createElement('option')
        option.setAttribute('value',name)
        option.setAttribute('id',`namedSelectionOption_${name}`)
        option.text = name
        let dropdown = document.getElementById('named_selection')
        dropdown.appendChild(option)
        dropdown.disabled = false
    }

    named_selection[name] = selection
    
    setCookie('tcNamedSelection',JSON.stringify(named_selection),365)

}

// Remove 'named project selection'.
function removeNamedSelection(name) {

    if (name == 'none') {
        return
    }

    let dropdown = document.getElementById('named_selection')
    let option = dropdown.namedItem(`namedSelectionOption_${name}`)
    dropdown.removeChild(option)

    if (dropdown.length < 2)
        dropdown.disabled = true

    delete named_selection[`'${name}'`]
    console.log(JSON.stringify(named_selection, undefined, 2))
    
    setCookie('tcNamedSelection',JSON.stringify(named_selection),365)

}

function setCookie(cname, cvalue, exdays) {
    const d = new Date()
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))
    const expires = "expires="+d.toUTCString()
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;SameSite=None;Secure"
}
  
function getCookie(cname) {
    const name = cname + '='
    const ca = document.cookie.split(';')
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) == ' ') {
            c = c.substring(1)
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length)
        }
    }
    return ''
}