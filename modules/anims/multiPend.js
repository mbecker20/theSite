import { BF } from '../babylonStuff.js';
import { Lagrangian } from '../lagrangian.js';
import { GF, MF } from '../funcClasses.js';
import { UI } from '../gui.js';

export class MultiPend {
    constructor(scene, myMats, shadows, gui) {
        // make node
        this.node = BF.MakeTransformNode('multiPendNode', scene);

        this.numPend = 4;
        this.maxNumPend = 8;
        this.l = 3;
        this.m = .3; // controls radius of cylinder
        this.dampingVal = .35;
        this.collisionVelocityMult = .8;

        // setup lagrangian update system
        this.setupLagrangian();

        this.setupMeshs(scene, shadows);

        this.setMaterials(myMats);

        this.setPos();

        this.setupGUIMenu(gui, this);

        this.imposeBC = GF.DoNothing;
    }

    setupLagrangian() {
        this.dt = .02;
        this.stepsPerFrame = 1;

        this.params = {};
        this.pConst = {g: 10};
        this.damping = {};
        
        for(var i = 0; i < this.maxNumPend; i++) {
            this.params['theta' + i] = 0;
            this.params['theta' + i + 'Dot'] = 0;
            this.pConst['l' + i] = this.l;
            this.pConst['m' + i] = this.m;
            this.damping['theta' + i + 'Dot'] = this.dampingVal;
        }

        this.setPConsts(this.pConst);

        var dx = .01;
        this.makeLagrangians(dx);
        this.activeLagrangian = this.lagrangians['l' + (this.numPend - 1)];
    }

    makePConst(mainPConst, numPend) {
        var pConst = {};
        for(var i = 0; i < numPend; i++) {
            var c = 0;
            for(var j = i; j < numPend; j++) {
                c += mainPConst['m' + j];
            }
            pConst['massSum' + i] = c;
            pConst['tC' + i] = .5 * c * MF.Square(mainPConst['l' + i]);
            pConst['uC' + i] = mainPConst.g * c * mainPConst['l' + i];
            for(var j = 0; j < i; j++) {
                pConst['tcC' + i + j] = c * mainPConst['l' + i] * mainPConst['l' + j];
            }
        }
        return pConst;
    }

    setPConsts(mainPConst) {
        this.pConsts = {};
        for(var i = 0; i < this.maxNumPend; i++) {
            var numPend = i + 1;
            this.pConsts['pc' + i] = this.makePConst(mainPConst, numPend);
        }
    }

    imposeBCOn() {
        for (var i = 1; i < this.numPend; i++) {
            if (Math.cos(this.params['theta' + i] - this.params['theta' + (i - 1)]) < -.9) {
                this.params['theta'+i+'Dot'] = -this.collisionVelocityMult * this.params['theta'+i+'Dot'];
            }
        }
    }

    makeLagrangians(dx) {
        this.lagrangians = {};
        for(var i = 0; i < this.maxNumPend; i++) {
            var numPend = i + 1;
            this.lagrangians['l' + i] = new Lagrangian(this.makeLFuncs(numPend), this.params, this.pConsts['pc' + i], this.damping, dx); 
        }
    }

    makeLFuncs(numPend) {
        var lFuncs = [];

        lFuncs.push(this.makeTFunc(0), this.makeUFunc(0));

        for(var i = 1; i < numPend; i++) {
            lFuncs.push(this.makeTFunc(i), this.makeUFunc(i));
            for(var j = 0; j < i; j++) {
                lFuncs.push(this.makeTCrossFunc(i, j));
            }
        }

        return lFuncs;
    }

    makeTFunc(i) {
        var tFunc = function(p, pConst) {
            return pConst['tC' + i] * MF.Square(p['theta'+i+'Dot']);
        }   
        tFunc.paramKeys = ['theta'+i+'Dot'];
        return tFunc;
    }

    makeTCrossFunc(i, j) {
        var tCrossFunc = function(p, pConst) {
            return pConst['tcC'+i+j] * Math.cos(p['theta'+i] - p['theta'+j]) * p['theta'+i+'Dot'] * p['theta'+j+'Dot'];
        }
        tCrossFunc.paramKeys = ['theta'+i, 'theta'+j, 'theta'+i+'Dot', 'theta'+j+'Dot'];
        return tCrossFunc
    }

    makeUFunc(i) {
        var uFunc = function(p, pConst) {
            return pConst['uC' + i] * Math.cos(p['theta'+i]);
        }
        uFunc.paramKeys = ['theta'+i];
        return uFunc;
    }

