import { BF } from '../babylonStuff.js';
import { Lagrangian } from '../lagrangian.js';
import { MF } from '../funcClasses.js';
import { UI } from '../gui.js';

export class PendTugOfWar {
    constructor(scene, myMats, shadows, gui) {
        // sphere swings, cube up and down
        this.node = BF.MakeTransformNode('anim7Node', scene);

        // setup lagrangian update system
        this.setupLagrangian();

        // setup meshes
        this.setupMeshs(scene);
        
        // set materials
        this.setMaterials(myMats);

        // connect meshs to shadows
        BF.ConnectMeshsToShadows([this.ground, this.sphere, this.cube, this.spherePiv, this.cubePiv, this.topRope, this.sphereRope, this.cubeRope], shadows);
    
        // set BC
        this.lMin = this.spherePivR + this.pConst.rSphere;
        this.lMax = this.pConst.lTot - this.cubePivR - this.pConst.sCube/2;
        this.collisionVelocityMult = .6; // multiplied by -velocity on collision with pivot;

        // set initial position of everything
        this.setPos();
        this.setupGUIMenu(gui, this);
    }

    setupLagrangian() {
        this.dt = .02;
        this.stepsPerFrame = 1;
        this.params = {l: 6, lDot: 3, theta: 1, thetaDot: 2, phi: 0, phiDot: 3};
        this.pConst = {mSphere: 1.1, mCube: 1, g: 10, lTot: 14, rSphere: 1.5, sCube: 3};
        this.damping = {lDot: .01, thetaDot: .01, phiDot: .01};
        this.pConst.sphereIcm = this.pConst.mSphere * (2/5) * MF.Square(this.pConst.rSphere);
        this.pConst.cubeIcm = this.pConst.mCube * (1/6) * MF.Square(this.pConst.sCube);
        this.lagrangian = new Lagrangian(this.getLFuncs(), this.params, this.pConst, this.damping);
    }

    setMaterials(myMats) {
        BF.SetMaterial(myMats.galaxy, [this.ground]);
        BF.SetMaterial(myMats.darkMoon, [this.sphere, this.cube, this.spherePiv, this.cubePiv]);
        BF.SetMaterial(myMats.wArrow, [this.topRope, this.sphereRope, this.cubeRope]);
        BF.ForceCompileMaterials([this.topRope, this.ground, this.sphere, this.cube, this.spherePiv, this.cubePiv]);
    }

    getLFuncs() {
        function l0(p, pConst) {
            return .5 * (pConst.mSphere + pConst.mCube) * MF.Square(p.lDot);
        }
        l0.paramKeys = ['lDot'];
        
        function l1 (p, pConst) {
            var sphereI = pConst.sphereIcm + pConst.mSphere * MF.Square(p.l);
            return .5 * sphereI * MF.Square(p.thetaDot);
        }
        l1.paramKeys = ['l', 'thetaDot'];

        function l2 (p, pConst) {
            var cubeI = pConst.cubeIcm + pConst.mCube * MF.Square(pConst.lTot - p.l);
            return .5 * cubeI * MF.Square(p.phiDot);
        }
        l2.paramKeys = ['l', 'phiDot'];

        function l3 (p, pConst) {
            return pConst.mSphere * pConst.g * p.l * Math.cos(p.theta);
        }
        l3.paramKeys = ['l', 'theta'];

        function l4 (p, pConst) {
            return pConst.mCube * pConst.g * (pConst.lTot - p.l) * Math.cos(p.phi);
        }
        l4.paramKeys = ['l', 'phi'];
        

        return [l0, l1, l2, l3, l4];
    }

