import { BF } from './babylonStuff.js';

export class UI {
    static SPACING = '15px';
    
    // standard width height
    static STANDARDW = '200px';
    static STANDARDH = '40px';

    static SMALLW = '110px';
    static SMALLH = '30px';

    static SVWIDTH = '270px';
    static SVHEIGHT = '300px';
    static SVBARSIZE = 15;

    static SUBMENUW = '250px';

    static HOWTOTEXTW = '250px';
    static HOWTOTEXTH = '22px';
    static HOWTOTEXTSIZE = 18;

    static SLIDERHEADERH = '26px';
    static SLIDERH = '30px';

    // makes the main gui object
    static MakeGUI(canvas) {
        var gui = {}
        gui.texture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('gui');
    
        // make show/hide button
        gui.shButton = UI.MakeShowHideButton(gui);
        gui.muteButton = UI.MakeMuteButton(gui);

        // make main menu (can add submenus to main menu afterwords)
        gui.mainMenu = UI.MakeMainMenu(gui, canvas);
        gui.activeMenu = gui.mainMenu;
        gui.activeMenu.hide();
    
        gui.setActiveMenu = function(menu) {
            gui.activeMenu.hide(); // hide current active menu
            gui.activeMenu = menu;
            gui.activeMenu.show(); // show new active menu
        }

        gui.addControl = function(control) {
            gui.texture.addControl(control);
        }
    
        return gui;
    }

    // other constructors
    static MakeMainMenu(gui, canvas) {
        //name is string
        let mainMenu = {};
        mainMenu.name = 'main menu';
        mainMenu.panel = UI.MakePanel(true, true);
        gui.texture.addControl(mainMenu.panel);

        mainMenu.panel.top = 30;
        mainMenu.panel.background = 'black'

        mainMenu.controls = {}; // all controls are panels including spacer

        mainMenu.addControl = function(name, control, spacing = true) {
            mainMenu.controls[name] = UI.MakePanel();
            mainMenu.controls[name].control = control;
            if (spacing) {
                UI.AddControlsToTarget([UI.MakeVertSpacer(), control], mainMenu.controls[name]);
                mainMenu.panel.addControl(mainMenu.controls[name]);
            } else {
                UI.AddControlsToTarget([control], mainMenu.controls[name]);
                mainMenu.panel.addControl(mainMenu.controls[name]);
            }
        }

        mainMenu.addControls = function(names, controls, spacing = true) {
            for(var i = 0; i < controls.length; i++) {
                mainMenu.addControl(names[i], controls[i], spacing);
            }
        }

        mainMenu.getControl = function(name) {
            return mainMenu.controls[name].control;
        }

        mainMenu.addSubMenu = function(subMenu) {
            mainMenu.addControl(subMenu.name.concat('PB'), subMenu.parentButton);
        }
        
        mainMenu.addOneOfSubMenus = function(name, subMenus) {
            // for when only 1 parent button will be active at a time
            var oneOfPanel = UI.MakePanel();
            for(var i = 0; i < subMenus.length; i++) {
                oneOfPanel.addControl(subMenus[i].parentButton);
            }
            mainMenu.addControl(name, oneOfPanel);
        }

        mainMenu.show = function() {
            mainMenu.panel.isVisible = true;
        }

        mainMenu.hide = function() {
            mainMenu.panel.isVisible = false;
        }

        mainMenu.showControl = function(name) {
            mainMenu.controls[name].isVisible = true;
        }

        mainMenu.hideControl = function(name) {
            mainMenu.controls[name].isVisible = false;
        }

        mainMenu.setControlVisibility = function(name, isVisible) {
            mainMenu.controls[name].isVisible = isVisible;
        }

        var header = UI.MakeTextBlock(mainMenu.name, 30);
        UI.SetControlsWidthHeight([header], '200px', '50px');
        mainMenu.addControl('header', header);

        mainMenu.addControl('fsButton', UI.MakeFullscreenButton(canvas));

        return mainMenu;
    }

