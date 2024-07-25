// Only call these once in whole module!
const bot = getBot();
const gui = getGui();

let autoPosition = false;
let autoLeave = false;

// [REQUIRED] This gets called when the module config is saved
function onSave() {
    // return json with data to be saved
    const config = {}
    return JSON.stringify(config)
}

// This gets called when the config menu is opened. Only put gui related code here dont put any thread blocking code here!
function onRender() {
    gui.roundedTitleChild("General", new vector2(200, 200), () => {
        if (gui.normalCheckbox("Auto Position", autoPosition)) {
            autoPosition = !autoPosition
        }
        gui.normalTooltip("If enabled, the bot will automatically stay close to player groups");
        if (gui.normalCheckbox(""))
    });
}

// [REQUIRED] You can load the config here, this should be called at start in main function
function loadConfig(configJsonStr) {
    if (configJsonStr) {
        const config = JSON.parse(configJsonStr)
    }
}

// [REQUIRED] This gets called when the module is enabled
function main(configJsonStr) {
    loadConfig(configJsonStr)

    if (bot.state == state.disconnected) {
        if (bot.connectSync() == false) {
            errorOccurred("Failed to connect to bot (sync timeout)")
            return
        }
    }
}


function errorOccurred(message) {
    console.log(message)
    disable()
}