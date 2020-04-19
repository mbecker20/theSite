import { BF } from './babylonStuff.js';

export class MyMats {
    // a collection of initialized Babylon Materials used in various anims
    constructor(scene) {
        //
        this.lightBlue = new BABYLON.StandardMaterial('lightBlue', scene);
        this.lightBlue.diffuseColor = new BABYLON.Color3(.2,.6,.9);

        this.olive = new BABYLON.StandardMaterial('olive', scene);
        this.olive.diffuseColor = BF.ColorRGB(128,128,0);

        this.yellow = new BABYLON.StandardMaterial('yellow', scene);
        this.yellow.diffuseColor = BF.ColorRGB(255,255,0);

        this.red = new BABYLON.StandardMaterial('red', scene);
        this.red.diffuseColor = BF.ColorRGB(255,0,0);

        this.blue = new BABYLON.StandardMaterial('blue', scene);
        this.blue.diffuseColor = BF.ColorRGB(0,0,255);

        this.chill = new BABYLON.StandardMaterial("chill", scene);
        this.chill.diffuseTexture = new BABYLON.Texture("https://images.squarespace-cdn.com/content/537cfc28e4b0785074d4ae25/1471358583532-I9LQ4LV67S3I8Y4XH7DA/?content-type=image%2Fpng", scene);
        
        this.bwPattern = new BABYLON.StandardMaterial("bwPattern", scene);
        this.bwPattern.diffuseTexture = new BABYLON.Texture("https://i.imgur.com/QqKNS1o.png", scene);

        this.blueWavy = new BABYLON.StandardMaterial("bwPattern", scene);
        this.blueWavy.diffuseTexture = new BABYLON.Texture("https://i.imgur.com/CRfSAXN.png", scene);

        this.wArrow = new BABYLON.StandardMaterial("wArrow", scene);
        this.wArrow.diffuseTexture = new BABYLON.Texture("https://i.imgur.com/HhdoVoA.png", scene);

        this.wArrow2 = new BABYLON.StandardMaterial("wArrow2", scene);
        this.wArrow2.diffuseTexture = new BABYLON.Texture("https://i.imgur.com/kczDhDm.png", scene);

        this.xAxis = new BABYLON.StandardMaterial("xAxis", scene);
        this.xAxis.diffuseColor = new BABYLON.Color3(1,0,0);

        this.yAxis = new BABYLON.StandardMaterial("yAxis", scene);
        this.yAxis.diffuseColor = new BABYLON.Color3(0,1,0);

        this.zAxis = new BABYLON.StandardMaterial("zAxis", scene);
        this.zAxis.diffuseColor = new BABYLON.Color3(0,0,1);

        this.zAxis = new BABYLON.StandardMaterial("zAxis", scene);
        this.zAxis.diffuseColor = new BABYLON.Color3(0,0,1);

        this.axesSphere = new BABYLON.StandardMaterial("axesSphere", scene);
        this.axesSphere.diffuseColor = BF.ColorRGB(200,200,200);

        this.sun = new BABYLON.StandardMaterial('sun', scene);
        this.sun.emissiveColor = BF.ColorRGB(255,255,100);

        this.moon = new BABYLON.StandardMaterial('moon', scene);
        this.moon.diffuseTexture = new BABYLON.Texture('https://i.imgur.com/i2iDYgn.png', scene);
        this.moon.emissiveColor = BF.ColorRGB(220,220,220);

        this.darkMoon = new BABYLON.StandardMaterial('darkMoon', scene);
        this.darkMoon.diffuseTexture = this.moon.diffuseTexture;
        this.darkMoon.emissiveColor = BF.ColorRGB(100,100,100);

        this.galaxy = new BABYLON.StandardMaterial('galaxy', scene);
        this.galaxy.diffuseTexture = new BABYLON.Texture('https://i.imgur.com/eZiIipX.png', scene);
        this.galaxy.emissiveColor = BF.ColorRGB(150,150,150);

        this.bluePlanet = new BABYLON.StandardMaterial('bluePlanet', scene);
        this.bluePlanet.diffuseTexture = new BABYLON.Texture('https://i.imgur.com/WuDcHxN.png', scene);
        this.bluePlanet.emissiveColor = BF.ColorRGB(150,150,150);

        this.jupiter = new BABYLON.StandardMaterial('jupiter', scene);
        this.jupiter.diffuseTexture = new BABYLON.Texture('https://i.imgur.com/wAGQBuU.png', scene);

        this.underBlock = new BABYLON.StandardMaterial('underBlock', scene);
        this.underBlock.diffuseTexture = new BABYLON.Texture("https://i.imgur.com/B2vjChP.png", scene);

        this.skyBox = new BABYLON.StandardMaterial("skyBox", scene);
        this.skyBox.backFaceCulling = false;
        this.skyBox.reflectionTexture = new BABYLON.CubeTexture("https://i.imgur.com/0XiOCjt.png", scene);
        this.skyBox.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        this.skyBox.diffuseColor = new BABYLON.Color3(0, 0, 0);
        this.skyBox.specularColor = new BABYLON.Color3(0, 0, 0);

        window.axesMats = [this.xAxis, this.yAxis, this.zAxis, this.axesSphere];
    }
}

export class MySounds {
    // initializes sounds
    constructor(scene) {
        this.animChange = BF.MakeSound('animChange', 'resources/animChange.mp3', scene);

        this.blockHit = BF.MakeSound('blockHit', 'resources/blockHit.mp3', scene, null, {spatialSound: true});

        this.uiClick = BF.MakeSound('uiClick', 'resources/uiClick.mp3', scene);
    }
}