    setupMeshs(scene, shadows) {
        this.ground = BABYLON.MeshBuilder.CreateGround('multiPendGround', {width:20,height:20}, scene);
        this.ground.receiveShadows = true;

        var topSphereR = .5;
        this.topSphere = BF.MakeSphere('multiPendTopSphere', scene, 2 * topSphereR);
        this.topSphere.position.y = this.numPend*this.l + 1;
        BF.SetChildren(this.node, [this.ground, this.topSphere]);

        var allMeshes = [this.ground, this.topSphere];
        this.pivots = [];
        this.masses = [];
        this.rods = [];
        for(var i = 0; i < this.maxNumPend; i++) {
            var piv = BF.MakeTransformNode('pivot'+i, scene);
            piv.parent = this.topSphere;
            var mass = this.makeMass(piv, i, scene);
            var rod = this.makeRod(piv, i, scene);
            this.pivots.push(piv);
            this.masses.push(mass);
            this.rods.push(rod);
            allMeshes.push(mass, rod);
        }

        BF.ConnectMeshsToShadows(allMeshes, shadows);

        this.setPendVisibility(this.numPend);
    }

    makeMass(piv, i, scene) {
        var mass = BF.MakeCylinder('mass'+i, scene, .5, 2*Math.sqrt(this.pConst['m'+i]));
        mass.rotation.x = Math.PI/2;
        BF.BakeMeshs([mass]);
        mass.parent = piv;
        mass.position.y = -this.pConst['l'+i];
        return mass;
    }

    makeRod(piv, i, scene) {
        var rod = BF.MakeTube('rod'+i, scene, .25);
        rod.scaling.x = this.pConst['l'+i];
        rod.rotation.z = -Math.PI/2;
        BF.BakeMeshs([rod]);
        rod.parent = piv;
        return rod;
    }

    setMaterials(myMats) {
        this.ground.material = myMats.bluePlanet;
        this.topSphere.material = myMats.darkMoon;
        BF.ForceCompileMaterials([this.ground, this.topSphere]);
        for(var i = 0; i < this.maxNumPend; i++) {
            this.masses[i].material = myMats.sun;
            this.rods[i].material = myMats.wArrow;
            BF.ForceCompileMaterials([this.masses[i], this.rods[i]]);
        }
    }

    setPos() {
        // updates position of mesh based on current params
        this.pivots[0].rotation.z = this.params.theta0;
        var currP = [0,0,0];
        for(var i = 1; i < this.numPend; i++) {
            currP = this.getPivP(i, currP);
            BF.SetVec3(currP, this.pivots[i].position);
            this.pivots[i].rotation.z = this.params['theta'+i];
        }
    }

    getPivP(i, prevP) {
        // returns an ar3
        return math.add(prevP, math.multiply([Math.sin(this.params['theta'+(i-1)]), -Math.cos(this.params['theta'+(i-1)]), 0], this.pConst['l'+(i-1)]));
    }

    step() {
        this.activeLagrangian.step(this.dt, this.stepsPerFrame);
        this.imposeBC();
        this.setPos();
    }

    setDamping(dampingVal) {
        for(var i = 0; i < this.numPend; i++) {
            this.damping['theta'+i+'Dot'] = dampingVal;
        }
    }

    setPendVisibility(numPend) {
        BF.ShowMeshs(this.pivots.slice(1,numPend));
        BF.HideMeshs(this.pivots.slice(numPend));
    }

    updateNumberOfPends(numPend) {
        this.numPend = numPend;
        this.topSphere.position.y = this.numPend * this.l + 1;
        this.setPendVisibility(numPend);
        this.activeLagrangian = this.lagrangians['l' + (numPend - 1)];
    }

    setupGUIMenu(gui, anim) {
        this.guiMenu = UI.MakeSubMenu('sim settings', gui.mainMenu, gui);

        var names = [];
        var controls = [];

        var numPendSlider = UI.MakeIntSliderPanel('number of masses', '', 1, this.maxNumPend, this.numPend, function(value) {
            anim.updateNumberOfPends(value);
        });
        names.push('numPendSlider');
        controls.push(numPendSlider);

        /*
        var bcButton = UI.MakeDualButton('bcBut', 'turn on BC', 'turn off BC', function() {
            anim.imposeBC = GF.DoNothing;
            anim.guiMenu.hideControl('colMultSP');
        }, function() {
            anim.imposeBC = anim.imposeBCOn;
            anim.guiMenu.showControl('colMultSP');
        })
        names.push('bcButton');
        controls.push(bcButton);
        */

        var colMultSP = UI.MakeSliderPanelPrecise('col velocity mult', '', 0, 1, this.collisionVelocityMult, function(value) {
            anim.collisionVelocityMult = value;
        });
        names.push('colMultSP');
        controls.push(colMultSP);

        var kick0 = UI.MakeButton('kick0', 'kick', function() {
            anim.params.theta0Dot += 1.5;
        });
        names.push('kick0');
        controls.push(kick0);

        var dampingSlider = UI.MakeSliderPanelPrecise('damping', '', 0, 1, this.dampingVal, function(value) {
            anim.setDamping(value);
        });
        names.push('dampingSlider');
        controls.push(dampingSlider);

        this.guiMenu.addControls(names, controls);
        this.guiMenu.hideControl('colMultSP');
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