    static MakeSubMenu(name, parentMenu, gui, pbText = 'sim settings') {
        // basically same as main menu, but includes back button
        // parent is menu that the back button goes back to
        let menu = {};
        menu.name = name;

        menu.parentButton = UI.MakeParentButton(name.concat('parentButton'), pbText, menu, gui);

        menu.panel = UI.MakePanel(true, true);

        menu.headerPanel = UI.MakeSubMenuHeaderPanel(name, parentMenu, gui);
        UI.AddControlsToTarget([UI.MakeVertSpacer(), menu.headerPanel], menu.panel);

        menu.sv = UI.MakeScrollViewer();
        menu.panel.addControl(menu.sv);
        
        menu.svPanel = UI.MakePanel(true, false, false);
        //menu.svPanel.background = 'white';
        menu.svPanel.width = UI.SUBMENUW;
        menu.sv.addControl(menu.svPanel);

        menu.panel.top = 30;
        menu.controls = {};
        menu.panel.background = 'black'

        menu.addControl = function(name, control, spacing = true) {
            menu.controls[name] = UI.MakePanel();
            menu.controls[name].control = control;
            if (spacing) {
                UI.AddControlsToTarget([UI.MakeVertSpacer(), control], menu.controls[name]);
            } else {
                UI.AddControlsToTarget([control], menu.controls[name]);
            }
            menu.svPanel.addControl(menu.controls[name]);
        }

        menu.addControls = function(names, controls, spacing = true) {
            for(var i = 0; i < controls.length; i++) {
                menu.addControl(names[i], controls[i], spacing);
            }
        }

        menu.getControl = function(name) {
            return menu.controls[name].control;
        }

        menu.addSubMenu = function(subMenu) {
            menu.addControl(subMenu.name.concat('PB'), subMenu.parentButton);
        }

        menu.addOneOfSubMenus = function(name, subMenus) {
            // for when only 1 parent button will be active at a time
            var oneOfPanel = UI.MakePanel();
            for(var i = 0; i < subMenus.length; i++) {
                oneOfPanel.addControl(subMenus[i].parentButton);
            }
            menu.addControl(name, oneOfPanel);
        }

        menu.show = function() {
            menu.panel.isVisible = true;
        }

        menu.hide = function() {
            menu.panel.isVisible = false;
        }

        menu.showControl = function(name) {
            menu.controls[name].isVisible = true;
        }

        menu.hideControl = function(name) {
            menu.controls[name].isVisible = false;
        }

        menu.setControlVisibility = function(name, isVisible) {
            menu.controls[name].isVisible = isVisible;
        }

        menu.hide();
        gui.addControl(menu.panel);

        return menu;
    }

    static MakeAnimStateChooseAnimMenu(anims, gui) {
        // adds the caMenu to gui texture and adds the choose anim button to main menu
        var caMenu = UI.MakeSubMenu('simulations', gui.mainMenu, gui, 'choose simulation');
        var animKeys = Object.keys(anims);
        var animState = {anims: anims};
        animState.switchActiveAnim = function(animKey) {
            window.sounds.animChange.play();
            animState.activeAnim.deactivate();
            animState.activeAnim = animState.anims[animKey];
            animState.activeAnim.activate();
            caMenu.activeAnimButton.color = 'white';
            caMenu.activeAnimButton = animState.anims[animKey].aaButton;
            caMenu.activeAnimButton.color = 'green';
        }
        var animButtons = [];
        var animButtonNames = [];
        var animMenus = [];
        for(var i = 0; i < animKeys.length; i++) {
            if (i === 0) {
                animState.activeAnim = anims[animKeys[i]];
            } else {
                anims[animKeys[i]].deactivate();
            }
            animState.anims[animKeys[i]].aaButton = UI.MakeMenuActivateAnimButton(animKeys[i], animState)
            animButtons.push(animState.anims[animKeys[i]].aaButton);
            animButtonNames.push(animKeys[i].concat('PB'))
            animMenus.push(animState.anims[animKeys[i]].guiMenu);
        }
        caMenu.addControls(animButtonNames, animButtons);
        //add a property that holds the active sim button to change its color to highlight that its active
        caMenu.activeAnimButton = animButtons[0];
        caMenu.activeAnimButton.color = 'green';
        gui.mainMenu.addSubMenu(caMenu);
        gui.mainMenu.addOneOfSubMenus('animSettings', animMenus);
        return animState;
    }

