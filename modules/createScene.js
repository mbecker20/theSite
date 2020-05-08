var createScene = function(canvas, engine) {
    // create scene
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
    var cycle = new Cycle(scene, myMats, shadowQual);
    window.camera.ground = cycle.underBlock;

    var bouncyBall = new BouncyBall(scene, window.myMats, cycle.shadows, window.gui);

    var dancingTHandle = new DancingTHandle(scene, window.myMats, cycle.shadows, window.gui);

    var pendVsMass = new PendVsMass(scene, window.myMats, cycle.shadows, window.gui);

    var ptw = new PendTugOfWar(scene, window.myMats, cycle.shadows, window.gui);

    var spinningRing = new SpinningRing(scene, window.myMats, cycle.shadows, window.gui);

    var multiPend = new MultiPend(scene, window.myMats, cycle.shadows, gui, 5);
    multiPend.params.theta0 = 2;

    // world axes for reference (red = x, green = y, blue = z)
    //var oAxes = BF.MakeAxes('oAxes', scene, 4);
    //oAxes.position.y = Cycle.UNDERBLOCKSIZE()/2 + .5;

    var anims = {
        'pendulum tug of war': ptw,
        'dancing T handle': dancingTHandle,
        'multi pendulum': multiPend,
        'pend vs mass': pendVsMass,
        'mass on a ring': spinningRing,
        'bouncy ball': bouncyBall
    };

    cycle.addAnimsToCycle(anims);
    //window.animState = UI.MakeAnimStateChooseAnimMenu(anims, window.gui);
    window.animState = BF.MakeAnimState(anims, window.gui);
    window.animState.anims['dancing T handle'].tHandle.updateAngMom();

    UI.MakeChooseVirtualControlMenu(window.gui);
    UI.MakeHowToMenu(window.gui);
    UI.MakeVolumeSliderPanel(window.gui);
    BF.SetGlobalVolume(0);

    scene.registerAfterRender(function () {
        window.camera.step();
        cycle.step();
        window.animState.activeAnim.step();
    });

    return scene;
}
