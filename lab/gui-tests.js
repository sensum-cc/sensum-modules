// This is test modulee for gui testing

/*Module Config
name|My Module
description|Module description
version|1.0.0
title|My Module
author|Sensum
category|Autofarm
Module Config*/

const gui = getGui();
const bot = getBot();

let checkbox1 = false;
let textInput1 = "";

function render() {
    gui.child("child_1", new Vector2(200, 200), () => {
        gui.text('Hello World!');
        if (gui.checkbox("Checkbox 1", checkbox1))
        {
            checkbox1 = !checkbox1;
        }
        textInput1 = gui.textInput("text_input_id", "text input hint", textInput1, 100, 180);
    });
    gui.sameLine();
    gui.setPos(new Vector2(5, 0));
    gui.childCategory("Child Title", new Vector2(200, 200), () => {
        if (gui.primaryButton("Primary Button"))
        {
            print('Primary Button Pressed!')
        }
        gui.setPos(new Vector2(0,5));
        if (gui.secondaryButton("Secondary Button"))
        {
            print('Secondary Button Pressed!')
        }
    })
}