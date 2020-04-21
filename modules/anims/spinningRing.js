import { BF, UI } from '../babylonStuff.js';
import { Lagrangian } from '../lagrangian.js';
import { MF } from '../funcClasses.js';

export class SpinningRing {
    // spinning ring
    constructor(scene, myMats, shadows, gui) {
        // make node
        this.node = BF.MakeTransformNode('anim8node', scene);

        // setup lagrangian update system
        this.setupLagrangian();

        this.setupMeshs(scene);

        this.setMaterials(myMats);

        BF.ConnectMeshsToShadows([this.ring, this.mass, this.ground], shadows);

        this.setPos = this.setPosShowRot;
        this.setPos();

        this.setupGUIMenu(gui, this);
    }

    setupLagrangian() {
        this.dt = .02;
        this.stepsPerFrame = 1;

        this.params = {theta: 1, thetaDot: 2, phi: 0, phiDot: 2};
        this.pConst = {mSphere: 1, rSphere: 1, mRing: 1, rRing: 7, g: 10};
        this.setConstants(this.pConst);
        this.damping = {thetaDot: 0.01, phiDot: 0.01};

        this.lagrangian = new Lagrangian(this.makeLFuncs(), this.params, this.pConst, this.damping);
        this.lagrangian.addForcingMode('phiDotForcing', ['phi']);
        this.lagrangian.switchForcingMode('phiDotForcing');
    }

    setConstants(pConst) {
        pConst.c0 = .5 * pConst.mSphere * (MF.Square(pConst.rRing) + (2/5) * MF.Square(pConst.rSphere));
        pConst.c1 = .5 * pConst.mSphere * MF.Square(pConst.rRing);
        pConst.c2 = .5 * (pConst.mSphere * (2/5) * MF.Square(pConst.rSphere) + .5 * pConst.mRing * MF.Square(pConst.rRing));
        pConst.c3 = pConst.mSphere * pConst.g * pConst.rRing;
    }

    makeLFuncs() {
        function l0(p, pConst) {
            return pConst.c0 * MF.Square(p.thetaDot);
        }
        l0.paramKeys = ['thetaDot'];

        function l1(p, pConst) {
            return pConst.c1 * MF.Square(Math.sin(p.theta)) * MF.Square(p.phiDot);
        }
        l1.paramKeys = ['theta', 'phiDot'];

        function l2(p, pConst) {
            return pConst.c2 * MF.Square(p.phiDot);
        }
        l2.paramKeys = ['phiDot'];

        function l3(p, pConst) {
            return pConst.c3 * Math.cos(p.theta);
        }
        l3.paramKeys = ['theta'];

        return [l0, l1, l2, l3];
    }

    switchToFreeMode() {
        this.lagrangian.switchForcingMode('free');
        this.guiMenu.hideControl('phiDotSP');
        this.guiMenu.hideControl('showSSBut');
        this.guiMenu.showControl('phiDampSP');
        this.hideSteadyStates();
    }

    switchToForcedMode(phiDotSP) {
        this.lagrangian.switchForcingMode('phiDotForcing');
        phiDotSP.children[1].value = this.params.phiDot;
        this.guiMenu.showControl('phiDotSP');
        this.guiMenu.showControl('showSSBut');
        this.guiMenu.hideControl('phiDampSP');
        this.setSteadyStatePos();
        if(this.showingSS) {
            this.showSteadyStates();
        }
    }

    setupMeshs(scene) {
        this.ground = BABYLON.MeshBuilder.CreateGround('ground4', {width:20,height:20}, scene);
        this.ground.receiveShadows = true;

        this.ring = BABYLON.MeshBuilder.CreateTorus('ring', {diameter: 2*this.pConst.rRing, thickness: .25, tessellation: 64}, scene);
        this.ring.rotation.x = Math.PI/2;
        this.ring.bakeCurrentTransformIntoVertices();
        this.ring.position = BF.Vec3([0,this.pConst.rRing + 2,0]);
        this.ring.receiveShadows = true;

        BF.SetChildren(this.node, [this.ground, this.ring]);

        this.massParent = BF.MakeTransformNode('massParent', scene);
        this.mass = BABYLON.MeshBuilder.CreateSphere('ringMass', {segments:16, diameter: 2*this.pConst.rSphere}, scene);
        this.massParent.parent = this.ring;
        this.mass.parent = this.massParent;
        BF.SetVec3([0,-this.pConst.rRing, 0], this.mass.position);
        this.mass.receiveShadows = true;

        // make steady state spheres
        this.showingSS = false;
        this.zeroSteadyState = BF.MakeSphere('zeroSS', scene, 1);
        this.piSteadyState = BF.MakeSphere('piSS', scene, 1);
        BF.SetChildren(this.ring, [this.zeroSteadyState, this.piSteadyState]);
        this.zeroSteadyState.position.y = -this.pConst.rRing;
        this.piSteadyState.position.y = this.pConst.rRing;

        this.plusSteadyState = BF.MakeSphere('plusSS', scene, 1);
        this.minusSteadyState = BF.MakeSphere('minusSS', scene, 1);

        this.plusSSPivot = BF.MakeTransformNode('plusSSPiv', scene);
        this.plusSteadyState.parent = this.plusSSPivot;
        this.plusSteadyState.position.y = -this.pConst.rRing;

        this.minusSSPivot = BF.MakeTransformNode('minusSSPiv', scene);
        this.minusSteadyState.parent = this.minusSSPivot;
        this.minusSteadyState.position.y = -this.pConst.rRing;

        this.steadyStates = [this.zeroSteadyState, this.piSteadyState, this.plusSteadyState, this.minusSteadyState];
        this.setSteadyStatePos();
        this.hideSteadyStates();

        BF.SetChildren(this.ring, [this.plusSSPivot, this.minusSSPivot]);
    }

