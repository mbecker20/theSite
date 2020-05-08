var createTestingScene = function(canvas, engine) {
    // create scene
    // scene with only cycle for testing
    var scene = new BABYLON.Scene(engine);

    //initialize sounds object
    window.sounds = new MySounds(scene);

    // create gui
    window.gui = UI.MakeGUI(canvas);

    // create pointerManager to manage mouse/touch interactions
    window.pointerManager = new PointerManager(scene);

    // create funcBuffer for keyed animations
    window.funcBuffer = new FuncBuffer();

    // setup camera
    var camPos = BF.Vec3([22, Cycle.UNDERBLOCKSIZE()/2+Cam.HEIGHT()+1, -22]);
    window.camera = Cam.MakeCam(camPos, scene, canvas, engine);
    //window.camera.setLookDirection([-1,5,0]);
    window.camera.lookAt([0,Cycle.UNDERBLOCKSIZE()/2,0]);

    //setup scene environment
    scene.ambientColor = BF.ColorRGB(255,255,255);
    scene.clearColor = BF.ColorRGB(0,0,0);

    //initialize materials object
    window.myMats = new MyMats(scene);

    //initialize animation classes
    var shadowQual = 1024;
    var cycle = new Cycle(scene, window.myMats, shadowQual);
    window.camera.ground = cycle.underBlock;

    // world axes for reference (red = x, green = y, blue = z)
    //var oAxes = BF.MakeAxes('oAxes', scene, 4);
    //oAxes.position.y = Cycle.UNDERBLOCKSIZE()/2 + .5;

    // do testing stuff here
    var risingPanel = UI3D.MakeRisingPanel('risingPanel', scene, 20, 12, 1, [2,3], 'posy');
    risingPanel.node.position.y = Cycle.UNDERBLOCKSIZE()/2;
    risingPanel.addToPointerManager('posy');
    risingPanel.panel.material = window.myMats.bluePlanet;

    var slider = UI3D.MakePuckSlider('puckSlider', scene, 3, 1, risingPanel.panel, [0,10], 5, 18, 300, GF.DoNothing);
    slider.mesh.material = window.myMats.lightBlue;
    risingPanel.addSlider(slider, [0, 1]);

    var knob = UI3D.MakeTwistKnob('twistKnob', scene, 3, 1, risingPanel.panel, [0,10], 5, .05, 300, GF.DoNothing);
    risingPanel.addKnob(knob, [1, 0]);

    var knob1 = UI3D.MakeTwistKnobInt('twistKnob1', scene, 3, 1, risingPanel.panel, [0,10], 3, .05, 300, GF.DoNothing);
    risingPanel.addKnob(knob1, [1, 1]);

    var knob2 = UI3D.MakeTwistKnobPrecise('twistKnob2', scene, 3, 1, risingPanel.panel, [0,2], 1.12, .005, 300, GF.DoNothing);
    risingPanel.addKnob(knob2, [1, 2]);

    UI.MakeChooseVirtualControlMenu(window.gui);
    UI.MakeHowToMenu(window.gui);
    UI.MakeVolumeSliderPanel(window.gui);
    BF.SetGlobalVolume(0);

    scene.registerAfterRender(function() {
        window.camera.step();
        cycle.step();
        window.funcBuffer.exist();
    });

    return scene;
}
