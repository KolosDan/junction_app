// Setup

function check_form_2() {
    event.preventDefault();
    let email__ = document.getElementById("email").value
    document.getElementById("body").innerHTML = `
            <p>Choose report frequency:</p>
            <form id="form3">
            <div>
                <input type="radio" id="week" name="freq">
                <label for="adult">Every week</label>
            </div>
            <div>
                <input type="radio" id="day" name="freq">
                <label for="adult">Every day</label>
            </div>
            <div>
                <input type="radio" id="twelve" name="freq">
                <label for="adult">Every 12 hours</label>
            </div>
            <div>
                <input type="radio" id="six" name="freq">
                <label for="adult">Every 6 hours</label>
            </div>
            <button type="submit" >Submit</button>
            </form>`
    chrome.storage.local.set({ settings: { reciever: email__, update_frequency: 0, password: "" } })

    document.getElementById('form3').addEventListener('submit', check_form_3);
}

function check_form_3() {
    event.preventDefault();
    let freq = 0;
    if (document.getElementById("six").checked) {
        freq = 6;
    }
    else if (document.getElementById("twelve").checked) {
        freq = 12;
    }
    else if (document.getElementById("day").checked) {
        freq = 24;
    }
    else if (document.getElementById("week").checked) {
        freq = 72;
    }
    document.getElementById("body").innerHTML = `
            <p>Enter your password:</p>
            <form id="form4">
            <div>
                <input type="password" id="passwd" type="text">
                <label for="passwd">Password</label>
            </div>

            <button type="submit" >Submit</button>
            </form>`

    chrome.storage.local.get('settings', function (data) {
        chrome.storage.local.set({
            settings: {
                reciever: data["settings"]["reciever"], update_frequency: freq, password: ""
            }
        })
    })
    document.getElementById('form4').addEventListener('submit', check_form_4);
}

function check_form_4() {
    event.preventDefault();
    var shaObj = new jsSHA("SHA-256", "TEXT");
    shaObj.update(document.getElementById("passwd").value);

    chrome.storage.local.get('settings', function (data) {
        chrome.storage.local.set({
            settings: {
                reciever: data["settings"]["reciever"], update_frequency: data["settings"]["update_frequency"], password: shaObj.getHash("HEX")
            }
        })
    })
}

function check_config() {
    chrome.storage.local.get('settings', function (settings) {
        if (Object.keys(settings).length === 0) {
            chrome.storage.local.set({ settings: {} })
        }
        else if (Object.keys(settings["settings"]).length !== 0) {
            document.getElementById("body").innerHTML += `
            <p>Enter your password:</p>
            <form id="login">
            <div>
                <input id="check_pwd" type="password">
                <label for="email">Passsword</label>
            </div>
            <button type="submit" >Submit</button>
            </form>`
            document.getElementById('login').addEventListener('submit', login);
        }
        else {
            document.getElementById("body").innerHTML += `
            <p>Enter your email:</p>
            <form id="form2">
            <div>
                <input id="email" type="text">
                <label for="email">Email</label>
            </div>
        
            <button type="submit" >Submit</button>
            </form>`
            document.getElementById('form2').addEventListener('submit', check_form_2);
        }
    })
}

// Dashboard

function login() {
    event.preventDefault();
    var shaObj = new jsSHA("SHA-256", "TEXT");
    shaObj.update(document.getElementById("check_pwd").value);
    chrome.storage.local.get('settings', function (data) {
        if (data["settings"]["password"] === shaObj.getHash("HEX")) {
            document.getElementById("body").innerHTML = `
            <h2>Dashboard</h2>
            <button id="edit-settings" style="display:block; margin: 5px" onlcick="" >Edit settings</button>
            <button id="charts" style="display:block; margin: 5px" onlcick="" >Charts</button>
            <button id="start-stop" style="display:block; margin: 5px" onlcick="" >Stop monitoring</button>`
            document.getElementById("edit-settings").addEventListener("click", edit_settings);
        }
        else {
            document.getElementById("check_pwd").innerHTML = "";
            alert("Incorrect password!")
        }
    })
}

function edit_settings() {
    document.getElementById("body").innerHTML = `
            <h2>Edit settings:</h2>
            <p>Change password</p>
            <form id="update_pwd">
            <div>
                <input type="password" id="passwd_new">
                <label for="passwd">New password</label>
            </div>
            <button type="submit" >Update</button>
            </form>
            <p>Change email</p>
            <form id="update_email">
            <div>
                <input id="email_new" type="text">
                <label for="passwd">New email</label>
            </div>
            <button type="submit">Update</button>
            </form>`
}



document.addEventListener("DOMContentLoaded", check_config, true);