    static MakeHowToMenu(gui) {
        var htMenu = UI.MakeSubMenu('how to use', gui.mainMenu, gui, 'how to use');
        var controls = [];

        var htText00 = UI.MakeTextBlock('move the viewer with', UI.HOWTOTEXTSIZE);
        var htText01 = UI.MakeTextBlock('W, A, S, and D keys', UI.HOWTOTEXTSIZE);
        var htText02 = UI.MakeTextBlock('spacebar moves viewer up', UI.HOWTOTEXTSIZE);
        var htText03 = UI.MakeTextBlock('and shift moves down', UI.HOWTOTEXTSIZE);
        htMenu.addControls(['spacer', 'htText00', 'htText01'], [UI.MakeVertSpacer(), htText00, htText01], false);
        htMenu.addControls(['spacer', 'htText02', 'htText03'], [UI.MakeVertSpacer(), htText02, htText03], false);
        controls.push(htText00, htText01, htText02, htText03);

        var htText10 = UI.MakeTextBlock('look around with', UI.HOWTOTEXTSIZE);
        var htText11 = UI.MakeTextBlock('I, J, K, and L keys', UI.HOWTOTEXTSIZE);
        htMenu.addControls(['spacer', 'htText10', 'htText11'], [UI.MakeVertSpacer(), htText10, htText11], false);
        controls.push(htText10, htText11);

        var htText20 = UI.MakeTextBlock('control field of view with', UI.HOWTOTEXTSIZE);
        var htText21 = UI.MakeTextBlock('9 and 0 (zero) keys', UI.HOWTOTEXTSIZE);
        htMenu.addControls(['spacer', 'htText20', 'htText21'], [UI.MakeVertSpacer(), htText20, htText21], false);
        controls.push(htText20, htText21);

        var htText30 = UI.MakeTextBlock('experiment with sim settings', UI.HOWTOTEXTSIZE);
        var htText31 = UI.MakeTextBlock('for each simulation', UI.HOWTOTEXTSIZE);
        htMenu.addControls(['spacer', 'htText30', 'htText31'], [UI.MakeVertSpacer(), htText30, htText31], false);
        controls.push(htText30, htText31);

        UI.SetControlsWidthHeight(controls, UI.HOWTOTEXTW, UI.HOWTOTEXTH);

        gui.mainMenu.addSubMenu(htMenu);
    }

    static MakeSubMenuHeaderPanel(menuName, parent, gui) {
        // returns subMenu header panel obj
        // has backbutton and headertext in a panel horizontally
        var headerPanel = UI.MakePanel(false);
        UI.AdaptContainerHeight(headerPanel);
        var backButton = UI.MakeBackButton(menuName.concat('BackButton'), parent, gui);
        var headerText = UI.MakeTextBlock(menuName, 28, 'white');
        headerText.height = '50px';
        headerText.width = '200px';
        UI.AddControlsToTarget([backButton, headerText], headerPanel);
        return headerPanel;
    }

    static MakeSliderPanel(headerText, unit, minVal, maxVal, initVal, valChangeFn) {
        // makes slider panel. header above slider.
        // header becomes 'headerText: val unit'
        // unit is string representing units ('degrees' or 'radians')
        // valChangeFn is function(value) that updates whatever the slider updates
        // valChangeFn does not need to change header as this is done here
        var sliderPanel = UI.MakePanel();
        UI.AdaptContainerWidth(sliderPanel);

        var header = UI.MakeTextBlock(headerText + ': ' + initVal + ' ' + unit, 20);
        header.height = UI.SLIDERHEADERH;
        header.width = '250px';


        var slider = new BABYLON.GUI.Slider();
        slider.minimum = minVal;
        slider.maximum = maxVal;
        slider.value = initVal;
        slider.onValueChangedObservable.add(function(value) {
            header.text = headerText + ': ' + math.round(10*value)/10 + ' ' + unit;
            valChangeFn(value);
        });
        slider.height = UI.SLIDERH;
        slider.width = '250px';
        slider.color = 'grey'
        slider.background = 'black'
        slider.borderColor = 'white'
        slider.isThumbCircle = true;
        slider.thumbWidth = 30;


        UI.SetControlsPadding([header, slider], 2);
        UI.AddControlsToTarget([header, slider], sliderPanel);

        sliderPanel.getSliderValue = function() {
            return slider.value;
        }

        sliderPanel.setSliderValue = function(val) {
            slider.value = val;
        }

        sliderPanel.setWidth = function(width) {
            header.width = width;
            slider.width = width;
        }

        return sliderPanel
    }

