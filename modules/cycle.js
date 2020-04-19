import { BF } from './babylonStuff.js';


export class Cycle {
    constructor(scene, myMats, shadowQual) {
        this.time = 0;
        this.dt = .01;
        this.orbitR = 35;
        this.orbitW = .2;
        this.moonW = .5;
        this.skyW = .005;

        this.setupLightsShadows(scene, shadowQual);

        this.setupMeshs(scene, myMats, this.shadows);   
    }

    step() {
        this.ambLight.intensity = this.ambientIntensity(this.time, this.orbitW);

        this.moon.position = this.moonPosition(this.time, this.orbitR, this.orbitW, this.moonPos);
        this.moonLight.position = this.moon.position

        this.sun.position = this.sunPosition(this.time, this.orbitR, this.orbitW, this.sunPos);
        this.sunLight.position = this.sun.position;

        this.moon.rotation.y += this.moonW * this.dt;
        this.skyBox.rotation.y += this.skyW * this.dt;

        this.time += this.dt;
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

        this.ubSize = 36;
        this.underBlock = BABYLON.MeshBuilder.CreateBox('underBlock', {size: this.ubSize}, scene);
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