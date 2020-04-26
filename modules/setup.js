window.addEventListener('DOMContentLoaded', function() {
    // get the canvas DOM element
    var canvas = document.getElementById('renderCanvas');

    // load the 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    // createScene function that creates and return the scene
    var createScene = function() {
        // create scene
        var scene = new BABYLON.Scene(engine);

        //initialize sounds object
        window.sounds = new MySounds(scene);

        // create gui
        window.gui = UI.MakeGUI(canvas);
        
        // setup camera
        var camPos = BF.Vec3([22, Cycle.UNDERBLOCKSIZE()/2+Cam.HEIGHT()+1, -22]);
        window.camera = Cam.MakeCam(camPos, scene, canvas, engine);
        //window.camera.setLookDirection([-1,5,0]);
        window.camera.lookAt([0,Cycle.UNDERBLOCKSIZE()/2,0]);

        //setup scene environment
        scene.ambientColor = BF.ColorRGB(255,255,255);
        scene.clearColor = BF.ColorRGB(0,0,0);

        //initialize materials object
        var myMats = new MyMats(scene);

        //initialize animation classes
        var shadowQual = 1024;
        var cycle = new Cycle(scene, myMats, shadowQual);
        window.camera.ground = cycle.underBlock;

        var bouncyBall = new BouncyBall(scene, myMats, cycle.shadows, window.gui);

        var dancingTHandle = new DancingTHandle(scene, myMats, cycle.shadows, window.gui);

        var pendVsMass = new PendVsMass(scene, myMats, cycle.shadows, window.gui);

        var ptw = new PendTugOfWar(scene, myMats, cycle.shadows, window.gui);

        var spinningRing = new SpinningRing(scene, myMats, cycle.shadows, window.gui);

        var multiPend = new MultiPend(scene, myMats, cycle.shadows, gui, 5);
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
        window.animState = UI.MakeAnimStateChooseAnimMenu(anims, window.gui, window.mySounds);
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

        // control pointer observables
        scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    window.camera.virtualController.pointerDown(pointerInfo);
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    window.camera.virtualController.pointerUp(pointerInfo);
                    break;
                case BABYLON.PointerEventTypes.POINTERMOVE:
                    window.camera.virtualController.pointerMove(pointerInfo);
                    break;
            }
        });

        return scene;
    }

    var createTestingScene = function() {
        // create scene
        // scene with only cycle for testing
        var scene = new BABYLON.Scene(engine);

        //initialize sounds object
        window.sounds = new MySounds(scene);

        // create gui
        window.gui = UI.MakeGUI(canvas);
        
        // setup camera
        var camPos = BF.Vec3([22, Cycle.UNDERBLOCKSIZE()/2+Cam.HEIGHT()+1, -22]);
        window.camera = Cam.MakeCam(camPos, scene, canvas, engine);
        //window.camera.setLookDirection([-1,5,0]);
        window.camera.lookAt([0,Cycle.UNDERBLOCKSIZE()/2,0]);

        //setup scene environment
        scene.ambientColor = BF.ColorRGB(255,255,255);
        scene.clearColor = BF.ColorRGB(0,0,0);

        //initialize materials object
        var myMats = new MyMats(scene);

        //initialize animation classes
        var shadowQual = 1024;
        var cycle = new Cycle(scene, myMats, shadowQual);
        window.camera.ground = cycle.underBlock;
        
        // world axes for reference (red = x, green = y, blue = z)
        var oAxes = BF.MakeAxes('oAxes', scene, 4);
        oAxes.position.y = Cycle.UNDERBLOCKSIZE()/2 + .5;

        var dth = new DancingTHandle(scene, myMats, cycle.shadows, window.gui);
        dth.node.position.y -= Cycle.UNDERBLOCKSIZE()/2 + .1; // need to make physBodies coord system the anims node
        dth.node.rotation.x = Math.PI;
        dth.tHandle.updateAngMom();
        dth.tHandle.setShowWArrow(true);

        UI.MakeChooseVirtualControlMenu(window.gui);
        UI.MakeHowToMenu(window.gui);
        UI.MakeVolumeSliderPanel(window.gui);
        BF.SetGlobalVolume(0);

        scene.registerAfterRender(function () {
            window.camera.step();
            cycle.step();
            dth.step();
        });

        // control pointer observables
        scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    window.camera.virtualController.pointerDown(pointerInfo);
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    window.camera.virtualController.pointerUp(pointerInfo);
                    break;
                case BABYLON.PointerEventTypes.POINTERMOVE:
                    window.camera.virtualController.pointerMove(pointerInfo);
                    break;
            }
        });

        return scene;
    }

    // call the createScene function
    var scene = createScene();

    // run the render loop
    engine.runRenderLoop(function(){
        scene.render();
    });

    // the canvas/window resize event handler
    window.addEventListener('resize', function(){
        engine.resize();
        window.camera.virtualController.onResize();
    });
});