    static MakeSliderPanelPrecise(headerText, unit, minVal, maxVal, initVal, valChangeFn) {
        // makes slider panel. header above slider.
        // header becomes 'headerText: val unit'
        // unit is string representing units ('degrees' or 'radians')
        // valChangeFn is function(value) that updates whatever the slider updates
        // valChangeFn does not need to change header as this is done here
        var sliderPanel = UI.MakePanel();
        UI.AdaptContainerWidth(sliderPanel);

        var header = UI.MakeTextBlock(headerText + ': ' + initVal + ' ' + unit, 20);
        header.height = UI.SLIDERHEADERH;
        header.width = '250px';


        var slider = new BABYLON.GUI.Slider();
        slider.minimum = minVal;
        slider.maximum = maxVal;
        slider.value = initVal;
        slider.onValueChangedObservable.add(function(value) {
            header.text = headerText + ': ' + math.round(100*value)/100 + ' ' + unit;
            valChangeFn(value);
        });
        slider.height = UI.SLIDERH;
        slider.width = '250px';
        slider.color = 'grey'
        slider.background = 'black'
        slider.borderColor = 'white'
        slider.isThumbCircle = true;
        slider.thumbWidth = 30;


        UI.SetControlsPadding([header, slider], 2);
        UI.AddControlsToTarget([header, slider], sliderPanel);

        sliderPanel.getSliderValue = function() {
            return slider.value;
        }

        sliderPanel.setSliderValue = function(val) {
            slider.value = val;
        }

        sliderPanel.setWidth = function(width) {
            header.width = width;
            slider.width = width;
        }

        return sliderPanel
    }

    static MakeIntSliderPanel(headerText, unit, minVal, maxVal, initVal, valChangeFn) {
        // makes slider panel. header above slider.
        // header becomes 'headerText: val unit'
        // unit is string representing units ('degrees' or 'radians')
        // valChangeFn is function(value) that updates whatever the slider updates
        // valChangeFn does not need to change header as this is done here
        var sliderPanel = UI.MakePanel();
        UI.AdaptContainerWidth(sliderPanel);

        var header = UI.MakeTextBlock(headerText + ': ' + initVal + ' ' + unit, 20);
        header.height = UI.SLIDERHEADERH;
        header.width = '250px';


        var slider = new BABYLON.GUI.Slider();
        slider.minimum = minVal;
        slider.maximum = maxVal;
        slider.value = initVal;
        slider.onValueChangedObservable.add(function(value) {
            header.text = headerText + ': ' + Math.round(value) + ' ' + unit;
            valChangeFn(Math.round(value));
        });
        slider.height = UI.SLIDERH;
        slider.width = '250px';
        slider.color = 'grey';
        slider.background = 'black';
        slider.borderColor = 'white';
        slider.isThumbCircle = true;
        slider.thumbWidth = 30;


        UI.SetControlsPadding([header, slider], 2);
        UI.AddControlsToTarget([header, slider], sliderPanel);

        sliderPanel.getSliderValue = function() {
            return slider.value;
        }

        sliderPanel.setSliderValue = function(val) {
            slider.value = val;
        }

        sliderPanel.setWidth = function(width) {
            header.width = width;
            slider.width = width;
        }

        return sliderPanel
    }

