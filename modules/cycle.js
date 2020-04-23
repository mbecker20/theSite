class Cycle {
    // sets up the environment
    static UNDERBLOCKSIZE() {return 80};
    static CAMBOUND() {return Cycle.UNDERBLOCKSIZE()/2};
    static NODEDIST() {return Cycle.CAMBOUND() + .1};
    static TARGETROTMAX() {return Math.PI/2};
    static INTERPCAMSTEPS() {return 20}; // for loop from 1 to (INTERPCAMSTEPS + 1); targetRot = i * INTERPCAMSTEP
    static INTERPCAMSTEP() {return Cycle.TARGETROTMAX()/(Cycle.INTERPCAMSTEPS())}
    static INTERPCAMMULT() {return .1};
    static INTERPCAMALTMULT() {return .03};

    static AXES() {return ['x', 'y', 'z']}

    constructor(scene, myMats, shadowQual) {
        this.time = 0;
        this.dt = .01;
        this.orbitR = Cycle.UNDERBLOCKSIZE()/2 + 30;
        this.orbitW = .2;
        this.moonW = .5;
        this.skyW = .005;

        this.changingFace = false;
        this.targetRot = 0;

        this.setupLightsShadows(scene, shadowQual);

        this.setupMeshs(scene, myMats, this.shadows);
        
        this.makeCamModes(scene);
        this.interpStep = 0;
    }

    step() {
        this.ambLight.intensity = this.ambientIntensity(this.time, this.orbitW);

        this.moon.position = this.moonPosition(this.time, this.orbitR, this.orbitW, this.moonPos);
        this.moonLight.position = this.moon.position

        this.sun.position = this.sunPosition(this.time, this.orbitR, this.orbitW, this.sunPos);
        this.sunLight.position = this.sun.position;

        this.moon.rotation.y += this.moonW * this.dt;
        this.skyBox.rotation.y += this.skyW * this.dt;

        this.checkCam(); // checks if cam is within bounds of cube face
        // if cam is out of bounds, rotates cam about the edge, changes active anim.

        this.time += this.dt;
    }

    checkCam() {
        if (this.changingFace) {
            this.interpCam();
            //this.rotCam();
        } else {
            var ax0 = this.camModes.activeMode.plane[0];
            var ax1 = this.camModes.activeMode.plane[1];
            var pos0 = window.camera.camMesh.position[ax0];
            var pos1 = window.camera.camMesh.position[ax1];
            if (pos0 >= Cycle.CAMBOUND()) {
                //window.camera.suspendMoveInput = true;
                this.changingFace = true;
                this.changeFaceEdge = 'pos'.concat(ax0);
                window.animState.switchActiveAnim(this.camModes[this.changeFaceEdge].animKey);
            } else if (pos0 <= -Cycle.CAMBOUND()) {
                //window.camera.suspendMoveInput = true;
                this.changingFace = true;
                this.changeFaceEdge = 'neg'.concat(ax0);
                window.animState.switchActiveAnim(this.camModes[this.changeFaceEdge].animKey);
            } else if (pos1 >= Cycle.CAMBOUND()) {
                //window.camera.suspendMoveInput = true;
                this.changingFace = true;
                this.changeFaceEdge = 'pos'.concat(ax1);
                window.animState.switchActiveAnim(this.camModes[this.changeFaceEdge].animKey);
            } else if (pos1 <= -Cycle.CAMBOUND()) {
                //window.camera.suspendMoveInput = true;
                this.changingFace = true;
                this.changeFaceEdge = 'neg'.concat(ax1);
                window.animState.switchActiveAnim(this.camModes[this.changeFaceEdge].animKey);
            }
        }
    }

    interpCam() {
        if (this.interpStep < Cycle.INTERPCAMSTEPS()) {
            this.targetRot += Cycle.INTERPCAMSTEP();
            this.interpStep++;
            var deltaRot = Cycle.INTERPCAMMULT() * this.targetRot;
            window.camera.camMesh.rotate(this.camModes.activeMode[this.changeFaceEdge].rotAxis, deltaRot, BABYLON.Space.WORLD);
            this.targetRot -= deltaRot;
            window.camera.rotation.x -= Cycle.INTERPCAMALTMULT() * window.camera.rotation.x;
        } else {
            var deltaRot = Cycle.INTERPCAMMULT() * this.targetRot;
            window.camera.camMesh.rotate(this.camModes.activeMode[this.changeFaceEdge].rotAxis, deltaRot, BABYLON.Space.WORLD);
            this.targetRot -= deltaRot;
            if(this.targetRot < .0001) {
                this.targetRot = 0;
                this.interpStep = 0;
                //window.camera.suspendMoveInput = false;
                this.camModes.activeMode = this.camModes[this.camModes.activeMode[this.changeFaceEdge].newModeKey];
                this.changingFace = false;
            }
            window.camera.rotation.x -= Cycle.INTERPCAMALTMULT() * window.camera.rotation.x;
        }
    }

    rotCam() {
        if (this.interpStep < Cycle.INTERPCAMSTEPS()) {
            this.interpStep++;
            window.camera.camMesh.rotate(this.camModes.activeMode[this.changeFaceEdge].rotAxis, Cycle.INTERPCAMSTEP(), BABYLON.Space.WORLD);
        } else {
            this.interpStep = 0;
            //window.camera.suspendMoveInput = false;
            this.camModes.activeMode = this.camModes[this.camModes.activeMode[this.changeFaceEdge].newModeKey];
            this.changingFace = false;
        }
    }

    makeCamModes(scene) {
        this.camModes = {};
        this.modeKeys = ['posy', 'negy', 'posx', 'negx', 'posz', 'negz'];

        // setup base modes structure;
        for (var i = 0; i < Cycle.AXES().length; i++) {
            var plane = [Cycle.AXES()[(i+1)%3], Cycle.AXES()[(i+2)%3]];
            var pos = {};
            pos['pos'.concat(plane[0])] = {'newModeKey': 'pos'.concat(Cycle.AXES()[(i+1)%3])};
            pos['neg'.concat(plane[0])] = {'newModeKey': 'neg'.concat(Cycle.AXES()[(i+1)%3])};
            pos['pos'.concat(plane[1])] = {'newModeKey': 'pos'.concat(Cycle.AXES()[(i+2)%3])};
            pos['neg'.concat(plane[1])] = {'newModeKey': 'neg'.concat(Cycle.AXES()[(i+2)%3])};
            pos.plane = plane;

            var neg = {};
            neg['pos'.concat(plane[0])] = {'newModeKey': 'pos'.concat(Cycle.AXES()[(i+1)%3])};
            neg['neg'.concat(plane[0])] = {'newModeKey': 'neg'.concat(Cycle.AXES()[(i+1)%3])};
            neg['pos'.concat(plane[1])] = {'newModeKey': 'pos'.concat(Cycle.AXES()[(i+2)%3])};
            neg['neg'.concat(plane[1])] = {'newModeKey': 'neg'.concat(Cycle.AXES()[(i+2)%3])};
            neg.plane = plane;

            this.camModes['pos'.concat(Cycle.AXES()[i])] = pos;
            this.camModes['neg'.concat(Cycle.AXES()[i])] = neg;
        }

        this.camModes.posx.posy.rotAxis = BF.Vec3([0,0,1]);
        this.camModes.posx.negy.rotAxis = BF.Vec3([0,0,-1]);
        this.camModes.posx.posz.rotAxis = BF.Vec3([0,-1,0]);
        this.camModes.posx.negz.rotAxis = BF.Vec3([0,1,0]);

        this.camModes.negx.posy.rotAxis = BF.Vec3([0,0,-1]);
        this.camModes.negx.negy.rotAxis = BF.Vec3([0,0,1]);
        this.camModes.negx.posz.rotAxis = BF.Vec3([0,1,0]);
        this.camModes.negx.negz.rotAxis = BF.Vec3([0,-1,0]);

        this.camModes.posy.posx.rotAxis = BF.Vec3([0,0,-1]);
        this.camModes.posy.negx.rotAxis = BF.Vec3([0,0,1]);
        this.camModes.posy.posz.rotAxis = BF.Vec3([1,0,0]);
        this.camModes.posy.negz.rotAxis = BF.Vec3([-1,0,0]);

        this.camModes.negy.posx.rotAxis = BF.Vec3([0,0,1]);
        this.camModes.negy.negx.rotAxis = BF.Vec3([0,0,-1]);
        this.camModes.negy.posz.rotAxis = BF.Vec3([-1,0,0]);
        this.camModes.negy.negz.rotAxis = BF.Vec3([1,0,0]);

        this.camModes.posz.posx.rotAxis = BF.Vec3([0,1,0]);
        this.camModes.posz.negx.rotAxis = BF.Vec3([0,-1,0]);
        this.camModes.posz.posy.rotAxis = BF.Vec3([-1,0,0]);
        this.camModes.posz.negy.rotAxis = BF.Vec3([1,0,0]);

        this.camModes.negz.posx.rotAxis = BF.Vec3([0,-1,0]);
        this.camModes.negz.negx.rotAxis = BF.Vec3([0,1,0]);
        this.camModes.negz.posy.rotAxis = BF.Vec3([1,0,0]);
        this.camModes.negz.negy.rotAxis = BF.Vec3([-1,0,0]);

        this.camModes.activeMode = this.camModes.posy;
        this.makeAnimNodes(scene);
    }

    makeAnimNodes(scene) {
        this.camModes.posy.node = BF.MakeTransformNode('posy', scene);
        this.camModes.posy.node.position.y = Cycle.NODEDIST();

        this.camModes.negy.node = BF.MakeTransformNode('negy', scene);
        this.camModes.negy.node.rotation.x = Math.PI;
        this.camModes.negy.node.position.y = -Cycle.NODEDIST();

        this.camModes.posx.node = BF.MakeTransformNode('posx', scene);
        this.camModes.posx.node.rotation.z = -Math.PI/2;
        this.camModes.posx.node.position.x = Cycle.NODEDIST();

        this.camModes.negx.node = BF.MakeTransformNode('negx', scene);
        this.camModes.negx.node.rotation.z = Math.PI/2;
        this.camModes.negx.node.position.x = -Cycle.NODEDIST();

        this.camModes.posz.node = BF.MakeTransformNode('posz', scene);
        this.camModes.posz.node.rotation.x = Math.PI/2;
        this.camModes.posz.node.position.z = Cycle.NODEDIST();

        this.camModes.negz.node = BF.MakeTransformNode('negz', scene);
        this.camModes.negz.node.rotation.x = -Math.PI/2;
        this.camModes.negz.node.position.z = -Cycle.NODEDIST();
    }

    addAnimsToCycle(anims) {
        var animKeys = Object.keys(anims);
        for (var i = 0; i < this.modeKeys.length; i++) {
            this.camModes[this.modeKeys[i]].animKey = animKeys[i];
            anims[animKeys[i]].node.parent = this.camModes[this.modeKeys[i]].node;
        }
    }

    setupLightsShadows(scene, shadowQual) {
        this.ambLight = new BABYLON.HemisphericLight('ambLight', new BABYLON.Vector3(0,1,0), scene);
        
        this.moonPos = BF.ZeroVec3();
        this.moonLight = new BABYLON.PointLight('moonLight', this.moonPos, scene);
        this.moonLight.intensity = .5
        this.moonLight.diffuse = BF.ColorRGB(100,100,100);
 
        this.shadowQual = 1024 // 512 or 1024 for laptop, 2048 for desktop

        var moonShadows = new BABYLON.ShadowGenerator(shadowQual, this.moonLight);
        moonShadows.usePoissonSampling = true;
        //moonShadows.useExponentialShadowMap = true;
        //moonShadows.useBlurExponentialShadowMap = true;

        this.sunPos = BF.ZeroVec3()
        this.sunLight = new BABYLON.PointLight('sunLight', this.sunPos, scene);
        this.sunLight.intensity = .7;
        this.sunLight.diffuse = BF.ColorRGB(255,255,153);

        var sunShadows = new BABYLON.ShadowGenerator(shadowQual, this.sunLight);
        sunShadows.usePoissonSampling = true;
        //sunShadows.useExponentialShadowMap = true;

        this.shadows = [moonShadows, sunShadows];
    }

    ambientIntensity(t, w) {
        return .5*(1+.4*Math.sin(w*t)) //sun rising at t = 0;
    }

    setupMeshs(scene, myMats, shadows) {
        //make skybox
        this.skyBox = new BABYLON.MeshBuilder.CreateBox('skybox', {size: 1000}, scene);
        this.skyBox.material = myMats.skyBox;

        //create sun and moon meshs
        this.moon = BABYLON.MeshBuilder.CreateSphere('moon', {diameter:8, segments:16}, scene);
        this.moon.material = myMats.moon;
        
        this.sun = BABYLON.MeshBuilder.CreateSphere('moon', {diameter:8, segments:16}, scene);
        this.sun.material = myMats.sun;

        //place axes at origin for reference during development
        //var worldAxes = BF.MakeAxes('worldAxes', scene, 4);

        this.underBlock = BABYLON.MeshBuilder.CreateBox('underBlock', {size: Cycle.UNDERBLOCKSIZE()}, scene);
        this.underBlock.material = myMats.darkMoon;
        this.underBlock.receiveShadows = true;

        BF.ConnectToShadows(this.underBlock, shadows);

        BF.ForceCompileMaterials([this.moon, this.sun, this.underBlock, this.skyBox]);
    }

    moonPosition(t, r, w, moonPos) {
        return BF.SetVec3([0, -Math.sin(w*t), Math.cos(w*t)], moonPos).scale(r);
    }

    sunPosition(t, r, w, sunPos) {
        return BF.SetVec3([Math.cos(w*t), Math.sin(w*t), 0], sunPos).scale(r);
    }
} 