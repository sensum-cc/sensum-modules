// Only call these once in whole module!
const bot = getBot();
const gui = getGui();

const emotes = ["/kiss", "/wave", "/cheer", "/shy", "/troll"]; // Only add emotes what dont add to growtopia's spam detect heat level

let autoPosition = false;
let autoLeave = false;
let randomEmote = false;
let autoReconnect = false;
let waitTimeInput = "15";
let spamIntervalInput = "7000";
let worldInput = "";
let macroRecordJson = null;

let spamTexts = [];

// not saved variables
let newSpamTextInput = "";
let selectedSpamTexts = [];
let paused = false;
let reconnectRetries = 0;
let spamDetected = false;


// [REQUIRED] This gets called when the module config is saved
function onSave() {
    // return json with data to be saved
    const config = {
        autoPosition: autoPosition,
        autoLeave: autoLeave,
        randomEmote: randomEmote,
        autoReconnect: autoReconnect,
        waitTimeInput: waitTimeInput,
        worldInput: worldInput,
        macroRecordJson: macroRecordJson,
        spamTexts: spamTexts
    }
    return JSON.stringify(config)
}

// This gets called when the config menu is opened. Only put gui related code here dont put any thread blocking code here!
function onRender() {
    gui.roundedTitleChild("General", new vector2(283, 245), () => {
        if (gui.normalCheckbox("Auto Position", autoPosition)) {
            autoPosition = !autoPosition
        }
        gui.normalTooltip("If enabled, the bot will automatically stay close to player groups");
        if (gui.normalCheckbox("Auto Reconnect", autoReconnect)) {
            autoReconnect = !autoReconnect
        }
        gui.normalTooltip("If enabled, the bot will automatically try reconnect if disconnected");
        if (gui.normalCheckbox("Random Emote", randomEmote)) {
            randomEmote = !randomEmote
        }
        gui.normalTooltip("If enabled, the bot will do random emotes between spam text's");
        if (gui.normalCheckbox("Atuo Leave", autoLeave)) {
            autoLeave = !autoLeave
        }
        gui.normalTooltip("If enabled, the bot will automatically leave the world if admin joins and will continue again after admin leaves");
        waitTimeInput = gui.textInputWithHint('Wait Time', 'enter wait time in seconds', waitTimeInput, 5, new vector2(5, 5), 230)
        gui.normalTooltip("Seconds to wait before rejoining the world to check if admin is still there");
        worldInput = gui.textInputWithHint('World Name', 'enter world to spam in', worldInput, 64, new vector2(5, 5), 230)
    });
    gui.sameLine();
    gui.roundedTitleChild("Spam Texts", new vector2(283, 380), () => {
        newSpamTextInput =  gui.textInputWithHint('##New spam text', 'enter spam text', newSpamTextInput, 120, new vector2(5, 5), 210)
        gui.sameLine();
        if (gui.normalButton("Add", new vector2(50, 27))) {
            if (newSpamTextInput.length > 0) {
                if (spamTexts == null){
                    spamTexts = []
                }
                spamTexts.push(newSpamTextInput)
                newSpamTextInput = ""
            }
        }
        gui.childWindow('spam_text_list', new vector2(270, 140), true, () => {
            spamTexts.forEach(text => {
                if (gui.selectableNormal(text, selectedSpamTexts.includes(text))) {
                    if (selectedSpamTexts.includes(text)) {
                        selectedSpamTexts = selectedSpamTexts.filter(e => e !== text)
                    }
                    else {
                        selectedSpamTexts.push(text)
                    }
                }
            })
        })
        if (gui.normalButton("Remove Selected", new vector2(132, 27))) {
            spamTexts = spamTexts.filter(e => !selectedSpamTexts.includes(e))
            selectedSpamTexts = []
        }
        gui.sameLine();
        if (gui.normalButton("Clear All", new vector2(132, 27))) {
            spamTexts = []
        }
        spamIntervalInput = gui.textInputWithHint('Spam Interval', 'enter spam interval in milliseconds', spamIntervalInput, 16, new vector2(5, 5), 273)
        gui.normalTooltip("Milliseconds to wait between spamming messages");
    });
    gui.setPos(new vector2(0, -135))
    gui.roundedTitleChild("Macro", new vector2(283, 130), () => {
        let macroButtonText = bot.macroRecorder.isRecording() ? "Stop Recording" : "Start Recording"
        if (gui.normalButton(macroButtonText, new vector2(273, 30))) {
            if (bot.macroRecorder.isRecording()) {
                bot.macroRecorder.stop()
                macroRecordJson = bot.macroRecorder.getRecordsAsJson()
            }
            else {
                bot.macroRecorder.clearFilters()
                bot.macroRecorder.addTextContainsFilter("password_reply")
                bot.macroRecorder.addGamePacketTypeFilter(0)
                bot.macroRecorder.addGamePacketTypeFilter(7)
                bot.macroRecorder.record()
            }
        }
        gui.normalTooltip('Record bot actions what then gets played back when bot joins spam world');
        if (gui.normalButton('Reset Macro', new vector2(273, 30))) {
            macroRecordJson = null
            gui.notification('Macro resetted')
        }
        gui.normalTooltip('Record bot actions what then gets played back when bot joins spam world');
    });
}

