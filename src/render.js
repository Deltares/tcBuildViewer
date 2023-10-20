/* Render
/  
/  Data interpreted by data.js appended to index.html
/  
/  render all data received by query interpreted by data.js into index.html
/  Handle index.html display actions and input
*/

//Create a new element with given vars and return the created element
class render {

    createElement(ElementType, ElementClasses, ElementAttributes, textNode, parentElement, order){
        
        //Create a new element
        let newElement = document.createElement(ElementType)

        //Add classes to element for styling purposes
        if(ElementClasses) {
            for (let ElementClass of ElementClasses) {
                newElement.classList.add(ElementClass)
            }
        }
        //Add element attributes like title and onclick
        if (ElementAttributes) {
            Object.entries(ElementAttributes).forEach(([attr, value]) => {
                newElement.setAttribute(attr, value)
            })
        }
        //Add text to element
        if (textNode) {
            newElement.innerText = textNode
        }
        //For grid elements that are appended asynchronously add an order for consistent placements
        if (order) {
            newElement.style.order = order
        }
        //Append the created element as a child of specified parentelement
        parentElement.appendChild(newElement)

        return newElement
    }

    //Places an element as first of all the children within the parent.
    moveElementToTop(element, parent) {
        parent.insertBefore(element, parent.firstChild)
    }

    //Handle visible username and show/hide login box
    loginElement(username, hidden){
        document.getElementById('username').innerHTML = username

        if (hidden){
            document.getElementById('login').classList.add('hidden')
        }
        else{
            document.getElementById('login').classList.remove('hidden')
        }
    }

    // Show or hide all build types of which the last build was successful.
    toggleGreen() {

        let greenBuildTypes = document.querySelectorAll('#_projects .buildTypePart.SUCCESS')

        for (let item of greenBuildTypes) {
            item.classList.toggle('hideGreen')
        }

    }

    // Show or hide all build types of which the status has not changed.
    toggleUnchangedBuildTypes() {

        let unchangedBuildTypes = document.querySelectorAll('#_projects .buildTypePart:not(.statusChanged)')

        for (let item of unchangedBuildTypes) {
            item.classList.toggle('hideNotChanged')
        }

    }

    // Update values for the time selection element
    timeElementSet(data) {

        document.getElementById('build_count').value = data.count
        document.getElementById('build_cutoff_days').value = data.cutoff_days
        document.getElementById('end_time').value = data.end_time
    }

    // Add a named selection option to the dropdown in JSON selection element
    addNameDropdown(name) {

        let attributes = {'id':`namedSelectionOption_${name}`,'value':name}
        let dropdown   = document.getElementById('named_selection')
        let option     = this.createElement('option', null, attributes, name, dropdown, null)
        dropdown.disabled = false
    }

    // Remove a named selection option to the dropdown in JSON selection element
    removeNameDropdown(name) {

        let dropdown = document.getElementById('named_selection')
        let option = dropdown.namedItem(`namedSelectionOption_${name}`)
        dropdown.removeChild(option)

        if (dropdown.length < 2)
            dropdown.disabled = true
    }

    //cleanup off all elements when (re)fetching data.
    cleanDataWrapper(important) {

        document.getElementById('_projects').innerHTML = ''

        document.getElementById('important_wrapper').innerHTML = ''

        document.getElementById('_important').hidden = !important
    }

    //Create elements for projects declared in the selection to append to.
    addParentProjectElements(includeProjects) {

        for (let project of includeProjects) {
            let elementClass = ['projectWrapper']
            let attributes   = {'id':`${project}_wrapper`}
            let element      = document.getElementById('_projects')
            Render.createElement('div', elementClass, attributes, null, element, null)
        }
    }

    //Clear absolute position placements to prevent overlapping where it shouldn't occur.
    addClearElement(element) {

        let clearElement = document.createElement('div')
        clearElement.style.clear = 'both'
        element.append(clearElement)
    }

