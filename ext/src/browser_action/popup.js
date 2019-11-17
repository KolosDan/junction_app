// Setup
let is_gathering = true;

setInterval(() => { chrome.storage.local.get('settings', function (settings) { console.log(settings["settings"]) }) }, 5000);


function check_form_2() {
    event.preventDefault();
    let email__ = document.getElementById("email").value
    document.getElementById("body").innerHTML = `
            <p><strong>Choose report frequency:</strong></p>
            <form id="form3">
            <div class="form-group ">
                <input type="radio" id="week" name="freq">
                <label for="adult">Every week</label>
            </div>
            <div class="form-group ">
                <input type="radio" id="day" name="freq">
                <label for="adult">Every day</label>
            </div>
            <div class="form-group ">
                <input type="radio" id="twelve" name="freq">
                <label for="adult">Every 12 hours</label>
            </div>
            <div class="form-group ">
                <input type="radio" id="six" name="freq">
                <label for="adult">Every 6 hours</label>
            </div>
            <button class="btn btn-primary btn-block" type="submit" >Submit</button>
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
            <p><strong>Enter your password:</strong></p>
            <form id="form4">
            <div class="form-group ">
                <input class="form-control form-control-sm" type="password" id="passwd" placeholder="Password">
            </div>
            <button  class="btn btn-primary btn-block" type="submit" >Submit</button>
            </form>`

    chrome.storage.local.get('settings', function (data) {
        chrome.storage.local.set({
            settings: {
                reciever: data["settings"]["reciever"], update_frequency: freq, password: "", date : new Date
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
                reciever: data["settings"]["reciever"], update_frequency: data["settings"]["update_frequency"], password: shaObj.getHash("HEX"), date : data["settings"]["date"]
            }
        })
    })
    get_back();
}

function check_config() {
    chrome.storage.local.get('settings', function (settings) {
        if (Object.keys(settings).length === 0) {
            chrome.storage.local.set({ settings: {} })
        }
        else if (Object.keys(settings["settings"]).length !== 0) {
            document.getElementById("body").innerHTML += `
            <p><strong>Enter your password:</strong></p>
            <form id="login">
            <div class="form-group ">
                <input class="form-control form-control-sm" id="check_pwd" type="password" placeholder="Password">
            </div>
            <button class="btn btn-primary btn-block" style="margin-top:5px" type="submit" >Submit</button>
            </form>`
            document.getElementById('login').addEventListener('submit', login);
        }
        else {
            document.getElementById("body").innerHTML += `
            <p><strong>Enter your email:</strong></p>
            <form id="form2">
            <div class="form-group ">
                <input class="form-control form-control-sm"  id="email" type="text" placeholder="Email">
            </div>
        
            <button class="btn btn-primary btn-block"  type="submit" >Submit</button>
            </form>`
            document.getElementById('form2').addEventListener('submit', check_form_2);
        }
    })
}

// Dashboard

function login() {
    event.preventDefault();
    document.body.style.minWidth = "350px";
    var shaObj = new jsSHA("SHA-256", "TEXT");
    shaObj.update(document.getElementById("check_pwd").value);
    chrome.storage.local.get('settings', function (data) {
        if (data["settings"]["password"] === shaObj.getHash("HEX")) {
            document.getElementById("body").innerHTML = `
            <h3 style="text-align:center">Dashboard</h3>
            <div class="form-group">
            <button class="btn btn-primary btn-block" id="edit-settings" style="display:block; margin: 5px" >Edit settings</button>
            <button class="btn btn-primary btn-block" id="charts" style="display:block; margin: 5px" >Charts</button>
            <button class="btn btn-primary btn-block" id="sent_charts" style="display:block; margin: 5px" >Sentiment</button>
            <button class="btn btn-primary btn-block" id="daily" style="display:block; margin: 5px" >Daily</button>
            <button class="btn btn-primary btn-block" id="sent_email" style="display:block; margin: 5px" >Send email</button>
            <button class="btn btn-primary btn-block" id="start-stop" style="display:block; margin: 5px" >Stop monitoring</button>
            </div>`

            document.getElementById("edit-settings").addEventListener("click", edit_settings);
            document.getElementById("charts").addEventListener("click", display_charts);
            document.getElementById("start-stop").addEventListener("click", start_stop);
            document.getElementById("daily").addEventListener("click", display_recommendations);
            document.getElementById("sent_email").addEventListener("click", sent_email);
            document.getElementById("sent_charts").addEventListener("click", display_sent_charts);
        }
        else {
            document.getElementById("check_pwd").innerHTML = "";
            alert("Incorrect password!")
        }
    })
}

function sent_email() {
    chrome.runtime.sendMessage({
        type: "send_email"
    });
}