// [REQUIRED] You can load the config here, this should be called at start in main function
function loadConfig(configJsonStr) {
    if (configJsonStr) {
        const config = JSON.parse(configJsonStr)
        autoPosition = config.autoPosition
        autoLeave = config.autoLeave
        randomEmote = config.randomEmote
        autoReconnect = config.autoReconnect
        waitTimeInput = config.waitTimeInput
        worldInput = config.worldInput
        macroRecordJson = config.macroRecordJson
        spamTexts = config.spamTexts
    }
}

// [REQUIRED] This gets called when the module is enabled
function main(configJsonStr) {
    loadConfig(configJsonStr)
    
    hookCallback('onVariantFunction', 'onVariantFunction')
    hookCallback('onPlayerJoined', 'onPlayerJoined')
    hookCallback('onDisconnect', 'onDisconnect')

    const waitTime = parseInt(waitTimeInput)
    if (isNaN(waitTime)) {
        gui.notification("Wait time is not a number")
        errorOccurred("Wait time is not a number")
        return
    }

    const spamInterval = parseInt(spamIntervalInput)
    if (isNaN(spamInterval)) {
        gui.notification("Spam interval is not a number")
        errorOccurred("Spam interval is not a number")
        return
    }
    
    if (worldInput == ""){
        errorOccurred("World name is not set")
        return
    }

    if (bot.state == clientState.disconnected) {
        if (bot.connectSync() == false) {
            errorOccurred("Failed to connect to bot (sync timeout)")
            return
        }
    }

    sleep(1200)

    if (bot.world.name == null || bot.world.name.toLowerCase() != worldInput.toLowerCase()) {
        if (bot.joinWorldSync(worldInput) == false) {
            errorOccurred("Failed to join world")
            return
        }
    }
    else {
        console.log("Already in world")
    }

    sleep(1200)

    if (macroRecordJson) {
        const macroData = bot.macroRecorder.getRecordsFromJson(macroRecordJson)
        bot.macroRecorder.play(macroData)
    }

    if (autoPosition) {
        console.log("Auto Position enabled, getting group position")
        const selectedTilePos = getGroupPos()
        if (selectedTilePos == null) {
            errorOccurred("Failed to get group position")
            return
        }

        console.log(`Got target pos: ${selectedTilePos.x}, ${selectedTilePos.y}`)
        if (bot.findPath(selectedTilePos) == false) {
            errorOccurred("Failed to find path to group position")
            return
        }
    }

    sleep(400)

    const dividedInterval = spamInterval / 2

    while (isEnabled()) {
        const isSpamDetected = getValueFromMainEngine("spamDetected")
        const isPaused = getValueFromMainEngine("paused")
        if (isPaused || isSpamDetected) {
            sleep(1000)
            continue
        }
        spamTexts.forEach(text => {
            if (isSpamDetected || isPaused) return
            if (randomEmote) {
                bot.say(emotes[Math.floor(Math.random() * emotes.length)])
            }
            bot.setIcon(iconState.chat);
            sleep(dividedInterval)
            bot.say(text)
            bot.setIcon(iconState.none)
            sleep(dividedInterval)
            if (isEnabled() == false) return
        })
    }
}

function onVariantFunction(variant) {
    const mainPause = getValueFromMainEngine("spamDetected")
    if (mainPause) return
    if (variant.function == variantFunction.onConsoleMessage) {
        const text = variant.getString(0)
        if (text.includes(">>") && text.includes("Spam detected!")) {
            setValueToMainEngine("spamDetected", true)
            console.log("Spam detected, pausing")
            sleep(9000)
            setValueToMainEngine("spamDetected", false)
        }
    }
}

