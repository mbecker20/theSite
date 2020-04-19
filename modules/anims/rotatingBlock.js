import { makePhysBody } from '../physBody.js';
import { BF } from '../babylonStuff.js';
//import { UI } from './modules/gui.js';

export class RotatingBlock {
    constructor(scene, myMats, shadows) {
        this.node = new BABYLON.TransformNode('anim2Node', scene);

        this.ground = BABYLON.MeshBuilder.CreateGround('ground2', {width:10,height:10}, scene);
        this.ground.position = BF.ZeroVec3();
        this.ground.material = myMats.blue;
        this.ground.receiveShadows = true;

        this.cube = BABYLON.MeshBuilder.CreateBox('box', {width:2,height:1,depth:4}, scene);
        this.cube.material = myMats.bwPattern;
        this.cube.receiveShadows = true;
        
        BF.ConnectMeshsToShadows([this.cube, this.ground], shadows);

        var showWArrow = true;
        var showAxes = true;
        this.dt = .002;
        this.cube = makePhysBody(scene, this.cube, BF.ZeroVec3(), [2000,100,50], 1, this.dt, showWArrow, showAxes);
        this.cube.p = BF.Vec3([0, 5, 0]);
        this.cube.position = BF.Vec3([0, 5, 0]);
        this.cube.wArrow.pointer.material = myMats.wArrow;
        this.cube.updateMesh();

        BF.SetChildren(this.node, [this.ground, this.cube, this.cube.wArrow])

        this.stepsPerFrame = 1;
        this.g = 0;

        BF.ForceCompileMaterials([this.cube, this.cube.wArrow.pointer, this.ground]);
    }

    step() {
        for(var i=0; i<this.stepsPerFrame; i++) {
            this.cube.step(this.g, this.dt);
        }
        this.cube.updateMesh();
    }
}