    //Add specified stats text to html element
    updateProjectStats(projectId, suffix, text) {

        let element       = document.getElementById(`${projectId}_stats${suffix}`)
        let testStatsNode = document.createTextNode(text)
        element.replaceChildren(testStatsNode)
    }

    setupBuildDetails(buildId, buildTypeId, suffix) {

        let buildDetails = document.getElementById(`${buildTypeId}_buildSteps${suffix}`)
        buildDetails.innerHTML = ""
        buildDetails.classList.remove('hidden')

        //create onclick actions: toggle active button and hide elements that are not active
        let toggleActiveBtn = `this.parentElement.getElementsByClassName('active')[0].classList.remove('active')
            this.classList.add('active')`
        let showMessages    = `;this.parentElement.parentElement.getElementsByClassName('messages')[0].classList.remove('hidden')`
        let hideMessages    = `;this.parentElement.parentElement.getElementsByClassName('messages')[0].classList.add('hidden')`
        let showTests       = `;this.parentElement.parentElement.getElementsByClassName('tests')[0].classList.remove('hidden')`
        let hideTests       = `;this.parentElement.parentElement.getElementsByClassName('tests')[0].classList.add('hidden')`
        let showChanges     = `;this.parentElement.parentElement.getElementsByClassName('changes')[0].classList.remove('hidden')`
        let hideChanges     = `;this.parentElement.parentElement.getElementsByClassName('changes')[0].classList.add('hidden')`

        //create button container
        let buildButtonBar  = this.createElement('div', ['header', 'buildButtonBar'], null, null, buildDetails, null)

        //Create specific buttons for Logs, tests and changes
        let attributes = {'onclick': `${toggleActiveBtn}${showMessages}${hideTests}${hideChanges}`}
        this.createElement('button', ['toggle', 'active'], attributes, 'Important logs', buildButtonBar, null)

        attributes = {'onclick': `${toggleActiveBtn}${hideMessages}${showTests}${hideChanges}`}
        this.createElement('button', ['toggle'], attributes, 'Tests', buildButtonBar, null)

        attributes = {'onclick': `${toggleActiveBtn}${hideMessages}${hideTests}${showChanges}`}
        this.createElement('button', ['toggle'], attributes, 'Blame', buildButtonBar, null)

        attributes = {'onclick': `window.open('${teamcity_base_url}/viewLog.html?buildId=${buildId}&buildTypeId=${buildTypeId};','build_${buildId}','fullscreen=yes')`}
        this.createElement('button', null, attributes, 'Open in teamcity ⧉', buildButtonBar, null)

        attributes = {'onclick': `this.parentElement.parentElement.classList.add('hidden')`}
        this.createElement('button', null, attributes, 'Close', buildButtonBar, null)

        //Create Containers for messages, tests and changes
        let messageDiv = this.createElement('div', ['messages'], null, null, buildDetails, null)
        let testsDiv   = this.createElement('div', ['tests', 'hidden'], null, null, buildDetails, null)
        let changesDiv = this.createElement('div', ['changes', 'hidden'], null, null, buildDetails, null)

        let containers = {'message': messageDiv, 'tests': testsDiv, 'changes': changesDiv}
        return containers
    }

    //insert selection into html elements
    updateSelectionForm(selection, edit_selection) {

        if (edit_selection) {
            selection_textarea.value = JSON.stringify(edit_selection, undefined, 2)
        }

        if (selection) {
            const selectionDiv = document.getElementById('selection_code')
            selectionDiv.innerText = JSON.stringify(selection, undefined, 2)
        }
    }

    updateQueue(addition, number) {
        
        //get the container for queuecount
        let queueContainer = document.getElementById('queueCount')

        // Add or remove the specified number to queuecount
        if (addition) {
            queueCount += number
        } else {
            queueCount -= number
        }

        queueContainer.innerHTML = queueCount

        // Add a load icon as cursor when data is still loading
        if (queueCount < 1) {
            document.body.classList.remove('loading')
        } else {
            document.body.classList.add('loading')
        }
    }
}