    static MakeVolumeSliderPanel(gui) {
        var volSP = UI.MakeSliderPanel('volume', '', 0, 1, BABYLON.Engine.audioEngine.getGlobalVolume(), function(value) {
            BABYLON.Engine.audioEngine.setGlobalVolume(value);
        });
        volSP.setWidth('200px');
        gui.mainMenu.addControl('volumeSP', volSP);
        gui.mainMenu.hideControl('volumeSP');
    }

    static MakeTwoButtonPanel(name0, text0, f0, name1, text1, f1) {
        var tbPanel = UI.MakePanel(false);
        var but0 = UI.MakeButton(name0, text0, f0);
        but0.width = UI.SMALLW;
        var but1 = UI.MakeButton(name1, text1, f1);
        but1.width = UI.SMALLW;
        UI.AddControlsToTarget([but0, UI.MakeHorizSpacer(), but1], tbPanel);

        return tbPanel;
    }

    static MakeShowHideButton(gui) {
        var resAudFunc = function() {
            BF.ResumeAudioContext();
            resAudFunc = function() {}
        }

        var shButton = UI.MakeDualButton('shButton', 'show', 'hide', function() {
            gui.activeMenu.hide();
        }, function() {
            resAudFunc();
            gui.activeMenu.show();
        }, window.sounds.uiClick);
        UI.AlignControlsTopLeft([shButton]);
        shButton.width = '60px';
        shButton.height = '30px';
        gui.texture.addControl(shButton);

        return shButton;
    }

    static MakeMuteButton(gui) {
        var muteButton = UI.MakeDualButton('muteButton', 'unmute', 'mute', function() {
            BF.SetGlobalVolume(0);
            gui.mainMenu.hideControl('volumeSP');
        }, function() {
            BABYLON.Engine.audioEngine.audioContext.resume();
            BF.SetGlobalVolume(gui.mainMenu.getControl('volumeSP').getSliderValue());
            window.sounds.animChange.play();
            gui.mainMenu.showControl('volumeSP');
        });
        UI.AlignControlsTopLeft([muteButton]);
        muteButton.width = '66px';
        muteButton.height = '30px';
        muteButton.left = '68px';
        gui.texture.addControl(muteButton);
        return muteButton;
    }

    static MakeFullscreenButton(canvas) { 
        var fsButton = UI.MakeDualButton('fsButton', 'enter fullscreen', 'exit fullscreen', function() {
            if(screenfull.isEnabled) {
                screenfull.exit();
            }
        }, function() {
            if(screenfull.isEnabled) {
                screenfull.request(canvas);
            }
        }, window.sounds.animChange);
        return fsButton;
    }

    static MakeMenuActivateAnimButton(animKey, animState) {
        var aaButton = UI.MakeButton('', animKey, function() {
            animState.switchActiveAnim(animKey)
        });
        aaButton.color = 'white';
        aaButton.horizontalAlignment = BABYLON.GUI.HORIZONTAL_ALIGNMENT_CENTER;
        return aaButton;
    }

    static MakeDualTextButton(name, text0, text1, onPressedFn, sound = null) {
        // button acts like a checkbox (hide/show settings button)
        // text0 is initial (true) state;
        // onPressedFn0 is run when state switches to true
        var state = 0
        var texts = [text0, text1];
        var button = UI.MakeButton(name, text0, function() {
            state = (state + 1) % 2;
            button.children[0].text = texts[state];
            onPressedFn();
        }, sound);

        return button;
    }

    static MakeDualButton(name, text0, text1, onPressedFn0, onPressedFn1, sound = null) {
        // button acts like a checkbox (hide/show settings button)
        // text0 is initial 0 state;
        // onPressedFn0 is run when state switches to 0
        var state = 0
        var texts = [text0, text1];
        var fns = [onPressedFn0, onPressedFn1]
        var button = UI.MakeButton(name, text0, function() {
            state = (state + 1) % 2;
            button.children[0].text = texts[state];
            fns[state]();
        }, sound);

        return button;
    }