function onPlayerJoined(player) {
    if (autoLeave == false) return
    const mainPause = getValueFromMainEngine("paused")
    if (mainPause) return
    if (player.isNameOwner || player.isNameAdmin) {
        setValueToMainEngine("paused", true)
        console.log("Admin is in world, leaving world")
        while (isEnabled()) {
            bot.leaveWorld()
            sleep(parseInt(waitTimeInput) * 1000)
            if (bot.joinWorldSync(worldInput) == false) {
                errorOccurred("Failed to join world")
                return
            }
            sleep(500)
            const players = bot.getPlayers()
            let adminLeft = true
            players.forEach(player => {
                if (player.isNameOwner || player.isNameAdmin) {
                    adminLeft = false
                    return
                }
            })
            if (adminLeft) {
                paused = false
                break
            }
        }

        if (isEnabled() == false) {
            return
        }
        if (macroRecordJson) {
            const macroData = bot.macroRecorder.getRecordsFromJson(macroRecordJson)
            bot.macroRecorder.play(macroData)
        }
    
        if (autoPosition) {
            console.log("Auto Position enabled, getting group position")
            const selectedTilePos = getGroupPos()
            if (selectedTilePos == null) {
                errorOccurred("Failed to get group position")
                return
            }
    
            console.log(`Got target pos: ${selectedTilePos.x}, ${selectedTilePos.y}`)
            if (bot.findPath(selectedTilePos) == false) {
                errorOccurred("Failed to find path to group position")
                return
            }
        }
    
        sleep(400)
        setValueToMainEngine("paused", false)
    }
}

function onDisconnect() {
    console.log("Disconnected")
    if (autoReconnect) {
        while (isEnabled()) {
            setValueToMainEngine("paused", true)
            console.log("Trying to reconnect in 5 seconds")
            sleep(5000)
            if (bot.connectSync() == false) {
                reconnectRetries++
                if (reconnectRetries > 3) {
                    errorOccurred("Failed to reconnect")
                    return
                }
                continue
            }
            reconnectRetries = 0

            if (bot.world.name == null || bot.world.name.toLowerCase() != worldInput.toLowerCase()) {
                if (bot.joinWorldSync(worldInput) == false) {
                    errorOccurred("Failed to join world")
                    return
                }
            }
            sleep(1200)

            if (macroRecordJson) {
                const macroData = bot.macroRecorder.getRecordsFromJson(macroRecordJson)
                bot.macroRecorder.play(macroData)
            }
        
            if (autoPosition) {
                console.log("Auto Position enabled, getting group position")
                const selectedTilePos = getGroupPos()
                if (selectedTilePos == null) {
                    errorOccurred("Failed to get group position")
                    return
                }
        
                console.log(`Got target pos: ${selectedTilePos.x}, ${selectedTilePos.y}`)
                if (bot.findPath(selectedTilePos) == false) {
                    errorOccurred("Failed to find path to group position")
                    return
                }
            }
        
            sleep(400)
            setValueToMainEngine("paused", false)
            break
        }
    }
    else {
        errorOccurred("Disconnected and autoReconnect wasn't enabled")
    }
}

// Can return null
function getGroupPos() {
    let selectedPlayer = null
    let selectedPlayerGroupCount = -1
    const players = bot.getPlayers()
    for (let i = 0; i < players.length; i++) {
        const parentPlayer = players[i]
        let playersAround = 0
        if (parentPlayer.isBot) continue
        for (let j = 0; j < players.length; j++) {
            const childPlayer = players[j]
            if (childPlayer.isBot) continue
            if (childPlayer == parentPlayer) continue
            if (isInside(parentPlayer.tilePos, 5, childPlayer.tilePos)) {
                playersAround++
            }
        }
        if (playersAround > selectedPlayerGroupCount && bot.canFindPath(parentPlayer.tilePos)) {
            selectedPlayerGroupCount = playersAround
            selectedPlayer = parentPlayer
        }
    }

    return selectedPlayer.tilePos
}

function isInside(circle, rad, circle2) {
    return (circle2.x - circle.x) * (circle2.x - circle.x) + (circle2.y - circle.y) * (circle2.y - circle.y) <= rad * rad;
}

function errorOccurred(message) {
    console.log(message)
    disable()
}