function get_back() {
    document.body.style.minWidth = "350px";
    document.getElementById("body").innerHTML = `
    <h3 style="text-align:center">Dashboard</h3>
    <div class="form-group">
    <button class="btn btn-primary btn-block" id="edit-settings" style="display:block; margin: 5px" >Edit settings</button>
    <button class="btn btn-primary btn-block" id="charts" style="display:block; margin: 5px" >Charts</button>
    <button class="btn btn-primary btn-block" id="sent_charts" style="display:block; margin: 5px" >Sentiment</button>
    <button class="btn btn-primary btn-block" id="daily" style="display:block; margin: 5px" >Daily</button>
    <button class="btn btn-primary btn-block" id="start-stop" style="display:block; margin: 5px" >Stop monitoring</button>
    </div>`
    document.getElementById("edit-settings").addEventListener("click", edit_settings);
    document.getElementById("charts").addEventListener("click", display_charts);
    document.getElementById("sent_charts").addEventListener("click", display_sent_charts);
    document.getElementById("daily").addEventListener("click", display_recommendations);
    document.getElementById("start-stop").addEventListener("click", start_stop);
}


function edit_settings() {
    document.body.style.minWidth = "350px";
    document.getElementById("body").innerHTML = `
            <p><strong>Edit settings:<strong></p>
            <div class="form-group">
            <button class="btn btn-primary btn-block" style="margin-top:5px" id="u_pwd" >Change password</button>
            <button class="btn btn-primary btn-block" style="margin-top:5px" id="u_email" >Change email</button>
            <button class="btn btn-primary btn-block" style="margin-top:5px" id="u_freq" >Change email frequency</button>
            <button type="button" class="btn btn-secondary btn-block" id="back" style="margin-top: 5px">Back</button>
            </div>
            `
    document.getElementById("back").addEventListener("click", get_back);
    document.getElementById("u_pwd").addEventListener("click", update_pwd__);
    document.getElementById("u_email").addEventListener("click", update_email__);
    document.getElementById("u_freq").addEventListener("click", update_freq__);
}

function update_freq__() {
    document.getElementById("body").innerHTML = `
    <p><strong>Choose report frequency:</strong></p>
    <form id="update_freq">
    <div class="form-group ">
        <input type="radio" id="week" name="freq">
        <label for="adult">Every week</label>
    </div>
    <div class="form-group ">
        <input type="radio" id="day" name="freq">
        <label for="adult">Every day</label>
    </div>
    <div class="form-group ">
        <input type="radio" id="twelve" name="freq">
        <label for="adult">Every 12 hours</label>
    </div>
    <div class="form-group ">
        <input type="radio" id="six" name="freq">
        <label for="adult">Every 6 hours</label>
    </div>
    <button class="btn btn-primary btn-block" type="submit" >Submit</button>
    <button type="button" class="btn btn-secondary btn-block" id="back" style="margin-top: 5px">Back</button>
    </form>`
    document.getElementById('update_freq').addEventListener('submit', update_freq);
    document.getElementById("back").addEventListener("click", get_back);
}

function update_pwd__() {
    document.getElementById("body").innerHTML = `
    <p><strong>Enter new password:<strong></p>
    <form id="update_pwd">
    <div class="form-group">
        <input class="form-control form-control-sm" type="password" id="passwd_new" placeholder="New password">
        <button class="btn btn-primary btn-block" style="margin-top:5px" type="submit" >Update</button>
    <button type="button" class="btn btn-secondary btn-block" id="back" style="margin-top: 5px">Back</button>
    </div>
    </form>
    `
    document.getElementById('update_pwd').addEventListener('submit', update_pwd);
    document.getElementById("back").addEventListener("click", get_back);
}

function update_email__() {
    chrome.storage.local.get('settings', function (data) {
        document.getElementById("body").innerHTML = `
    <p><strong>Current email: ${data["settings"]["reciever"]}</strong></p>
    <form id="update_email">
    <div class="form-group">
        <input class="form-control form-control-sm" id="email_new" type="text" placeholder="New email">
        <button class="btn btn-primary btn-block" style="display:inline;margin-top:5px" type="submit">Update</button>
    <button type="button" class="btn btn-secondary btn-block" id="back" style="margin-top: 5px">Back</button>
    </div>
    </form>`
        document.getElementById('update_email').addEventListener('submit', update_email);
        document.getElementById("back").addEventListener("click", get_back);
    })
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === "display_charts") {
            document.getElementById("body").innerHTML = `
            <h2 id="chart_div"><strong >Chart statistics</strong></h2>
            <button type="button" class="btn btn-secondary btn-block" id="back" style="margin-top: 5px">Back</button>`
            document.getElementById("back").addEventListener("click", get_back);
            let json = JSON.parse(request.data)["result"];
            for (chart in json) {
                document.getElementById('chart_div').innerHTML += "<br>";
                document.getElementById('chart_div').innerHTML += chart;
                document.getElementById('chart_div').innerHTML += "<br>";
                document.getElementById('chart_div').innerHTML += json[chart];
            }
        }
        else if (request.type === "display_recommendations") {
            document.getElementById("body").innerHTML = `${JSON.parse(request.data)["result"]}
            <button type="button" class="btn btn-secondary btn-block" id="back" style="margin-top: 5px">Back</button>`
            document.getElementById("back").addEventListener("click", get_back);
        }
        else if (request.type === "email") {
            alert(request.data)
        }
    })