    static MakeParentButton(name, text, subMenu, gui) {
        var parentButton = UI.MakeButton(name, text, function() {
            gui.setActiveMenu(subMenu);
        }, window.sounds.uiClick);
        parentButton.color = 'white'
        return parentButton;
    }

    static MakeBackButton(name, parent, gui) {
        // parent is menu that back button returns to
        var backButton = UI.MakeButton(name, '<', function() {
            window.sounds.uiClick.play();
            gui.setActiveMenu(parent);
        });
        backButton.color = 'white'
        backButton.width = '30px'
        backButton.height = '30px'
        return backButton;
    }

    static MakeVertSpacer(spacing = UI.SPACING) {
        var spacer = new BABYLON.GUI.Rectangle();
        spacer.width = '1px';
        spacer.height = spacing;
        spacer.color = 'green'
        spacer.alpha = 0;
        return spacer;
    }

    static MakeHorizSpacer(spacing = UI.SPACING) {
        var spacer = new BABYLON.GUI.Rectangle();
        spacer.width = spacing;
        spacer.height = '1px';
        spacer.color = 'green'
        spacer.alpha = 0;
        return spacer;
    }

    static MakeButton(name, text, onPressedFn, sound = null) {
        var button = BABYLON.GUI.Button.CreateSimpleButton(name, text);
        if(sound) {
            button.onPointerClickObservable.add(function() {
                sound.play();
                onPressedFn();
            });
        } else {
            button.onPointerClickObservable.add(onPressedFn);
        }
        UI.SetControlsWidthHeight([button], UI.STANDARDW, UI.STANDARDH);
        button.color = 'white';
        return button;
    }

    static MakeTextBlock(text, fontSize, color = 'white') {
        var textBlock = new BABYLON.GUI.TextBlock();
        textBlock.text = text;
        textBlock.fontSize = fontSize;
        textBlock.color = color;

        return textBlock;
    }

    static MakePanel(isVertical = true, topLeft = false, adaptSize = true) {
        // isVertical false means horizontal stackpanel
        var panel = new BABYLON.GUI.StackPanel();
        panel.isVertical = isVertical;
        if(topLeft) {
            UI.AlignControlsTopLeft([panel]);
        }
        if(adaptSize) {
            if(isVertical) {
                UI.AdaptContainerWidth(panel);
            } else {
                UI.AdaptContainerHeight(panel);
            }
        }
        return panel;
    }

    static MakeScrollViewer(name = 'sv') {
        var sv = new BABYLON.GUI.ScrollViewer(name);
        sv.width = UI.SVWIDTH;
        sv.height = UI.SVHEIGHT;
        sv.barSize = UI.SVBARSIZE;
        sv.color = 'black';
        return sv;
    }

    // helpers
    static AddControlsToTarget(controls, target) {
        // controls is ar(control)
        // root is the gui texture
        for(var i = 0; i < controls.length; i++) {
            target.addControl(controls[i]);
        }
    }

    static SetControlsPadding(controls, padding) {
        for(var i = 0; i < controls.length; i++) {
            controls[i].paddingTop = padding;
            controls[i].paddingBottom = padding;
            controls[i].paddingLeft = padding;
            controls[i].paddingRight = padding;
        }
    }

    static AlignControlsTop(controls) {
        for(var i = 0; i < controls.length; i++) {
            controls[i].verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        }
    }

    static AlignControlsLeft(controls) {
        for(var i = 0; i < controls.length; i++) {
            controls[i].horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        }
    }

    static AlignControlsTopLeft(controls) {
        for(var i = 0; i < controls.length; i++) {
            controls[i].horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            controls[i].verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        }
    }

    static AdaptContainerWidth(container) {
        container.adaptWidthToChildren = true;
    }

    static AdaptContainerHeight(container) {
        container.adaptHeightToChildren = true;
    }

    static AdaptContainerWidthHeight(container) {
        container.adaptWidthToChildren = true;
        container.adaptHeightToChildren = true;
    }

    static SetControlsWidthHeight(controls, width, height) {
        for(var i = 0; i < controls.length; i++) {
            controls[i].width = width;
            controls[i].height = height;
        }
    }
}