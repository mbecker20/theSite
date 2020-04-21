import { BF, UI } from '../babylonStuff.js';
import { makePhysBody } from '../physBody.js';

export class DancingTHandle {
    constructor(scene, myMats, shadows, gui) {
        this.node = new BABYLON.TransformNode('anim4Node', scene);

        this.ground = BABYLON.MeshBuilder.CreateGround('ground4', {width:20,height:20}, scene);
        this.ground.position = BF.ZeroVec3();
        this.ground.material = myMats.wArrow;
        this.ground.receiveShadows = true;

        var mainLength = 6;
        var mainDiameter = 2;
        var crossLength = 8;
        var crossDiameter = 2;

        this.tHandle = BF.MakeTHandle('tHandle', scene, mainLength, mainDiameter, crossLength, crossDiameter);
        this.tHandle.material = myMats.darkMoon;
        this.tHandle.receiveShadows = true;

        BF.ConnectMeshsToShadows([this.tHandle, this.ground], shadows);

        this.dt = .008;
        this.g = 0;

        makePhysBody(scene, this.tHandle, BF.ZeroVec3(), [-80,-80,-1200], .1, this.dt);
        this.tHandle.p = BF.Vec3([0, 7, 0]);
        this.tHandle.position = this.tHandle.p;
        this.tHandle.wArrow.pointer.material = myMats.wArrow;
        this.tHandle.updateMesh();

        BF.SetChildren(this.node, [this.ground, this.tHandle, this.tHandle.wArrow]);
        
        this.stepsPerFrame = 1;

        BF.ForceCompileMaterials([this.tHandle, this.tHandle.wArrow.pointer, this.ground]);

        this.setupGUIMenu(gui, this);
    }

    step() {
        for(var i=0; i<this.stepsPerFrame; i++) {
            this.tHandle.step(this.g, this.dt);
        }
        this.tHandle.updateMesh();
    }

    setupGUIMenu(gui, anim) {
        this.guiMenu = UI.MakeSubMenu('sim settings', gui.mainMenu, gui);

        var showWArrowButton = UI.MakeDualTextButton('showWArrowBut', 'show axis of rotation', 'hide axis of rotation', function() {
            anim.tHandle.showWArrow = !anim.tHandle.showWArrow;
            anim.tHandle.setShowWArrow(anim.tHandle.showWArrow);
        });

        var showAxesButton = UI.MakeDualTextButton('showAxesBut', 'show body axes', 'hide body axes', function() {
            anim.tHandle.showAxes = !anim.tHandle.showAxes;
            anim.tHandle.setShowAxes(anim.tHandle.showAxes);
        });

        this.guiMenu.addControls(['showWArrowButton', 'showAxesButton', 'finalSpacer'], [showWArrowButton, showAxesButton, UI.MakeVertSpacer()]);
    }

    activate() {
        this.node.setEnabled(true);
        this.guiMenu.parentButton.isVisible = true;
    }

    deactivate() {
        this.node.setEnabled(false);
        this.guiMenu.parentButton.isVisible = false;
    }
}