    setupMeshs(scene) {
        this.ground = BABYLON.MeshBuilder.CreateGround('ground4', {width:20,height:20}, scene);
        this.ground.receiveShadows = true;

        this.sphere = BF.MakeSphere('sphere5', scene, 2 * this.pConst.rSphere);

        this.cube = BABYLON.MeshBuilder.CreateBox('cube5', {size: this.pConst.sCube}, scene);
        this.cube.receiveShadows = true;

        this.spherePivR = .75
        this.spherePiv = BF.MakeCylinder('spherePiv', scene, .5, 2 * this.spherePivR);
        this.spherePiv.rotation.x = Math.PI/2;
        
        this.cubePivR = .75;
        this.cubePiv = BF.MakeCylinder('cubePiv', scene, .5, 2 * this.cubePivR);
        this.cubePiv.rotation.x = Math.PI/2;

        BF.BakeMeshs([this.spherePiv, this.cubePiv]);

        var pivHeight = 15;
        this.spherePiv.position = BF.Vec3([0, pivHeight, -3]);
        this.cubePiv.position = BF.Vec3([0, pivHeight, 3]);
        this.blockHitSound = BF.MakeSound('blockHit', 'resources/blockHit.mp3', scene, null, {spatialSound: true});
        this.blockHitSound.setPosition(BF.Vec3([0,pivHeight,0]));

        this.topRope = BF.MakeTube('topRope', scene, .25);
        this.topRope.scaling.x = 6;
        this.topRope.rotation.y = -Math.PI/2;

        this.sphereRope = BF.MakeTube('sphereRope', scene, .25);
        this.sphereRope.rotation.z = -Math.PI/2;

        this.cubeRope = BF.MakeTube('cubeRope', scene, .25);
        this.cubeRope.rotation.z = -Math.PI/2;
        
        BF.BakeMeshs([this.cubeRope, this.sphereRope]);

        // setup parenting
        BF.SetChildren(this.node, [this.ground, this.spherePiv, this.cubePiv, this.topRope]);
        BF.SetChildren(this.spherePiv, [this.sphere, this.topRope, this.sphereRope]);
        BF.SetChildren(this.cubePiv, [this.cube, this.cubeRope]);
    }

    setPos() {
        // sets position of sphere and cube relative to piv on y axis
        // rotates piv the given angle
        this.sphere.position.y = -this.params.l
        this.sphereRope.scaling.y = this.params.l;
        this.spherePiv.rotation.z = this.params.theta;
        
        var cubeSideLength = this.pConst.lTot - this.params.l;
        this.cube.position.y = -cubeSideLength;
        this.cubeRope.scaling.y = cubeSideLength;
        this.cubePiv.rotation.z = this.params.phi;
    }

    step() {
        //this.lagrangian.step(this.dt, this.stepsPerFrame);
        this.lagrangian.step(this.dt, this.stepsPerFrame);
        this.imposeBC();
        this.setPos();
    }

    setBlockHitVol() {
        var volScale = 1/30;
        var vol = volScale * this.params.lDot;
        this.blockHitSound.setVolume(vol);
    }

    imposeBC() {
        // updates params based on boundary conditions
        if(this.params.l > this.lMax) {
            this.setBlockHitVol();
            this.blockHitSound.play();
            this.params.l = this.lMax;
            this.params.lDot = -this.collisionVelocityMult * this.params.lDot + this.lagrangian.activeMode.pDD.l * this.dt;
        } else if(this.params.l < this.lMin) {
            this.setBlockHitVol();
            this.blockHitSound.play();
            this.params.l = this.lMin;
            this.params.lDot = -this.collisionVelocityMult * this.params.lDot + this.lagrangian.activeMode.pDD.l * this.dt;
        }
    }

    setupGUIMenu(gui, anim) {
        this.guiMenu = UI.MakeSubMenu('sim settings', gui.mainMenu, gui);

        /* var gSliderPanel = UI.MakeSliderPanel('gravity', '', 0, 40, anim.pConst.g, function(value) {
            anim.pConst.g = value;
        }); */
        var names = [];
        var controls = [];

        var mSphereSliderPanel = UI.MakeSliderPanel('sphere mass', '', .1, 5, anim.pConst.mSphere, function(value) {
            anim.pConst.mSphere = value;
        });
        names.push('mSphereSP');
        controls.push(mSphereSliderPanel);

        var mCubeSliderPanel = UI.MakeSliderPanel('cube mass', '', .1, 5, anim.pConst.mCube, function(value) {
            anim.pConst.mCube = value;
        });
        names.push('mCubeSP');
        controls.push(mCubeSliderPanel);

        //collision mult slider
        var colMultSP = UI.MakeSliderPanelPrecise('collision elasticity', '', .05, .95, this.collisionVelocityMult, function(value) {
            anim.collisionVelocityMult = value;
        });
        names.push('colMultSP');
        controls.push(colMultSP);

        var kickSpherePanel = UI.MakeTwoButtonPanel('kickSphere+', 'kick sphere +', function() {
            anim.params.thetaDot += 1;
        }, 'kickSphere-', 'kick sphere -', function() {
            anim.params.thetaDot -= 1;
        });
        names.push('kickSphereP');
        controls.push(kickSpherePanel);

        var kickCubePanel = UI.MakeTwoButtonPanel('kickCube+', 'kick cube +', function() {
            anim.params.phiDot += 1;
        }, 'kickCube-', 'kick cube -', function() {
            anim.params.phiDot -= 1;
        });
        names.push('kickCubeP');
        controls.push(kickCubePanel);

        names.push('finalSpacer');
        controls.push(UI.MakeVertSpacer());

        this.guiMenu.addControls(names, controls);
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