function display_charts() {
    document.getElementById("body").innerHTML = `
    <h5 style="font-size:24px;text-align:center"><strong>Loading...</strong><div class="spinner-border" role="status">
    <span class="sr-only">Loading...</span>
    </div></h5>

    `
    document.body.style.minWidth = "550px";
    chrome.runtime.sendMessage({
        type: "chart"
    });
}

function display_sent_charts() {
    document.getElementById("body").innerHTML = `
    <h5 style="font-size:24px;text-align:center"><strong>Loading...</strong><div class="spinner-border" role="status">
    <span class="sr-only">Loading...</span>
    </div></h5>
    `
    document.body.style.minWidth = "550px";
    chrome.runtime.sendMessage({
        type: "sent_chart"
    });
}

function display_recommendations() {
    document.getElementById("body").innerHTML = `
    <h5 style="font-size:24px;text-align:center"><strong>Loading...</strong><div class="spinner-border" role="status">
    <span class="sr-only">Loading...</span>
    </div></h5>
    `
    document.body.style.minWidth = "350px";
    chrome.runtime.sendMessage({
        type: "sent_recommend"
    });
}

function start_stop() {
    is_gathering = !is_gathering;
    is_gathering ? alert("Started") : alert("Stopped");
    chrome.runtime.sendMessage({
        type: "gather"
    });
}

function update_pwd() {
    event.preventDefault();
    var shaObj = new jsSHA("SHA-256", "TEXT");
    shaObj.update(document.getElementById("passwd_new").value);

    chrome.storage.local.get('settings', function (data) {
        chrome.storage.local.set({
            settings: {
                reciever: data["settings"]["reciever"], update_frequency: data["settings"]["update_frequency"], password: shaObj.getHash("HEX"), date : data["settings"]["date"]
            }
        })
    })
    document.getElementById("body").innerHTML = `
            <p><strong>Edit settings:<strong></p>
            <button class="btn btn-primary btn-block" style="margin-top:5px" id="u_pwd" >Change password</button>
            <button class="btn btn-primary btn-block" style="margin-top:5px" id="u_email" >Change email</button>
            <button type="button" class="btn btn-secondary btn-block" id="back" style="margin-top: 5px">Back</button>
            `
    document.getElementById("back").addEventListener("click", get_back);
    document.getElementById("u_pwd").addEventListener("click", update_pwd__);
    document.getElementById("u_email").addEventListener("click", update_email__);
}

function update_email() {
    let new_email = document.getElementById("email_new").value;
    chrome.storage.local.get('settings', function (data) {
        chrome.storage.local.set({
            settings: {
                reciever: new_email,
                update_frequency: data["settings"]["update_frequency"], password: data["settings"]["password"],  date : data["settings"]["date"]
            }
        })
    })
    document.getElementById("body").innerHTML = `
            <p><strong>Edit settings:<strong></p>
            <button class="btn btn-primary btn-block" style="margin-top:5px" id="u_pwd" >Change password</button>
            <button class="btn btn-primary btn-block" style="margin-top:5px" id="u_email" >Change email</button>
            <button type="button" class="btn btn-secondary btn-block" id="back" style="margin-top: 5px">Back</button>
            `
    document.getElementById("back").addEventListener("click", get_back);
    document.getElementById("u_pwd").addEventListener("click", update_pwd__);
    document.getElementById("u_email").addEventListener("click", update_email__);
}

function update_freq() {
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
    chrome.storage.local.get('settings', function (data) {
        chrome.storage.local.set({
            settings: {
                reciever: data["settings"]["reciever"],
                update_frequency: freq, password: data["settings"]["password"], date : data["settings"]["date"]
            }
        })
    })
    document.getElementById("body").innerHTML = `
            <p><strong>Edit settings:<strong></p>
            <button class="btn btn-primary btn-block" style="margin-top:5px" id="u_pwd" >Change password</button>
            <button class="btn btn-primary btn-block" style="margin-top:5px" id="u_email" >Change email</button>
            <button class="btn btn-primary btn-block" style="margin-top:5px" id="u_freq" >Change email frequency</button>
            <button type="button" class="btn btn-secondary btn-block" id="back" style="margin-top: 5px">Back</button>
            `
    document.getElementById("back").addEventListener("click", get_back);
    document.getElementById("u_pwd").addEventListener("click", update_pwd__);
    document.getElementById("u_email").addEventListener("click", update_email__);
    document.getElementById("u_freq").addEventListener("click", update_freq__);
}


document.addEventListener("DOMContentLoaded", check_config, true);