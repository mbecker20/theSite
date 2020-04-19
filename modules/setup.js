import { UI } from './gui.js';
import { Cycle } from './cycle.js';
import { BouncyBall, DancingTHandle, PendVsMass, PendTugOfWar, SpinningRing, MultiPend } from './anims/all.js';
import { BF, Cam } from './babylonStuff.js';
import { MyMats, MySounds } from './resources.js';
import { MF } from './funcClasses.js'

window.addEventListener('DOMContentLoaded', function(){
    // get the canvas DOM element
    var canvas = document.getElementById('renderCanvas');

    // load the 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    // createScene function that creates and return the scene
    var createScene = function() {
        var scene = new BABYLON.Scene(engine);
        
        //setup camera
        var camPos = BF.Vec3([12, 22, -12]);
        window.camera = Cam.MakeCam(camPos, scene, canvas);
        //window.camera.setLookDirection([-1,5,0]);
        window.camera.lookAt([0,22,0]);

        //setup scene environment
        scene.ambientColor = BF.ColorRGB(255,255,255);
        scene.clearColor = BF.ColorRGB(0,0,0);

        //initialize materials object
        var myMats = new MyMats(scene);

        //initialize sounds object
        window.sounds = new MySounds(scene);

        //setup gui
        window.gui = UI.MakeGUI(canvas);

        window.MF = MF;

        //initialize animation classes
        var shadowQual = 1024;
        var cycle = new Cycle(scene, myMats, shadowQual);
        window.camera.ground = cycle.underBlock;

        var bouncyBall = new BouncyBall(scene, myMats, cycle.shadows, window.gui);

        var dancingTHandle = new DancingTHandle(scene, myMats, cycle.shadows, window.gui);
        BF.SetVec3([0,18.1,0], dancingTHandle.node.position);

        var pendVsMass = new PendVsMass(scene, myMats, cycle.shadows, window.gui);

        var ptw = new PendTugOfWar(scene, myMats, cycle.shadows, window.gui);

        var spinningRing = new SpinningRing(scene, myMats, cycle.shadows, window.gui);

        var multiPend = new MultiPend(scene, myMats, cycle.shadows, gui, 5);
        multiPend.params.theta0 = 2;
        
        // world axes for reference (red = x, green = y, blue = z)
        var oAxes = BF.MakeAxes('oAxes', scene, 4);
        oAxes.position.y += 22.5;

        var anims = {
            'dancing T handle': dancingTHandle,
            'multi pendulum': multiPend,
            'pend vs mass': pendVsMass, 
            'pendulum tug of war': ptw, 
            'mass on a ring': spinningRing,
            'bouncy ball': bouncyBall
        };

        var animState = UI.MakeAnimStateChooseAnimMenu(anims, window.gui, window.mySounds);

        UI.MakeHowToMenu(window.gui);
        UI.MakeVolumeSliderPanel(window.gui);
        BF.SetGlobalVolume(0);

        scene.registerAfterRender(function () {
            window.camera.step();
            cycle.step();
            animState.activeAnim.step();
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
    });
});