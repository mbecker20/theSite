import { BF, UI } from '../babylonStuff.js';
import { Lagrangian } from '../lagrangian.js';
import { MF } from '../funcClasses.js';

export class PendVsMass {
    constructor(scene, myMats, shadows, gui) {
        // sphere swings, cube up and down
        this.node = new BABYLON.TransformNode('anim4Node', scene);

        // setup lagrangian update system
        this.setupLagrangian();

        // setup meshes
        this.setupMeshs(scene);

        // set materials
        this.setMaterials(myMats);

        // connect meshs to shadows and force pre-compile materials
        BF.ConnectMeshsToShadows([this.ground, this.sphere, this.cube, this.spherePiv, this.cubePiv, this.topRope, this.sphereRope, this.cubeRope], shadows);
        BF.ForceCompileMaterials([this.topRope, this.ground, this.sphere, this.cube, this.spherePiv, this.cubePiv]);

        // set BC
        this.lMin = this.spherePivR + this.sphereR;
        this.lMax = this.lTot - this.cubePivR - this.cubeR;

        // set initial position of everything
        this.setPos();

        this.setupGUIMenu(gui, this);
    }

    getLFuncs() {
        function t0(p, pConst) {
            return .5*(pConst.mSphere + pConst.mCube)*MF.Square(p.lDot);
        }
        t0.paramKeys = ['lDot'];

        function t1(p, pConst) {
            return .5*pConst.mSphere*MF.Square(p.l*p.thetaDot);
        }
        t1.paramKeys = ['l', 'thetaDot'];

        function t2(p, pConst) {
            return pConst.g*p.l*(pConst.mSphere*Math.cos(p.theta) - pConst.mCube);
        }
        t2.paramKeys = ['l', 'theta'];

        return [t0, t1, t2];
    }

    setupLagrangian() {
        this.dt = .02;
        this.stepsPerFrame = 1;
        this.collisionVelocityMult = .2;
        this.params = {l: 8, lDot: 3, theta: 1, thetaDot: 2};
        this.pConst = {mSphere: 1.3, mCube: 1.5, g: 10};
        this.lTot = 14;
        this.damping = {lDot: .01, thetaDot: .01};
        this.lagrangian = new Lagrangian(this.getLFuncs(), this.params, this.pConst, this.damping);
    }

    setPos() {
        var cubeSideLength = (this.lTot - this.params.l)
        var spherePos = math.multiply([Math.sin(this.params.theta), -Math.cos(this.params.theta), 0], this.params.l);
        this.cube.position.y = -cubeSideLength;
        this.cubeRope.scaling.y = cubeSideLength;

        this.sphere.position = BF.Vec3(spherePos);
        this.sphere.rotation.z = this.params.theta;
        this.sphereRope.scaling.y = this.params.l;
        this.sphereRope.rotation.z = this.params.theta;
    }

    step() {
        this.lagrangian.step(this.dt, this.stepsPerFrame);
        this.imposeBC();
        this.setPos();
    }

    imposeBC() {
        // updates params based on boundary conditions
        if(this.params.l > this.lMax) {
            this.params.l = this.lMax;
            this.params.lDot = - this.collisionVelocityMult * this.params.lDot;
        } else if(this.params.l < this.lMin) {
            this.params.l = this.lMin;
            this.params.lDot = - this.collisionVelocityMult * this.params.lDot;
        }
    }

    setupMeshs(scene) {
        this.ground = BABYLON.MeshBuilder.CreateGround('ground4', {width:20,height:20}, scene);
        this.ground.receiveShadows = true;

        this.sphereR = 1.5;
        this.sphere = BF.MakeSphere('sphere5', scene, 2 * this.sphereR);

        this.cubeR = 1.5;
        this.cube = BABYLON.MeshBuilder.CreateBox('cube5', {size: 2 * this.cubeR}, scene);
        this.cube.receiveShadows = true;

        this.spherePivR = .75
        this.spherePiv = BF.MakeCylinder('spherePiv', scene, .5, 2 * this.spherePivR);
        this.spherePiv.rotation.x = Math.PI/2;
        
        this.cubePivR = .75;
        this.cubePiv = BF.MakeCylinder('cubePiv', scene, .5, 2 * this.cubePivR);
        this.cubePiv.rotation.x = Math.PI/2;

        BF.BakeMeshs([this.spherePiv, this.cubePiv]);

        var pivHeight = 15
        this.spherePiv.position = BF.Vec3([0, pivHeight, -2]);
        this.cubePiv.position = BF.Vec3([0, pivHeight, 2]);
        
        this.topRope = BF.MakeTube('topRope', scene, .25);
        this.topRope.scaling.x = 4;
        this.topRope.rotation.y = -Math.PI/2;

        this.sphereRope = BF.MakeTube('sphereRope', scene, .25);
        this.sphereRope.rotation.z = -Math.PI/2;

        this.cubeRope = BF.MakeTube('cubeRope', scene, .25);
        this.cubeRope.rotation.z = -Math.PI/2;
        
        BF.BakeMeshs([this.cubeRope, this.sphereRope]); // have to set length with scaling.y;

        // setup Parenting
        BF.SetChildren(this.node, [this.ground, this.spherePiv, this.cubePiv, this.topRope]);
        BF.SetChildren(this.spherePiv, [this.sphere, this.topRope, this.sphereRope]);
        BF.SetChildren(this.cubePiv, [this.cube, this.cubeRope]);
    }

    setMaterials(myMats) {
        BF.SetMaterial(myMats.wArrow, [this.ground, this.topRope, this.sphereRope, this.cubeRope]);
        BF.SetMaterial(myMats.galaxy, [this.sphere, this.cube, this.spherePiv, this.cubePiv]);
    }

    setupGUIMenu(gui, anim) {
        this.guiMenu = UI.MakeSubMenu('sim settings', gui.mainMenu, gui);

        var names = [];
        var controls = [];

        var kickSpherePanel = UI.MakeTwoButtonPanel('kickSphere+', 'kick sphere +', function() {
            anim.params.thetaDot += 1;
        }, 'kickSphere-', 'kick sphere -', function() {
            anim.params.thetaDot -= 1;
        });
        names.push('kickSphereP');
        controls.push(kickSpherePanel);

        // mass sliders
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

        //theta damping slider
        var thetaDS = UI.MakeSliderPanelPrecise('theta damping', '', 0, .5, this.damping.thetaDot, function(value) {
            anim.damping.thetaDot = value;
        });
        names.push('thetaDS');
        controls.push(thetaDS);

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