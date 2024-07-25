// Only call these once in whole module!
const bot = getBot();
const gui = getGui();

let numTest = 0;
// This module is purely used just to test stuff

// [REQUIRED] This gets called when the module config is saved
function onSave() {
    // return json with data to be saved
    const config = {}
    return JSON.stringify(config)
}
// This gets called when the config menu is opened. Only put gui related code here dont put any thread blocking code here!
function onRender() {

}

// [REQUIRED] You can load the config here, this should be called at start in main function
function loadConfig(configJsonStr) {
    if (configJsonStr) {
        const config = JSON.parse(configJsonStr)
    }
}
// [REQUIRED] This gets called when the module is enabled
function main(configJsonStr) {
    loadConfig(configJsonStr);
    bot.disconnectedCallback = onDisconnected;
    bot.playerJoinedCallback = onPlayerJoined;
    while (true) {
        sleep(1000);
    }
}

function onPlayerJoined(player) {
    console.log("Player joined: " + player.name)
}

function onDisconnected() {
    console.log("Disconnected from server")
}