    setMaterials(myMats) {
        BF.SetMaterial(myMats.galaxy, [this.ground]);
        BF.SetMaterial(myMats.wArrow, [this.ring]);
        BF.SetMaterial(myMats.darkMoon, [this.mass]);
        BF.SetMaterial(myMats.red, [this.zeroSteadyState, this.piSteadyState]);
        BF.SetMaterial(myMats.blue, [this.plusSteadyState, this.minusSteadyState]);
        BF.ForceCompileMaterials([this.ground, this.ring, this.mass, this.zeroSteadyState, this.piSteadyState, this.plusSteadyState, this.minusSteadyState]);
    }

    setPosShowRot() {
        // updates position of mesh based on current params
        this.massParent.rotation.z = this.params.theta;
        this.ring.rotation.y += this.params.phiDot * this.dt * this.stepsPerFrame;
    }

    setPosNoRot() {
        // updates position of mesh based on current params
        this.massParent.rotation.z = this.params.theta;
    }

    setSteadyStatePos() {
        var c = this.pConst.g / (this.pConst.rRing * MF.Square(this.params.phiDot));
        if(c < 1) {
            var ss = math.acos(c);
            this.plusSSPivot.rotation.z = ss;
            this.minusSSPivot.rotation.z = -ss;
        } else {
            this.plusSSPivot.rotation.z = 0;
            this.minusSSPivot.rotation.z = 0;
        }
    }

    showSteadyStates() {
        BF.ShowMeshs(this.steadyStates);
    }

    hideSteadyStates() {
        BF.HideMeshs(this.steadyStates);
    }

    step() {
        this.lagrangian.step(this.dt, this.stepsPerFrame);
        this.setPos();
    }

    setupGUIMenu(gui, anim) {
        this.guiMenu = UI.MakeSubMenu('sim settings', gui.mainMenu, gui);

        var names = [];
        var controls = [];

        /* var gSliderPanel = UI.MakeSliderPanel('gravity', '', 0, 40, anim.pConst.g, function(value) {
            anim.pConst.g = value;
            anim.pConst.c3 = anim.pConst.mSphere * anim.pConst.g * anim.pConst.rRing;
        }); */

        var showRotButton = UI.MakeDualButton('showRotBut', "don't show ring rotation", 'show ring rotation', function() {
            anim.setPos = anim.setPosShowRot;
        }, function() {
            anim.setPos = anim.setPosNoRot;
        });
        names.push('showRotBut');
        controls.push(showRotButton);


        var showSSButton = UI.MakeDualButton('showSSBut', 'show steady states', 'hide steady states', function() {
            anim.hideSteadyStates();
            anim.showingSS = false;
        }, function() {
            anim.showSteadyStates();
            anim.showingSS = true;
        });
        names.push('showSSBut');
        controls.push(showSSButton);

        var phiDotSliderPanel = UI.MakeSliderPanel('ring spin speed', '', 0, 4, anim.params.phiDot, function(value) {
            anim.params.phiDot = value;
            anim.setSteadyStatePos();
        })
        names.push('phiDotSP');
        controls.push(phiDotSliderPanel);

        var modeSwitchButton = UI.MakeDualButton('modeSwitch', 'switch to free ring', 'switch to forced ring', function() {
            anim.switchToForcedMode(phiDotSliderPanel, showSSButton);
        }, function() {
            anim.switchToFreeMode();
        });
        names.push('modeSwitchButton');
        controls.push(modeSwitchButton);
        // UI.SetControlsWidthHeight([modeSwitchButton], '200px', '50px');
        //modeSwitchButton.color = 'white';

        var thetaDampingSliderPanel = UI.MakeSliderPanelPrecise('theta damping', '', 0, .4, anim.damping.thetaDot, function(value) {
            anim.damping.thetaDot = value;
        });
        names.push('thetaDampSP');
        controls.push(thetaDampingSliderPanel);

        var phiDampingSliderPanel = UI.MakeSliderPanelPrecise('phi damping', '', 0, .2, anim.damping.phiDot, function(value) {
            anim.damping.phiDot = value;
        });
        names.push('phiDampSP');
        controls.push(phiDampingSliderPanel);

        names.push('finalSpacer');
        controls.push(UI.MakeVertSpacer());

        this.guiMenu.addControls(names, controls);
        this.guiMenu.hideControl('phiDampSP');
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