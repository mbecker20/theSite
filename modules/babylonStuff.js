class BF {
    // mesh constructors
    static MakeBox(name, scene, width, height, depth, otherParams = {}, receiveShadows = true) {
        // params: length, width, height,...
        // lwh is ar3 ([length, width, height])
        otherParams.width = width; //x
        otherParams.height = height; //y
        otherParams.depth = depth; //z
        var box = BABYLON.MeshBuilder.CreateBox(name, otherParams, scene);
        box.receiveShadows = receiveShadows;
        return box;
    }

    static MakeSphere(name, scene, diameter, segments = 16, otherParams = {}, receiveShadows = true) {
        // params: diameter, segments
        otherParams.diameter = diameter;
        otherParams.segments = segments;
        var sphere = BABYLON.MeshBuilder.CreateSphere(name, otherParams, scene);
        sphere.receiveShadows = receiveShadows;
        return sphere;
    }

    static MakeTransformNode(name, scene) {
        return new BABYLON.TransformNode(name, scene);
    }

    static MakeCylinder(name, scene, height, diameter, tessellation = 24, otherParams = {}, receiveShadows = true) {
        // params: height, diameter, tessellation
        otherParams.height = height;
        otherParams.diameter = diameter;
        otherParams.tessellation = tessellation;
        var cyl = BABYLON.MeshBuilder.CreateCylinder(name, otherParams, scene);
        cyl.receiveShadows = receiveShadows;
        return cyl;
    }

    static MakePlane(name, scene, width, height) {
        // plane is oriented in x - y
        return BABYLON.MeshBuilder.CreatePlane(name, {width: width, height: height}, scene);
    }

    static MakeArrow(name, scene, direction, diameter, arrowDiameter) {
        //name is string
        //vertices pointing [1,0,0];
        //tail at origin;
        //direction is ar3
        var tube = BABYLON.MeshBuilder.CreateCylinder(name.concat(' tube'), {height: .85, diameter: diameter, tessellation: 24}, scene);
        var tip = BABYLON.MeshBuilder.CreateCylinder(name.concat(' tip'), {height: .15, diameterTop: 0, diameterBottom: arrowDiameter, tessellation: 24}, scene);
        tube.locallyTranslate(BF.Vec3([0,.425,0]));
        tube.bakeCurrentTransformIntoVertices();
        tip.locallyTranslate(BF.Vec3([0,.925,0]));
        tip.bakeCurrentTransformIntoVertices();

        var arrow = BF.MakeTransformNode(name, scene); // this is the top level rotator (last to be rotated);
        arrow.secondRot = BF.MakeTransformNode(name.concat(' secondRot'), scene); // second to be rotated
        arrow.secondRot.parent = arrow;

        arrow.pointer = BABYLON.Mesh.MergeMeshes([tube,tip]); // first to be rotated (about x axis);
        arrow.pointer.rotation.z = -Math.PI/2; // aligns with x axis;
        arrow.pointer.bakeCurrentTransformIntoVertices();
        arrow.pointer.parent = arrow.secondRot;

        arrow.setDirLength = function(ar3) {
            const length = VF.Mag(ar3);
            const unit = VF.Unit2(ar3, length);
            arrow.pointer.scaling.x = length;
            if(Math.abs(unit[1]) < .7) { // xz ground altitude and azimuth if unit not close to +/- y axis
                arrow.setDirLengthXZ(unit);
            } else { // xy ground altitude and azimuth
                arrow.setDirLengthXY(unit);
            }
        }

        arrow.setDirLengthXZ = function(unit) {
            const altAzim = VF.GetAltAzimXZ(unit);
            arrow.secondRot.rotation.z = altAzim[0];
            arrow.rotation.y = altAzim[1];
            arrow.secondRot.rotation.y = 0;
            arrow.rotation.z = 0;
        }

        arrow.setDirLengthXY = function(unit) {
            const altAzim = VF.GetAltAzimXY(unit);
            arrow.secondRot.rotation.y = altAzim[0];
            arrow.rotation.z = altAzim[1];
            arrow.secondRot.rotation.z = 0;
            arrow.rotation.y = 0;
        }

        arrow.addRot = function(deltaRot) {
            // first rotates arrow around its pointer x axis
            arrow.pointer.rotation.x += deltaRot;
        }

        arrow.setDirLength(direction);

        return arrow;
    }

    static MakeAxes(name, scene, length, mats = window.axesMats) {
        // mats is ar4[materials] for x y and z axes, and center sphere
        // parent axes
        var diameter = .4;
        var arrowDiameter = .6;
        var sphereDiameter = .8;

        var axes = new BABYLON.TransformNode('axes', scene);

        var xAxis = BF.MakeArrow(name.concat(' xAxis'), scene, [length,0,0], diameter, arrowDiameter);
        xAxis.pointer.material = mats[0];
        xAxis.parent = axes;

        var yAxis = BF.MakeArrow(name.concat(' yAxis'), scene, [0,length,0], diameter, arrowDiameter);
        yAxis.pointer.material = mats[1];
        yAxis.parent = axes;

        var zAxis = BF.MakeArrow(name.concat(' zAxis'), scene, [0,0,length], diameter, arrowDiameter);
        zAxis.pointer.material = mats[2];
        zAxis.parent = axes;

        var center = BABYLON.MeshBuilder.CreateSphere(name.concat(' sphere'), {segments:16, diameter:sphereDiameter}, scene);
        center.material = mats[3];
        center.parent = axes;

        BF.ForceCompileMaterials([xAxis.pointer, yAxis.pointer, zAxis.pointer, center]);

        return axes;
    }

    static MakeTHandle(name, scene, mainLength, mainDiameter, crossLength, crossDiameter) {
        // main oriented along x axis
        // cross oriented along y axis shifted to positive z
        var main = BABYLON.MeshBuilder.CreateCylinder(name.concat(' main'), {height: mainLength, diameter: mainDiameter, tessellation: 24}, scene);
        var cross = BABYLON.MeshBuilder.CreateCylinder(name.concat(' cross'), {height: crossLength, diameter: crossDiameter, tessellation: 24}, scene);

        main.rotation.x = Math.PI/2;
        main.bakeCurrentTransformIntoVertices();

        cross.locallyTranslate(BF.Vec3([0,0,mainLength/2]));
        cross.bakeCurrentTransformIntoVertices();

        var tHandle = BABYLON.Mesh.MergeMeshes([main,cross]);

        return tHandle;
    }

    static MakeTube(name, scene, diameter, receiveShadows = true) {
        //name is string
        //pointing [1,0,0];
        //tail at origin;
        //direction is ar3
        var tube = BABYLON.MeshBuilder.CreateCylinder(name, {height: 1, diameter: diameter, tessellation: 24}, scene);
        tube.locallyTranslate(BF.Vec3([0,.5,0]));
        tube.bakeCurrentTransformIntoVertices();
        tube.rotation.z = -Math.PI/2;
        tube.bakeCurrentTransformIntoVertices();
        tube.receiveShadows = receiveShadows;

        return tube;
    }

    // sound constructor
    static MakeSound(name, path, scene, onLoadFn = null, otherParams = {}) {
        return new BABYLON.Sound(name, path, scene, onLoadFn, otherParams);
    }

    // other helpers
    static GetOTens(mesh) {
        mesh.computeWorldMatrix();
        const ar = mesh.getWorldMatrix()._m;
        return [[ar[0],ar[1],ar[2]],[ar[4],ar[5],ar[6]],[ar[8],ar[9],ar[10]]];
    }

    static GetRotMat2(matrix) {
        const ar=matrix._m;
        return [[ar[0],ar[1],ar[2]],[ar[4],ar[5],ar[6]],[ar[8],ar[9],ar[10]]];
    }

    static MakeWorldMat(oTens,position) {
        //oTens is ar3x3, position is babylon vec3
        let mat = BABYLON.Matrix.Identity();
        mat.setRow(0,BF.Vec4_2(oTens[0],0));
        mat.setRow(1,BF.Vec4_2(oTens[1],0));
        mat.setRow(2,BF.Vec4_2(oTens[2],0));
        mat.setRow(3,BF.Vec4_2([position.x,position.y,position.z],1))
        return mat;
    }

    static SetWorldMat(oTens,position,target,rows) {
        //oTens is ar3x3, position is babylon vec3
        //target is the initialized matrix to become worldMat
        //rows is initialized ar4[BABYLON.Vector4];
        target.setRow(0,BF.SetVec4_2(oTens[0], 0, rows[0]));
        target.setRow(1,BF.SetVec4_2(oTens[1], 0, rows[1]));
        target.setRow(2,BF.SetVec4_2(oTens[2], 0, rows[2]));
        target.setRow(3,BF.SetVec4_2([position.x,position.y,position.z], 1, rows[3]))
    }

    static MatTo2DArray(mat4) {
        const ar=mat4._m;
        return [[ar[0],ar[1],ar[2],ar[3]],[ar[4],ar[5],ar[6],ar[7]],[ar[8],ar[9],ar[10],ar[11]],[ar[12],ar[13],ar[14],ar[15]]];
    }

    static Array2DToRotMat(mat3) {
        //converts 3x3 array to babylon rotation matrix
        let mat = BABYLON.Matrix.Identity();
        mat.setRow(0,BF.Vec4_2(mat3[0],0));
        mat.setRow(1,BF.Vec4_2(mat3[1],0));
        mat.setRow(2,BF.Vec4_2(mat3[2],0));
        return mat;
    }

    static Vec2(ar2) {
        return new BABYLON.Vector2(ar2[0], ar2[1]);
    }

    static SetVec2(ar2, target) {
        target.set(ar2[0], ar2[1]);
        return target;
    }

    static Vec3(ar3) {
        return new BABYLON.Vector3(ar3[0],ar3[1],ar3[2]);
    }

    static SetVec3(ar3, target) {
        target.set(ar3[0],ar3[1],ar3[2]);
        return target;
    }

    static SetVec3R(vec0, vec1, target) {
        // sets target vec3 to be vec1 - vec0
        // vec points from vec0 to vec1
        target.x = vec1.x - vec0.x;
        target.y = vec1.y - vec0.y;
        target.z = vec1.z - vec0.z;
    }

    static CopyVec3(vec3) {
        return new BABYLON.Vector3(vec3.x, vec3.y, vec3.z);
    }

    static CopyVec3ToTarget(vec3, target) {
        target.x = vec3.x;
        target.y = vec3.y;
        target.z = vec3.z;
    }

    static Vec4(ar4) {
        //converts array of length 4 to babylon vec4
        return new BABYLON.Vector4(ar4[0],ar4[1],ar4[2],ar4[3]);
    }

    static ZeroVec3() {
        return BF.Vec3([0,0,0]);
    }

    static ZeroVec4() {
        return BF.Vec4([0,0,0,0]);
    }

    static Vec4_2(ar3,w) {
        //converts array of length 3 and one additional number to babylon vec4
        return new BABYLON.Vector4(ar3[0],ar3[1],ar3[2],w);
    }

    static SetVec4_2(ar3,w,target) {
        //converts array of length 3 and one additional number to babylon vec4
        //target is already initialized
        return target.set(ar3[0],ar3[1],ar3[2],w);
    }

    static MakeWorldMatRows() {
        // initializes vec4 to be used to make world mat
        var rows = [];
        for(var i = 0; i < 4; i++) {
            rows.push(BF.ZeroVec4());
        }
        return rows;
    }

    static Mat4(row1,row2,row3,row4) {
        let mat=new BABYLON.Matrix();
        mat.setRow(0,BF.Vec4(row1[0],row1[1],row1[2],row1[3]));
        mat.setRow(1,BF.Vec4(row2[0],row2[1],row2[2],row2[3]));
        mat.setRow(2,BF.Vec4(row3[0],row3[1],row3[2],row3[3]));
        mat.setRow(3,BF.Vec4(row4[0],row4[1],row4[2],row4[3]));
        return mat;
    }

    static Vec3ToAr(vec3) {
        return [vec3.x, vec3.y, vec3.z];
    }

    static AddScaleArToVec3(ar1, ar1Scale, ar2, ar2Scale) {
        // adds 2 ar3 and puts result in Babylon Vec3
        // arrays are scaled before addition
        return BF.Vec3(math.add(math.multiply(ar1,ar1Scale), math.multiply(ar2, ar2Scale)));
    }

    static ListToVec3(arOfAr){
        // [[x1,y1,z1],[x2,y2,z2]] => [BABYLON.Vec3,...]
        arOfAr.forEach(ar => BF.Vec3(ar));
    }

    static BakeMeshs(meshs) {
        // meshs is ar(mesh)
        for(var i = 0; i < meshs.length; i++) {
            meshs[i].bakeCurrentTransformIntoVertices();
        }
    }

    static ForceCompileMaterials(meshs) {
        // meshs is array of Babylon meshs
        // forces computation of materials applied to meshs
        for(var i = 0; i < meshs.length; i++) {
            meshs[i].material.forceCompilation(meshs[i]);
        }
    }

    static ConnectToShadows(mesh, shadows, includeChildren = false) {
        //shadows is array of Babylon shadowgenerators
        for(var i = 0; i < shadows.length; i++) {
            shadows[i].addShadowCaster(mesh, includeChildren);
        }
    }

    static ConnectMeshsToShadows(meshs, shadows, includeChildren = false) {
        //now meshs is array of Babylon Meshes
        for(var i = 0; i < meshs.length; i++) {
            BF.ConnectToShadows(meshs[i], shadows, includeChildren);
        }
    }

    static SetChildren(parent, children) {
        // parent is parent mesh
        // children is array of meshs to be set as children
        for(var i = 0; i < children.length; i++) {
            children[i].parent = parent;
        }
    }

    static MakeGridXZ(corner, distance, numX, numZ) {
        // corner is the -x, -z corner of grid (ar3)
        // distance is distance between the gridpoints
        // numX/Z is number of x/z gridpoints
        let grid = [];
        for(var i = 0; i < numX; i++) {
            let row = [];
            for(var j = 0; j < numZ; j++) {
                row.push(BF.Vec3(math.add(corner, [i*distance, 0, j*distance])));
            }
            grid.push(row);
        }
        return grid;
    }

    static Hide(mesh) {
        mesh.setEnabled(false);
    }

    static Show(mesh) {
        mesh.setEnabled(true);
    }

    static HideMeshs(meshs) {
        for(var i = 0; i < meshs.length; i++) {
            meshs[i].setEnabled(false);
        }
    }

    static ShowMeshs(meshs) {
        for(var i = 0; i < meshs.length; i++) {
            meshs[i].setEnabled(true);
        }
    }

    static SetMaterial(material, meshs, preCompile = true) {
        for(var i = 0; i < meshs.length; i++) {
            meshs[i].material = material;
        }
        if(preCompile) {
            BF.ForceCompileMaterials(meshs);
        }
    }

    static ColorRGB(r,g,b) {
        // 0 to 255 instead of 0 to 1;
        return new BABYLON.Color3(r/255, g/255, b/255);
    }

    static GetGlobalVolume() {
        return BABYLON.Engine.audioEngine.getGlobalVolume();
    }

    static SetGlobalVolume(value) {
        // from 0 to 100
        BABYLON.Engine.audioEngine.setGlobalVolume(value);
    }

    static ResumeAudioContext() {
        BABYLON.Engine.audioEngine.audioContext.resume();
    }

    static DoMeshsIntersect(mesh0, mesh1, precise = false) {
        return mesh0.intersectsMesh(mesh1, precise);
    }

    static TransformVecWorldToMeshLocal(mesh, vec3) {
        // transforms input vec3 to local space given by mesh
        // returns ar3
        var oTens = BF.GetOTens(mesh);
        return math.multiply(oTens, BF.Vec3ToAr(vec3));
    }

    static TransformVecWorldToOTensLocal(oTens, vec3) {
        // transforms input vec3 to local space given by mesh
        // returns ar3
        return math.multiply(oTens, BF.Vec3ToAr(vec3));
    }

    static TransformArMeshLocalToWorld(mesh, ar3) {
        // transforms input ar3 from local space given by mesh to world space
        // returns ar3
        var oTens = BF.GetOTens(mesh);
        return math.multiply(ar3, oTens);
    }

    static MakeAnimState(anims, gui) {
        // makes animstate without choose anim menu
        var animKeys = Object.keys(anims);
        var animState = {anims: anims};
        animState.switchActiveAnim = function(animKey) {
            window.sounds.animChange.play();
            if (animState.activeAnim.guiMenu.panel.isVisible) {
                gui.setActiveMenu(animState.anims[animKey].guiMenu);
            }
            animState.activeAnim.deactivate();
            animState.activeAnim = animState.anims[animKey];
            animState.activeAnim.activate();
        }
        var animMenus = [];
        for(var i = 0; i < animKeys.length; i++) {
            if (i === 0) {
                animState.activeAnim = anims[animKeys[i]];
            } else {
                anims[animKeys[i]].deactivate();
            }
            animMenus.push(animState.anims[animKeys[i]].guiMenu);
        }
        gui.mainMenu.addOneOfSubMenus('animSettings', animMenus);
        return animState;
    }
}

class Cam {

    static HEIGHT() {return 12};

    static TARGETPOSITIONSTEP() {return .35;}
    static KBMOVEINTERPMULT() {return .08}

    static TARGETROTATIONSTEP() {return .05}
    static KBROTINTERPMULT() {return .08}

    static MINALT() {return -.8 * Math.PI/2}
    static MAXALT() {return .8 * Math.PI/2}

    static GRAVITY() {return .01}
    static JUMPV() {return .4}
    static BOUNCEACCELDOWN() {return .04}// delta jumpV when jumpV < 0 during bounce
    static BOUNCEINTERPMULT() {return .1}

    static CROUCHHEIGHT() {return 4} // height cam goes to when crouching
    static CROUCHSTEP() {return .2}
    static CROUCHINTERPMULT() {return .2}

    static JOYSTICKMOVEMULT() {return .05} // delta target step = joystickmovemult * (stickpos - centerpos)
    static JOYSTICKMOVEINTERPMULT() {return .3}

    static HYBRIDROTMULT() {return .018}
    static HYBRIDROTINTERPMULT() {return .3}

    static JOYSTICKROTMULT() {return .005}
    static JOYSTICKROTINTERPMULT() {return .3}

    static MakeCam(camPos, scene, canvas, engine) {
        var cam = new BABYLON.TargetCamera('camera', BF.ZeroVec3(), scene);

        cam.setupCam = function() {
            // make and parent camMesh to cam
            cam.camMesh = BF.MakeBox('camMesh', scene, 1, Cam.HEIGHT() + .5, 1);
            cam.camMesh.locallyTranslate(BF.Vec3([0, (Cam.HEIGHT() + .5)/2, 0]));
            BF.BakeMeshs([cam.camMesh]);
            camPos.y -= Cam.HEIGHT();
            cam.camMesh.position = camPos;
            cam.parent = cam.camMesh;
            cam.position.y = Cam.HEIGHT();

            // make input manager
            cam.inputs = new BABYLON.CameraInputsManager(cam);

            // add custom inputs
            cam.inputs.add(Cam.MakeKBRotateInput(cam, canvas));
            cam.inputs.add(Cam.MakeKBMoveInput(cam, canvas));
            cam.inputs.attachElement(canvas);

            cam.attachControl(canvas);

            // initialize vector to be set and added to position
            cam.deltaPos = BF.ZeroVec3();

            // setup rotation
            cam.upVec = BF.Vec3([0,1,0]); // vector camMesh is rotated locally about for azim rotation
            cam.deltaAlt = 0;
            cam.deltaAzim = 0;

            //setup jumping
            cam.ground = null; // set this once the ground mesh is created;
            cam.onGround = false; // mode. whether mesh is onground
            cam.bounceOnGround = false; // mode. bounce a little after contacting ground;
            cam.jumpV = 0;
            cam.bounceV = 0;
            cam.bounceDist = 0; // returns to 0 after bounce finishes

            // setup crouching
            cam.crouchV = 0;
            cam.targetCrouch = Cam.HEIGHT();

            // to disable things
            cam.suspendInputChecking = false;
            cam.suspendRotToTarget = false;
            cam.suspendMoveToTarget = false;
        }

        cam.setupCam();
        Cam.SetupKBControl(cam);
        Cam.SetupVirtualControl(cam, engine);

        // set methods
        cam.step = function() {
            // step funcs must not have input
            if (!cam.suspendInputChecking) {
                cam.inputs.checkInputs();
                cam.virtualControllerCheck();
            }
            if (!cam.suspendRotToTarget) {
                cam.rotToTarget();
            } if (!cam.suspendMoveToTarget) {
                cam.moveToTarget()
            }
            for(var i = 0; i < cam.stepFuncs.length; i++) {
                cam.stepFuncs[i]();
            }
        }

        cam.moveToTarget = function() {
            cam.kbMoveToTarget();
            cam.jsMoveToTarget();
            cam.camMesh.locallyTranslate(BF.SetVec3([cam.kbSideV + cam.jsSideV, cam.jumpV, cam.kbForwardV + cam.jsForwardV], cam.deltaPos));
            cam.position.y += cam.crouchV + cam.bounceV;
            cam.updateJump();
            cam.updateBounce();
        }

        cam.rotToTarget = function() {
            cam.kbRotToTarget();
            cam.jsRotToTarget();

            cam.deltaAlt = cam.kbDeltaAlt + cam.jsDeltaAlt;
            cam.rotation.x += cam.deltaAlt;
            cam.boundAlt();

            cam.deltaAzim = cam.kbDeltaAzim + cam.jsDeltaAzim;
            cam.camMesh.rotate(cam.upVec, cam.deltaAzim, BABYLON.Space.LOCAL);
        }

        cam.boundAlt = function() {
            if (cam.rotation.x > Cam.MAXALT()) {
                cam.rotation.x = Cam.MAXALT();
                cam.kbTargetRot.x = 0;
                cam.jsTargetRot.x = 0;
            } else if (cam.rotation.x < Cam.MINALT()) {
                cam.rotation.x = Cam.MINALT();
                cam.kbTargetRot.x = 0;
                cam.jsTargetRot.x = 0;
            }
        }

        cam.onGroundCheck = function() {
            cam.onGround = BF.DoMeshsIntersect(cam.camMesh, cam.ground);
        }

        cam.updateJump = function() {
            // updates the jumping state;
            if (!cam.onGround) {
                if (BF.DoMeshsIntersect(cam.camMesh, cam.ground)) {
                    cam.bounceV = cam.jumpV;
                    cam.jumpV = 0;
                    cam.onGround = true;
                    cam.bounceOnGround = true;
                } else {
                    cam.jumpV -= Cam.GRAVITY();
                }
            }
        }

        cam.updateBounce = function() {
            if (cam.bounceOnGround) {
                if (cam.bounceV < 0) { // on its way down
                    cam.bounceV += Cam.BOUNCEACCELDOWN();
                } else { // on its way up
                    var dist = cam.targetCrouch - cam.position.y;
                    cam.bounceV = Cam.BOUNCEINTERPMULT() * dist;
                    if(dist < 0.01) {
                        cam.bounceOnGround = false;
                        cam.bounceV = 0;
                    }
                }
            }
        }

        cam.updateCrouch = function() {
            if (cam.bounceOnGround) {
                cam.crouchV = 0;
            } else {
                cam.crouchV = Cam.CROUCHINTERPMULT() * (cam.targetCrouch - cam.position.y);
            }

        }

        cam.setLookDirection = function(ar3) {
            // this only works if done during initialization. after first step, rotationQuaternion is being used instead of rotation
            const unit = VF.Unit(ar3);
            const altAzim = VF.GetAltAzimZX(unit);
            cam.rotation.x = MF.Clamp(altAzim[0], Cam.MINALT(), Cam.MAXALT());
            cam.camMesh.rotation.y = altAzim[1];
        }

        cam.lookAt = function(ar3) {
            // orients camera to be looking at specified point
            cam.setLookDirection(VF.R(BF.Vec3ToAr(cam.camMesh.position), ar3));
        }

        cam.stepFuncs = [cam.updateCrouch, cam.onGroundCheck];

        return cam;
    }

    static MakeKBRotateInput(cam, canvas) {
        var kbRotateInput = function() {
            this._keys = [];
            this.keysLeft = [74];
            this.keysRight = [76];
            this.keysUp = [73];
            this.keysDown = [75];
            this.keysZoomIn = [48];
            this.keysZoomOut = [57];
            this.deltaFOV = .005;
            this.fovMin = Math.PI/24;
            this.fovMax = .99*Math.PI/2;
        };

        kbRotateInput.prototype.getTypeName = function() {
            return "CameraKeyboardRotateInput";
        };

        kbRotateInput.prototype.getSimpleName = function() {
            return "keyboardRotate";
        };

        kbRotateInput.prototype.attachControl = function(element, noPreventDefault) {
            var _this = this;
            if (!this._onKeyDown) {
                element.tabIndex = 1;
                this._onKeyDown = function(evt) {
                    if (
                    _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    _this.keysRight.indexOf(evt.keyCode) !== -1 ||
                    _this.keysUp.indexOf(evt.keyCode) !== -1 ||
                    _this.keysDown.indexOf(evt.keyCode) !== -1 ||
                    _this.keysZoomIn.indexOf(evt.keyCode) !== -1 ||
                    _this.keysZoomOut.indexOf(evt.keyCode) !== -1
                    ) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index === -1) {
                            _this._keys.push(evt.keyCode);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };

                this._onKeyUp = function(evt) {
                    if (
                    _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    _this.keysRight.indexOf(evt.keyCode) !== -1 ||
                    _this.keysUp.indexOf(evt.keyCode) !== -1 ||
                    _this.keysDown.indexOf(evt.keyCode) !== -1 ||
                    _this.keysZoomIn.indexOf(evt.keyCode) !== -1 ||
                    _this.keysZoomOut.indexOf(evt.keyCode) !== -1
                    ) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index >= 0) {
                            _this._keys.splice(index, 1);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };

                element.addEventListener("keydown", this._onKeyDown, false);
                element.addEventListener("keyup", this._onKeyUp, false);
                BABYLON.Tools.RegisterTopRootEvents(canvas, [
                    { name: "blur", handler: this._onLostFocus }
                ]);
            }
        };

        kbRotateInput.prototype.detachControl = function(element) {
            if (this._onKeyDown) {
                element.removeEventListener("keydown", this._onKeyDown);
                element.removeEventListener("keyup", this._onKeyUp);
                BABYLON.Tools.UnregisterTopRootEvents(canvas, [
                    { name: "blur", handler: this._onLostFocus }
                ]);
                this._keys = [];
                this._onKeyDown = null;
                this._onKeyUp = null;
            }
        };

        kbRotateInput.prototype._onLostFocus = function (e) {
            this._keys = [];
        };

        kbRotateInput.prototype.checkInputs = function() {
            //this is where you set what the keys do
            if (this._onKeyDown) {
                // Keyboard
                for (var index = 0; index < this._keys.length; index++) {
                    var keyCode = this._keys[index];
                    if (this.keysLeft.indexOf(keyCode) !== -1) {
                        cam.kbTargetRot.y -= Cam.TARGETROTATIONSTEP();
                    } else if (this.keysRight.indexOf(keyCode) !== -1) {
                        cam.kbTargetRot.y += Cam.TARGETROTATIONSTEP();
                    } if (this.keysUp.indexOf(keyCode) !== -1) {
                        cam.kbTargetRot.x -= Cam.TARGETROTATIONSTEP();
                    } else if (this.keysDown.indexOf(keyCode) !== -1) {
                        cam.kbTargetRot.x += Cam.TARGETROTATIONSTEP();
                    } if (this.keysZoomIn.indexOf(keyCode) !== -1) {
                        cam.fov -= this.deltaFOV;
                        cam.fov = Math.max(cam.fov, this.fovMin);
                    } else if (this.keysZoomOut.indexOf(keyCode) !== -1) {
                        cam.fov += this.deltaFOV;
                        cam.fov = Math.min(cam.fov, this.fovMax);
                    }
                }
            }
        };

        return new kbRotateInput();
    }

    static MakeKBMoveInput(cam, canvas) {
        var kbMoveInput = function() {
            this._keys = [];
            this.keysLeft = [65];
            this.keysRight = [68];
            this.keysForward = [87];
            this.keysBack = [83];
            this.keysJump = [32];
            this.keysCrouch = [16];
        };

        kbMoveInput.prototype.getTypeName = function() {
            return "CameraKeyboardMovementInput";
        };

        kbMoveInput.prototype.getSimpleName = function() {
            return "keyboardMovement";
        };

        kbMoveInput.prototype.attachControl = function(element, noPreventDefault) {
            var _this = this;
            if (!this._onKeyDown) {
                element.tabIndex = 1;
                this._onKeyDown = function(evt) {
                    if (
                    _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    _this.keysRight.indexOf(evt.keyCode) !== -1 ||
                    _this.keysForward.indexOf(evt.keyCode) !== -1 ||
                    _this.keysBack.indexOf(evt.keyCode) !== -1 ||
                    _this.keysJump.indexOf(evt.keyCode) !== -1 ||
                    _this.keysCrouch.indexOf(evt.keyCode) !== -1
                    ) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index === -1) {
                            _this._keys.push(evt.keyCode);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };

                this._onKeyUp = function(evt) {
                    if (
                    _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    _this.keysRight.indexOf(evt.keyCode) !== -1 ||
                    _this.keysForward.indexOf(evt.keyCode) !== -1 ||
                    _this.keysBack.indexOf(evt.keyCode) !== -1 ||
                    _this.keysJump.indexOf(evt.keyCode) !== -1 ||
                    _this.keysCrouch.indexOf(evt.keyCode) !== -1
                    ) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index >= 0) {
                            _this._keys.splice(index, 1);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };

                element.addEventListener("keydown", this._onKeyDown, false);
                element.addEventListener("keyup", this._onKeyUp, false);
                BABYLON.Tools.RegisterTopRootEvents(canvas, [
                    { name: "blur", handler: this._onLostFocus }
                ]);
            }
        };

        kbMoveInput.prototype.detachControl = function(element) {
            if (this._onKeyDown) {
                element.removeEventListener("keydown", this._onKeyDown);
                element.removeEventListener("keyup", this._onKeyUp);
                BABYLON.Tools.UnregisterTopRootEvents(canvas, [
                    { name: "blur", handler: this._onLostFocus }
                ]);
                this._keys = [];
                this._onKeyDown = null;
                this._onKeyUp = null;
            }
        };

        kbMoveInput.prototype._onLostFocus = function (e) {
            this._keys = [];
        };

        kbMoveInput.prototype.checkInputs = function() {
            //this is where you set what the keys do
            if (this._onKeyDown) {
                for (var index = 0; index < this._keys.length; index++) {
                    var keyCode = this._keys[index];
                    if (this.keysLeft.indexOf(keyCode) !== -1) {
                        cam.kbTargetPos.y -= Cam.TARGETPOSITIONSTEP();
                    } else if (this.keysRight.indexOf(keyCode) !== -1) {
                        cam.kbTargetPos.y += Cam.TARGETPOSITIONSTEP();
                    } if (this.keysForward.indexOf(keyCode) !== -1) {
                        cam.kbTargetPos.x += Cam.TARGETPOSITIONSTEP();
                    } else if (this.keysBack.indexOf(keyCode) !== -1) {
                        cam.kbTargetPos.x -= Cam.TARGETPOSITIONSTEP();
                    } if (this.keysJump.indexOf(keyCode) !== -1) {
                        if(cam.onGround) {
                            cam.jumpV = Cam.JUMPV();
                            cam.onGround = false;
                            cam.bounceOnGround = false;
                            cam.bounceDist = 0;
                        }
                    } else if (this.keysCrouch.indexOf(keyCode) !== -1) {
                        cam.targetCrouch = math.max(cam.targetCrouch - 2*Cam.CROUCHSTEP(), Cam.CROUCHHEIGHT()-Cam.CROUCHSTEP());
                    }
                }
            }
            cam.targetCrouch = math.min(cam.targetCrouch + Cam.CROUCHSTEP(), Cam.HEIGHT()); // always runs to return targetCrouch to 0
        };

        return new kbMoveInput();
    }

    static SetupKBControl(cam) {
        // this contains position cam moving to, expressed locally
        // x forward, y side. no movement has targetPos at [0,0]
        cam.kbTargetPos = BF.Vec2([0,0]);

        // rotation target is moved to. cam is rotated about cam local x axis by alt
        // camMesh is rotated about world y axis by azim
        cam.kbTargetRot = BF.Vec2([0,0]); // first comp is alt, second is azim

        cam.kbForwardV = 0;
        cam.kbSideV = 0;

        cam.kbDeltaAlt = 0;
        cam.kbDeltaAzim = 0;

        cam.kbMoveToTarget = function() {
            cam.kbForwardV = Cam.KBMOVEINTERPMULT() * cam.kbTargetPos.x;
            cam.kbSideV = Cam.KBMOVEINTERPMULT() * cam.kbTargetPos.y;
            cam.kbTargetPos.x -= cam.kbForwardV;
            cam.kbTargetPos.y -= cam.kbSideV;
        }

        cam.kbRotToTarget = function() {
            cam.kbDeltaAlt = Cam.KBROTINTERPMULT() * cam.kbTargetRot.x;
            cam.kbTargetRot.x -= cam.kbDeltaAlt;

            cam.kbDeltaAzim = Cam.KBROTINTERPMULT() * cam.kbTargetRot.y;
            cam.kbTargetRot.y -= cam.kbDeltaAzim;
        }
    }

    static SetupVirtualControl(cam, engine) {
        // setup virtual joystick input
        cam.vcModes = {};
        cam.vcModes.hybridController = UI.MakeVirtualHybridController(window.gui, engine);
        cam.vcModes.dualJSController = UI.MakeVirtualJoystickController(window.gui, engine);
        window.pointerManager.addCamCallbacksToMode('hybridController', cam.vcModes.hybridController);
        window.pointerManager.addCamCallbacksToMode('dualJSController', cam.vcModes.dualJSController);

        cam.jsTargetPos = BF.Vec2([0,0]);
        cam.jsForwardV = 0;
        cam.jsSideV = 0;

        cam.jsTargetRot = BF.Vec2([0,0]);
        cam.jsDeltaAlt = 0;
        cam.jsDeltaAzim = 0;


        cam.vcModes.dualJSCheck = function() {
            if (cam.virtualController.leftFingerDown) {
                var leftDelta = math.multiply(VF.ScaleVecToLength(cam.virtualController.leftStickLocal, Math.sqrt(VF.Mag(cam.virtualController.leftStickLocal))), Cam.JOYSTICKMOVEMULT());
                cam.jsTargetPos.x -= leftDelta[1];
                cam.jsTargetPos.y += leftDelta[0];
            } if (cam.virtualController.rightFingerDown) {
                var rightDelta = math.multiply(VF.ScaleVecToLength(cam.virtualController.rightStickLocal, Math.sqrt(VF.Mag(cam.virtualController.rightStickLocal))), Cam.JOYSTICKROTMULT());
                cam.jsTargetRot.x += rightDelta[1];
                cam.jsTargetRot.y += rightDelta[0];
            }
        }

        cam.vcModes.hybridCheck = function() {
            if (cam.virtualController.leftFingerDown) {
                var leftDelta = math.multiply(VF.ScaleVecToLength(cam.virtualController.leftStickLocal, Math.sqrt(VF.Mag(cam.virtualController.leftStickLocal))), Cam.JOYSTICKMOVEMULT());
                cam.jsTargetPos.x -= leftDelta[1];
                cam.jsTargetPos.y += leftDelta[0];
            } if (cam.virtualController.rightFingerDown) {
                if (!cam.virtualController.justMoved) {
                    cam.virtualController.prevPos = cam.virtualController.currentPos;
                    cam.virtualController.rightStickLocal = [0,0];
                }
                cam.virtualController.justMoved = false;
                var rightDelta = math.multiply(VF.ScaleVecToLength(cam.virtualController.rightStickLocal, Math.sqrt(VF.Mag(cam.virtualController.rightStickLocal))), Cam.HYBRIDROTMULT());
                cam.jsTargetRot.x += rightDelta[1];
                cam.jsTargetRot.y += rightDelta[0];
            }
        }

        cam.jsMoveToTarget = function() {
            cam.jsForwardV = Cam.JOYSTICKMOVEINTERPMULT() * cam.jsTargetPos.x;
            cam.jsSideV = Cam.JOYSTICKMOVEINTERPMULT() * cam.jsTargetPos.y;
            cam.jsTargetPos.x -= cam.jsForwardV;
            cam.jsTargetPos.y -= cam.jsSideV;
        }

        cam.vcModes.dualJSRotToTarget = function() {
            cam.jsDeltaAlt = Cam.JOYSTICKROTINTERPMULT() * cam.jsTargetRot.x;
            cam.jsTargetRot.x -= cam.jsDeltaAlt;

            cam.jsDeltaAzim = Cam.JOYSTICKROTINTERPMULT() * cam.jsTargetRot.y;
            cam.jsTargetRot.y -= cam.jsDeltaAzim;
        }

        cam.vcModes.hybridRotToTarget = function() {
            cam.jsDeltaAlt = Cam.HYBRIDROTINTERPMULT() * cam.jsTargetRot.x;
            cam.jsTargetRot.x -= cam.jsDeltaAlt;

            cam.jsDeltaAzim = Cam.HYBRIDROTINTERPMULT() * cam.jsTargetRot.y;
            cam.jsTargetRot.y -= cam.jsDeltaAzim;
        }

        cam.switchVirtualControl = function(name) {
            // name is 'hybrid' and 'dualJS'
            window.pointerManager.switchActiveCamMode(name.concat('Controller'));
            cam.virtualController = cam.vcModes[name.concat('Controller')];
            cam.virtualControllerCheck = cam.vcModes[name.concat('Check')];
            cam.jsRotToTarget = cam.vcModes[name.concat('RotToTarget')];
        }

        if (window.ONIPHONE) { // if user is using an iphone dualJS works better
            cam.switchVirtualControl('dualJS');
        } else {
            cam.switchVirtualControl('hybrid');
        }
    }
}

class UI {
    static SPACING() {return '15px'};

    // standard width height
    static STANDARDW() {return '200px'};
    static STANDARDH() {return '40px'};

    static SMALLW() {return '110px'};
    static SMALLH() {return '30px'};

    static SVWIDTH() {return '270px'};
    static SVHEIGHT() {return '300px'};
    static SVBARSIZE() {return 15};

    static SUBMENUW() {return '250px'};

    static HOWTOTEXTW() {return '250px'};
    static HOWTOTEXTH() {return '22px'};
    static HOWTOTEXTSIZE() {return 18};

    static SLIDERHEADERH() {return '26px'};
    static SLIDERH() {return '30px'};

    static JOYSTICKOUTERRAD() {return 80};
    static JOYSTICKOUTERCOLOR() {return 'grey'};
    static JOYSTICKOUTERBOUNDCOLOR() {return 'grey'};
    static JOYSTICKOUTERALPHA() {return .5};

    static JOYSTICKSTICKRAD() {return 50};
    static JOYSTICKSTICKCOLOR() {return 'black'};
    static JOYSTICKSTICKBOUNDCOLOR() {return 'black'};

    static MAXJOYSTICKDIST() {return 85};

    // makes the main gui object
    static MakeGUI(canvas) {
        var gui = {}
        gui.texture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('gui');

        // make show/hide button
        gui.shButton = UI.MakeShowHideButton(gui);
        gui.muteButton = UI.MakeMuteButton(gui);

        // make main menu (can add submenus to main menu afterwords)
        gui.mainMenu = UI.MakeMainMenu(gui, canvas);
        gui.activeMenu = gui.mainMenu;
        gui.activeMenu.hide();

        gui.setActiveMenu = function(menu) {
            gui.activeMenu.hide(); // hide current active menu
            gui.activeMenu = menu;
            gui.activeMenu.show(); // show new active menu
        }

        gui.addControl = function(control) {
            gui.texture.addControl(control);
        }

        gui.addControls = function(controls) {
            for(var i = 0; i < controls.length; i++) {
                gui.addControl(controls[i]);
            }
        }

        return gui;
    }

    // other constructors
    static MakeMainMenu(gui, canvas) {
        //name is string
        let mainMenu = {};
        mainMenu.name = 'main menu';
        mainMenu.panel = UI.MakePanel(true, true);
        gui.texture.addControl(mainMenu.panel);

        mainMenu.panel.top = 30;
        mainMenu.panel.background = 'black'

        mainMenu.controls = {}; // all controls are panels including spacer

        mainMenu.addControl = function(name, control, spacing = true) {
            mainMenu.controls[name] = UI.MakePanel();
            mainMenu.controls[name].control = control;
            if (spacing) {
                UI.AddControlsToTarget([UI.MakeVertSpacer(), control], mainMenu.controls[name]);
                mainMenu.panel.addControl(mainMenu.controls[name]);
            } else {
                UI.AddControlsToTarget([control], mainMenu.controls[name]);
                mainMenu.panel.addControl(mainMenu.controls[name]);
            }
        }

        mainMenu.addControls = function(names, controls, spacing = true) {
            for(var i = 0; i < controls.length; i++) {
                mainMenu.addControl(names[i], controls[i], spacing);
            }
        }

        mainMenu.getControl = function(name) {
            return mainMenu.controls[name].control;
        }

        mainMenu.addSubMenu = function(subMenu) {
            mainMenu.addControl(subMenu.name.concat('PB'), subMenu.parentButton);
        }

        mainMenu.addOneOfSubMenus = function(name, subMenus) {
            // for when only 1 parent button will be active at a time
            var oneOfPanel = UI.MakePanel();
            for(var i = 0; i < subMenus.length; i++) {
                oneOfPanel.addControl(subMenus[i].parentButton);
            }
            mainMenu.addControl(name, oneOfPanel);
        }

        mainMenu.show = function() {
            mainMenu.panel.isVisible = true;
        }

        mainMenu.hide = function() {
            mainMenu.panel.isVisible = false;
        }

        mainMenu.showControl = function(name) {
            mainMenu.controls[name].isVisible = true;
        }

        mainMenu.hideControl = function(name) {
            mainMenu.controls[name].isVisible = false;
        }

        mainMenu.setControlVisibility = function(name, isVisible) {
            mainMenu.controls[name].isVisible = isVisible;
        }

        var header = UI.MakeTextBlock(mainMenu.name, 30);
        UI.SetControlsWidthHeight([header], '200px', '50px');
        mainMenu.addControl('header', header);

        mainMenu.addControl('fsButton', UI.MakeFullscreenButton(canvas));

        return mainMenu;
    }

    static MakeSubMenu(name, parentMenu, gui, pbText = 'sim settings') {
        // basically same as main menu, but includes back button
        // parent is menu that the back button goes back to
        let menu = {};
        menu.name = name;

        menu.parentButton = UI.MakeParentButton(name.concat('parentButton'), pbText, menu, gui);

        menu.panel = UI.MakePanel(true, true);

        menu.headerPanel = UI.MakeSubMenuHeaderPanel(name, parentMenu, gui);
        UI.AddControlsToTarget([UI.MakeVertSpacer(), menu.headerPanel], menu.panel);

        menu.sv = UI.MakeScrollViewer();
        menu.panel.addControl(menu.sv);

        menu.svPanel = UI.MakePanel(true, false, false);
        //menu.svPanel.background = 'white';
        menu.svPanel.width = UI.SUBMENUW();
        menu.sv.addControl(menu.svPanel);

        menu.panel.top = 30;
        menu.controls = {};
        menu.panel.background = 'black'

        menu.addControl = function(name, control, spacing = true) {
            menu.controls[name] = UI.MakePanel();
            menu.controls[name].control = control;
            if (spacing) {
                UI.AddControlsToTarget([UI.MakeVertSpacer(), control], menu.controls[name]);
            } else {
                UI.AddControlsToTarget([control], menu.controls[name]);
            }
            menu.svPanel.addControl(menu.controls[name]);
        }

        menu.addControls = function(names, controls, spacing = true) {
            for(var i = 0; i < controls.length; i++) {
                menu.addControl(names[i], controls[i], spacing);
            }
        }

        menu.getControl = function(name) {
            return menu.controls[name].control;
        }

        menu.addSubMenu = function(subMenu) {
            menu.addControl(subMenu.name.concat('PB'), subMenu.parentButton);
        }

        menu.addOneOfSubMenus = function(name, subMenus) {
            // for when only 1 parent button will be active at a time
            var oneOfPanel = UI.MakePanel();
            for(var i = 0; i < subMenus.length; i++) {
                oneOfPanel.addControl(subMenus[i].parentButton);
            }
            menu.addControl(name, oneOfPanel);
        }

        menu.show = function() {
            menu.panel.isVisible = true;
        }

        menu.hide = function() {
            menu.panel.isVisible = false;
        }

        menu.showControl = function(name) {
            menu.controls[name].isVisible = true;
        }

        menu.hideControl = function(name) {
            menu.controls[name].isVisible = false;
        }

        menu.setControlVisibility = function(name, isVisible) {
            menu.controls[name].isVisible = isVisible;
        }

        menu.hide();
        gui.addControl(menu.panel);

        return menu;
    }

    static MakeAnimStateChooseAnimMenu(anims, gui) {
        // adds the caMenu to gui texture and adds the choose anim button to main menu
        var caMenu = UI.MakeSubMenu('simulations', gui.mainMenu, gui, 'choose simulation');
        var animKeys = Object.keys(anims);
        var animState = {anims: anims};
        animState.switchActiveAnim = function(animKey) {
            window.sounds.animChange.play();
            if (animState.activeAnim.guiMenu.panel.isVisible) {
                gui.setActiveMenu(animState.anims[animKey].guiMenu);
            }
            animState.activeAnim.deactivate();
            animState.activeAnim = animState.anims[animKey];
            animState.activeAnim.activate();
            caMenu.activeAnimButton.color = 'white';
            caMenu.activeAnimButton = animState.anims[animKey].aaButton;
            caMenu.activeAnimButton.color = 'green';
        }
        var animButtons = [];
        var animButtonNames = [];
        var animMenus = [];
        for(var i = 0; i < animKeys.length; i++) {
            if (i === 0) {
                animState.activeAnim = anims[animKeys[i]];
            } else {
                anims[animKeys[i]].deactivate();
            }
            animState.anims[animKeys[i]].aaButton = UI.MakeMenuActivateAnimButton(animKeys[i], animState)
            animButtons.push(animState.anims[animKeys[i]].aaButton);
            animButtonNames.push(animKeys[i].concat('PB'))
            animMenus.push(animState.anims[animKeys[i]].guiMenu);
        }
        caMenu.addControls(animButtonNames, animButtons);
        //add a property that holds the active sim button to change its color to highlight that its active
        caMenu.activeAnimButton = animButtons[0];
        caMenu.activeAnimButton.color = 'green';
        gui.mainMenu.addSubMenu(caMenu);
        gui.mainMenu.addOneOfSubMenus('animSettings', animMenus);
        return animState;
    }

    static MakeHowToMenu(gui) {
        var htMenu = UI.MakeSubMenu('how to use', gui.mainMenu, gui, 'how to use');
        var controls = [];

        var htText00 = UI.MakeTextBlock('move the viewer with', UI.HOWTOTEXTSIZE());
        var htText01 = UI.MakeTextBlock('W, A, S, and D keys', UI.HOWTOTEXTSIZE());
        var htText02 = UI.MakeTextBlock('spacebar moves viewer up', UI.HOWTOTEXTSIZE());
        var htText03 = UI.MakeTextBlock('and shift moves down', UI.HOWTOTEXTSIZE());
        htMenu.addControls(['spacer', 'htText00', 'htText01'], [UI.MakeVertSpacer(), htText00, htText01], false);
        htMenu.addControls(['spacer', 'htText02', 'htText03'], [UI.MakeVertSpacer(), htText02, htText03], false);
        controls.push(htText00, htText01, htText02, htText03);

        var htText10 = UI.MakeTextBlock('look around with', UI.HOWTOTEXTSIZE());
        var htText11 = UI.MakeTextBlock('I, J, K, and L keys', UI.HOWTOTEXTSIZE());
        htMenu.addControls(['spacer', 'htText10', 'htText11'], [UI.MakeVertSpacer(), htText10, htText11], false);
        controls.push(htText10, htText11);

        var htText20 = UI.MakeTextBlock('if you are using a touchscreen,', UI.HOWTOTEXTSIZE());
        var htText21 = UI.MakeTextBlock('touch the left side of the screen', UI.HOWTOTEXTSIZE());
        var htText22 = UI.MakeTextBlock('to use the virtual joystick.', UI.HOWTOTEXTSIZE());
        var htText23 = UI.MakeTextBlock('touch and drag the right side', UI.HOWTOTEXTSIZE());
        var htText24 = UI.MakeTextBlock('of the screen to look around', UI.HOWTOTEXTSIZE());
        htMenu.addControls(['spacer', 'htText20', 'htText21', 'htText22', 'htText23', 'htText24'], [UI.MakeVertSpacer(), htText20, htText21, htText22, htText23, htText24], false);
        controls.push(htText20, htText21, htText22, htText23, htText24);

        var htText30 = UI.MakeTextBlock('experiment with sim settings', UI.HOWTOTEXTSIZE());
        var htText31 = UI.MakeTextBlock('for each simulation', UI.HOWTOTEXTSIZE());
        htMenu.addControls(['spacer', 'htText30', 'htText31'], [UI.MakeVertSpacer(), htText30, htText31], false);
        controls.push(htText30, htText31);

        UI.SetControlsWidthHeight(controls, UI.HOWTOTEXTW(), UI.HOWTOTEXTH());

        gui.mainMenu.addSubMenu(htMenu);
    }

    static MakeChooseVirtualControlMenu(gui) {
        var cvcMenu = UI.MakeSubMenu('cvcMenu', gui.mainMenu, gui, 'choose virtual control');
        var controls = [];
        var names = [];

        cvcMenu.switchActive = function(name, but) {
            window.camera.switchVirtualControl(name);
            cvcMenu.activeBut.color = 'white';
            cvcMenu.activeBut = but;
            cvcMenu.activeBut.color = 'green';
        }

        var hybridButton = UI.MakeButton('actHybridControlBut', 'hybrid joystick control', function() {
            cvcMenu.switchActive('hybrid', hybridButton);
        });
        controls.push(hybridButton);
        names.push('hybridButton');
        var dualJSButton = UI.MakeButton('actDualJSControlBut', 'dual joystick control', function() {
            cvcMenu.switchActive('dualJS', dualJSButton);
        });
        controls.push(dualJSButton);
        names.push('dualJSButton');

        cvcMenu.activeBut = hybridButton;
        cvcMenu.activeBut.color = 'green';
        cvcMenu.addControls(names, controls);
        gui.mainMenu.addSubMenu(cvcMenu);
    }

    static MakeVirtualJoystick(gui) {
        var joystick = {};
        joystick.background = new BABYLON.GUI.Ellipse('background');
        joystick.background.width = 2*UI.JOYSTICKOUTERRAD() + 'px';
        joystick.background.height = 2*UI.JOYSTICKOUTERRAD() + 'px';
        joystick.background.background = UI.JOYSTICKOUTERCOLOR();
        joystick.background.color = UI.JOYSTICKOUTERBOUNDCOLOR();
        joystick.background.alpha = UI.JOYSTICKOUTERALPHA();

        joystick.stick = new BABYLON.GUI.Ellipse('stick');
        joystick.stick.width = 2*UI.JOYSTICKSTICKRAD() + 'px';
        joystick.stick.height = 2*UI.JOYSTICKSTICKRAD() + 'px';
        joystick.stick.background = UI.JOYSTICKSTICKCOLOR();
        joystick.stick.color = UI.JOYSTICKSTICKBOUNDCOLOR();

        UI.AlignControlsTopLeft([joystick.background, joystick.stick]);

        joystick.show = function() {
            joystick.background.isVisible = true;
            joystick.stick.isVisible = true;
        }

        joystick.hide = function() {
            joystick.background.isVisible = false;
            joystick.stick.isVisible = false;
        }

        joystick.hide();

        gui.addControls([joystick.background, joystick.stick]);

        return joystick;
    }

    static MakeVirtualJoystickController(gui, engine) {
        var controller = {};

        controller.leftJoystick = UI.MakeVirtualJoystick(gui);
        controller.leftFingerDown = false; // controls movement
        controller.leftFingerID = -1;
        controller.leftCenterPos = [0,0];
        controller.leftStickPos = [0,0]; // absolute stick position
        controller.leftStickLocal = [0,0]; // position of stick relative to center

        controller.rightJoystick = UI.MakeVirtualJoystick(gui);
        controller.rightFingerDown = false; // controls look direction
        controller.rightFingerID = -1;
        controller.rightCenterPos = [0,0];
        controller.rightStickPos = [0,0];
        controller.rightStickLocal = [0,0];
        controller.justMoved = true; // just to able to hot swap with hybrid controller

        controller.pointerDown = function(pointerInfo) {
            var x = pointerInfo.event.x;
            var y = pointerInfo.event.y;
            if (x <= controller.middleWidth/2 && !controller.leftFingerDown) {
                controller.leftFingerID = pointerInfo.event.pointerId;
                controller.leftFingerDown = true;
                controller.leftCenterPos = [x, y];
                controller.leftStickPos = [x, y];
                controller.setJoystickBackgroundPosition('left');
                controller.leftJoystick.show();
                return true;
            } else if (x > controller.middleWidth/2 && !controller.rightFingerDown) {
                controller.rightFingerID = pointerInfo.event.pointerId;
                controller.rightFingerDown = true;
                controller.rightCenterPos = [x, y];
                controller.rightStickPos = [x, y];
                controller.setJoystickBackgroundPosition('right');
                controller.rightJoystick.show();
                return true;
            }
            return false;
        }

        controller.pointerUp = function(pointerInfo) {
            var id = pointerInfo.event.pointerId;
            if (id === controller.leftFingerID) {
                controller.leftFingerDown = false;
                controller.leftFingerID = -1;
                controller.leftJoystick.hide();
            } else if (id === controller.rightFingerID) {
                controller.rightFingerDown = false;
                controller.rightFingerID = -1;
                controller.rightJoystick.hide();
            }
        }

        controller.pointerMove = function(pointerInfo) {
            var id = pointerInfo.event.pointerId;
            if (id === controller.leftFingerID) {
                controller.leftStickPos = [pointerInfo.event.x, pointerInfo.event.y];
                controller.leftStickLocal = VF.R(controller.leftCenterPos, controller.leftStickPos)
                var mag = VF.Mag(controller.leftStickLocal);
                if (mag > UI.MAXJOYSTICKDIST()) {
                    controller.leftStickLocal = VF.ScaleVecToLength2(controller.leftStickLocal, mag, UI.MAXJOYSTICKDIST());
                    controller.leftStickPos = math.add(controller.leftCenterPos, controller.leftStickLocal);
                }
                controller.setJoystickPosition('left');
            } else if (id === controller.rightFingerID) {
                controller.rightStickPos = [pointerInfo.event.x, pointerInfo.event.y];
                controller.rightStickLocal = VF.R(controller.rightCenterPos, controller.rightStickPos)
                var mag = VF.Mag(controller.rightStickLocal);
                if (mag > UI.MAXJOYSTICKDIST()) {
                    controller.rightStickLocal = VF.ScaleVecToLength2(controller.rightStickLocal, mag, UI.MAXJOYSTICKDIST());
                    controller.rightStickPos = math.add(controller.rightCenterPos, controller.rightStickLocal);
                }
                controller.setJoystickPosition('right');
            }
        }

        controller.onResize = function() {
            controller.middleWidth = engine.getRenderWidth();
            controller.middleHeight = engine.getRenderHeight();
        }

        controller.setJoystickBackgroundPosition = function(side) {
            // side is 'left' or 'right'
            // sets both stick and background position
            controller[side.concat('Joystick')].background.left = (controller[side.concat('CenterPos')][0] - UI.JOYSTICKOUTERRAD()) + 'px';
            controller[side.concat('Joystick')].background.top = (controller[side.concat('CenterPos')][1] - UI.JOYSTICKOUTERRAD()) + 'px';
            controller[side.concat('Joystick')].stick.left = (controller[side.concat('StickPos')][0] - UI.JOYSTICKSTICKRAD()) + 'px';
            controller[side.concat('Joystick')].stick.top = (controller[side.concat('StickPos')][1] - UI.JOYSTICKSTICKRAD()) + 'px';
        }

        controller.setJoystickPosition = function(side) {
            // side is 'left' or 'right'
            // sets only stick position
            controller[side.concat('Joystick')].stick.left = (controller[side.concat('StickPos')][0] - UI.JOYSTICKSTICKRAD()) + 'px';
            controller[side.concat('Joystick')].stick.top = (controller[side.concat('StickPos')][1] - UI.JOYSTICKSTICKRAD()) + 'px';
        }

        controller.onResize();

        return controller;
    }

    static MakeVirtualHybridController(gui, engine) {
        // position control is still a Joystick on the left side
        // rotation is now direct finger drag anywhere to rotate
        var controller = {};

        controller.leftJoystick = UI.MakeVirtualJoystick(gui);
        controller.leftFingerDown = false; // controls movement
        controller.leftFingerID = -1;
        controller.leftCenterPos = [0,0];
        controller.leftStickPos = [0,0]; // absolute stick position
        controller.leftStickLocal = [0,0]; // position of stick relative to center

        controller.rightFingerDown = false; // controls look direction
        controller.rightFingerID = -1;
        controller.currentPos = [0,0];
        controller.prevPos = [0,0];
        controller.rightStickLocal = [0,0];
        controller.justMoved = false;

        controller.pointerDown = function(pointerInfo) {
            var x = pointerInfo.event.x;
            var y = pointerInfo.event.y;
            if (x <= controller.middleWidth/2 && !controller.leftFingerDown) {
                controller.leftFingerID = pointerInfo.event.pointerId;
                controller.leftFingerDown = true;
                controller.leftCenterPos = [x, y];
                controller.leftStickPos = [x, y];
                controller.setJoystickBackgroundPosition('left');
                controller.leftJoystick.show();
                return true;
            } else if (x > controller.middleWidth/2 && !controller.rightFingerDown) {
                controller.rightFingerID = pointerInfo.event.pointerId;
                controller.rightFingerDown = true;
                controller.currentPos = [x, y];
                controller.prevPos = [x, y];
                return true;
            }
            return false;
        }

        controller.pointerUp = function(pointerInfo) {
            var id = pointerInfo.event.pointerId;
            if (id === controller.leftFingerID) {
                controller.leftFingerDown = false;
                controller.leftFingerID = -1;
                controller.leftJoystick.hide();
            } else if (id === controller.rightFingerID) {
                controller.rightFingerDown = false;
                controller.rightFingerID = -1;
            }
        }

        controller.pointerMove = function(pointerInfo) {
            var id = pointerInfo.event.pointerId;
            if (id === controller.leftFingerID) {
                controller.leftStickPos = [pointerInfo.event.x, pointerInfo.event.y];
                controller.leftStickLocal = VF.R(controller.leftCenterPos, controller.leftStickPos)
                var mag = VF.Mag(controller.leftStickLocal);
                if (mag > UI.MAXJOYSTICKDIST()) {
                    controller.leftStickLocal = VF.ScaleVecToLength2(controller.leftStickLocal, mag, UI.MAXJOYSTICKDIST());
                    controller.leftStickPos = math.add(controller.leftCenterPos, controller.leftStickLocal);
                }
                controller.setJoystickPosition('left');
            } else if (id === controller.rightFingerID) {
                controller.justMoved = true;
                controller.prevPos = controller.currentPos;
                controller.currentPos = [pointerInfo.event.x, pointerInfo.event.y];
                controller.rightStickLocal = math.multiply(VF.R(controller.prevPos, controller.currentPos), 1);
            }
        }

        controller.onResize = function() {
            controller.middleWidth = engine.getRenderWidth();
            controller.middleHeight = engine.getRenderHeight();
        }

        controller.setJoystickBackgroundPosition = function(side = 'left') {
            // side is 'left' or 'right'
            // sets both stick and background position
            controller[side.concat('Joystick')].background.left = (controller[side.concat('CenterPos')][0] - UI.JOYSTICKOUTERRAD()) + 'px';
            controller[side.concat('Joystick')].background.top = (controller[side.concat('CenterPos')][1] - UI.JOYSTICKOUTERRAD()) + 'px';
            controller[side.concat('Joystick')].stick.left = (controller[side.concat('StickPos')][0] - UI.JOYSTICKSTICKRAD()) + 'px';
            controller[side.concat('Joystick')].stick.top = (controller[side.concat('StickPos')][1] - UI.JOYSTICKSTICKRAD()) + 'px';
        }

        controller.setJoystickPosition = function(side = 'left') {
            // side is 'left' or 'right'
            // sets only stick position
            controller[side.concat('Joystick')].stick.left = (controller[side.concat('StickPos')][0] - UI.JOYSTICKSTICKRAD()) + 'px';
            controller[side.concat('Joystick')].stick.top = (controller[side.concat('StickPos')][1] - UI.JOYSTICKSTICKRAD()) + 'px';
        }

        controller.onResize();

        return controller;
    }

    static MakeSubMenuHeaderPanel(menuName, parent, gui) {
        // returns subMenu header panel obj
        // has backbutton and headertext in a panel horizontally
        var headerPanel = UI.MakePanel(false);
        UI.AdaptContainerHeight(headerPanel);
        var backButton = UI.MakeBackButton(menuName.concat('BackButton'), parent, gui);
        var headerText = UI.MakeTextBlock(menuName, 28, 'white');
        headerText.height = '50px';
        headerText.width = '200px';
        UI.AddControlsToTarget([backButton, headerText], headerPanel);
        return headerPanel;
    }

    static MakeSliderPanel(headerText, unit, minVal, maxVal, initVal, valChangeFn) {
        // makes slider panel. header above slider.
        // header becomes 'headerText: val unit'
        // unit is string representing units ('degrees' or 'radians')
        // valChangeFn is function(value) that updates whatever the slider updates
        // valChangeFn does not need to change header as this is done here
        var sliderPanel = UI.MakePanel();
        UI.AdaptContainerWidth(sliderPanel);

        var header = UI.MakeTextBlock(headerText + ': ' + initVal + ' ' + unit, 20);
        header.height = UI.SLIDERHEADERH();
        header.width = '250px';


        var slider = new BABYLON.GUI.Slider();
        slider.minimum = minVal;
        slider.maximum = maxVal;
        slider.value = initVal;
        slider.onValueChangedObservable.add(function(value) {
            header.text = headerText + ': ' + math.round(10*value)/10 + ' ' + unit;
            valChangeFn(value);
        });
        slider.height = UI.SLIDERH();
        slider.width = '250px';
        slider.color = 'grey'
        slider.background = 'black'
        slider.borderColor = 'white'
        slider.isThumbCircle = true;
        slider.thumbWidth = 30;


        UI.SetControlsPadding([header, slider], 2);
        UI.AddControlsToTarget([header, slider], sliderPanel);

        sliderPanel.getSliderValue = function() {
            return slider.value;
        }

        sliderPanel.setSliderValue = function(val) {
            slider.value = val;
        }

        sliderPanel.setWidth = function(width) {
            header.width = width;
            slider.width = width;
        }

        return sliderPanel
    }

    static MakeSliderPanelPrecise(headerText, unit, minVal, maxVal, initVal, valChangeFn) {
        // makes slider panel. header above slider.
        // header becomes 'headerText: val unit'
        // unit is string representing units ('degrees' or 'radians')
        // valChangeFn is function(value) that updates whatever the slider updates
        // valChangeFn does not need to change header as this is done here
        var sliderPanel = UI.MakePanel();
        UI.AdaptContainerWidth(sliderPanel);

        var header = UI.MakeTextBlock(headerText + ': ' + initVal + ' ' + unit, 20);
        header.height = UI.SLIDERHEADERH();
        header.width = '250px';


        var slider = new BABYLON.GUI.Slider();
        slider.minimum = minVal;
        slider.maximum = maxVal;
        slider.value = initVal;
        slider.onValueChangedObservable.add(function(value) {
            header.text = headerText + ': ' + math.round(100*value)/100 + ' ' + unit;
            valChangeFn(value);
        });
        slider.height = UI.SLIDERH();
        slider.width = '250px';
        slider.color = 'grey'
        slider.background = 'black'
        slider.borderColor = 'white'
        slider.isThumbCircle = true;
        slider.thumbWidth = 30;


        UI.SetControlsPadding([header, slider], 2);
        UI.AddControlsToTarget([header, slider], sliderPanel);

        sliderPanel.getSliderValue = function() {
            return slider.value;
        }

        sliderPanel.setSliderValue = function(val) {
            slider.value = val;
        }

        sliderPanel.setWidth = function(width) {
            header.width = width;
            slider.width = width;
        }

        return sliderPanel
    }

    static MakeIntSliderPanel(headerText, unit, minVal, maxVal, initVal, valChangeFn) {
        // makes slider panel. header above slider.
        // header becomes 'headerText: val unit'
        // unit is string representing units ('degrees' or 'radians')
        // valChangeFn is function(value) that updates whatever the slider updates
        // valChangeFn does not need to change header as this is done here
        var sliderPanel = UI.MakePanel();
        UI.AdaptContainerWidth(sliderPanel);

        var header = UI.MakeTextBlock(headerText + ': ' + initVal + ' ' + unit, 20);
        header.height = UI.SLIDERHEADERH();
        header.width = '250px';


        var slider = new BABYLON.GUI.Slider();
        slider.minimum = minVal;
        slider.maximum = maxVal;
        slider.value = initVal;
        slider.onValueChangedObservable.add(function(value) {
            header.text = headerText + ': ' + Math.round(value) + ' ' + unit;
            valChangeFn(Math.round(value));
        });
        slider.height = UI.SLIDERH();
        slider.width = '250px';
        slider.color = 'grey';
        slider.background = 'black';
        slider.borderColor = 'white';
        slider.isThumbCircle = true;
        slider.thumbWidth = 30;


        UI.SetControlsPadding([header, slider], 2);
        UI.AddControlsToTarget([header, slider], sliderPanel);

        sliderPanel.getSliderValue = function() {
            return slider.value;
        }

        sliderPanel.setSliderValue = function(val) {
            slider.value = val;
        }

        sliderPanel.setWidth = function(width) {
            header.width = width;
            slider.width = width;
        }

        return sliderPanel
    }

    static MakeVolumeSliderPanel(gui) {
        var volSP = UI.MakeSliderPanel('volume', '', 0, 1, 1, function(value) {
            BABYLON.Engine.audioEngine.setGlobalVolume(value*value);
        });
        volSP.setWidth('200px');
        gui.mainMenu.addControl('volumeSP', volSP);
        gui.mainMenu.hideControl('volumeSP');
    }

    static MakeTwoButtonPanel(name0, text0, f0, name1, text1, f1) {
        var tbPanel = UI.MakePanel(false);
        var but0 = UI.MakeButton(name0, text0, f0);
        but0.width = UI.SMALLW();
        var but1 = UI.MakeButton(name1, text1, f1);
        but1.width = UI.SMALLW();
        UI.AddControlsToTarget([but0, UI.MakeHorizSpacer(), but1], tbPanel);

        return tbPanel;
    }

    static MakeShowHideButton(gui) {
        var resAudFunc = function() {
            BF.ResumeAudioContext();
            resAudFunc = function() {}
        }

        var shButton = UI.MakeDualButton('shButton', 'show', 'hide', function() {
            gui.activeMenu.hide();
        }, function() {
            resAudFunc();
            gui.activeMenu.show();
        }, window.sounds.uiClick);
        if (window.ONIPHONE) {
            UI.AlignControlsBottomLeft([shButton]);
        } else {
            UI.AlignControlsTopLeft([shButton]);
        }
        shButton.width = '60px';
        shButton.height = '30px';
        gui.texture.addControl(shButton);

        return shButton;
    }

    static MakeMuteButton(gui) {
        var muteButton = UI.MakeDualButton('muteButton', 'unmute', 'mute', function() {
            BF.SetGlobalVolume(0);
            gui.mainMenu.hideControl('volumeSP');
            window.sounds.theSong.pause();
        }, function() {
            BABYLON.Engine.audioEngine.audioContext.resume();
            BF.SetGlobalVolume(MF.Square(gui.mainMenu.getControl('volumeSP').getSliderValue()));
            window.sounds.animChange.play();
            window.sounds.theSong.play();
            gui.mainMenu.showControl('volumeSP');
        });
        if (window.ONIPHONE) {
            UI.AlignControlsBottomLeft([muteButton]);
        } else {
            UI.AlignControlsTopLeft([muteButton]);
        }
        muteButton.width = '66px';
        muteButton.height = '30px';
        muteButton.left = '68px';
        gui.texture.addControl(muteButton);
        return muteButton;
    }

    static MakeFullscreenButton(canvas) {
        var fsButton = UI.MakeDualButton('fsButton', 'enter fullscreen', 'exit fullscreen', function() {
            if(screenfull.isEnabled) {
                screenfull.exit();
            }
        }, function() {
            if(screenfull.isEnabled) {
                screenfull.request(canvas);
            }
        }, window.sounds.animChange);
        return fsButton;
    }

    static MakeMenuActivateAnimButton(animKey, animState) {
        var aaButton = UI.MakeButton('', animKey, function() {
            animState.switchActiveAnim(animKey)
        });
        aaButton.color = 'white';
        aaButton.horizontalAlignment = BABYLON.GUI.HORIZONTAL_ALIGNMENT_CENTER;
        return aaButton;
    }

    static MakeDualTextButton(name, text0, text1, onPressedFn, sound = null) {
        // button acts like a checkbox (hide/show settings button)
        // text0 is initial (true) state;
        // onPressedFn0 is run when state switches to true
        var state = 0
        var texts = [text0, text1];
        var button = UI.MakeButton(name, text0, function() {
            state = (state + 1) % 2;
            button.children[0].text = texts[state];
            onPressedFn();
        }, sound);

        return button;
    }

    static MakeDualButton(name, text0, text1, onPressedFn0, onPressedFn1, sound = null) {
        // button acts like a checkbox (hide/show settings button)
        // text0 is initial 0 state;
        // onPressedFn0 is run when state switches to 0
        var state = 0
        var texts = [text0, text1];
        var fns = [onPressedFn0, onPressedFn1]
        var button = UI.MakeButton(name, text0, function() {
            state = (state + 1) % 2;
            button.children[0].text = texts[state];
            fns[state]();
        }, sound);

        return button;
    }

    static MakeParentButton(name, text, subMenu, gui) {
        var parentButton = UI.MakeButton(name, text, function() {
            gui.setActiveMenu(subMenu);
        }, window.sounds.uiClick);
        parentButton.color = 'white'
        return parentButton;
    }

    static MakeBackButton(name, parent, gui) {
        // parent is menu that back button returns to
        var backButton = UI.MakeButton(name, '<', function() {
            window.sounds.uiClick.play();
            gui.setActiveMenu(parent);
        });
        backButton.color = 'white'
        backButton.width = '30px'
        backButton.height = '30px'
        return backButton;
    }

    static MakeVertSpacer(spacing = UI.SPACING()) {
        var spacer = new BABYLON.GUI.Rectangle();
        spacer.width = '1px';
        spacer.height = spacing;
        spacer.color = 'green'
        spacer.alpha = 0;
        return spacer;
    }

    static MakeHorizSpacer(spacing = UI.SPACING()) {
        var spacer = new BABYLON.GUI.Rectangle();
        spacer.width = spacing;
        spacer.height = '1px';
        spacer.color = 'green'
        spacer.alpha = 0;
        return spacer;
    }

    static MakeButton(name, text, onPressedFn, sound = null) {
        var button = BABYLON.GUI.Button.CreateSimpleButton(name, text);
        if(sound) {
            button.onPointerClickObservable.add(function() {
                sound.play();
                onPressedFn();
            });
        } else {
            button.onPointerClickObservable.add(onPressedFn);
        }
        UI.SetControlsWidthHeight([button], UI.STANDARDW(), UI.STANDARDH());
        button.color = 'white';
        return button;
    }

    static MakeTextBlock(text, fontSize, color = 'white') {
        var textBlock = new BABYLON.GUI.TextBlock();
        textBlock.text = text;
        textBlock.fontSize = fontSize;
        textBlock.color = color;

        return textBlock;
    }

    static MakePanel(isVertical = true, topLeft = false, adaptSize = true) {
        // isVertical false means horizontal stackpanel
        var panel = new BABYLON.GUI.StackPanel();
        panel.isVertical = isVertical;
        if(topLeft) {
            UI.AlignControlsTopLeft([panel]);
        }
        if(adaptSize) {
            if(isVertical) {
                UI.AdaptContainerWidth(panel);
            } else {
                UI.AdaptContainerHeight(panel);
            }
        }
        return panel;
    }

    static MakeScrollViewer(name = 'sv') {
        var sv = new BABYLON.GUI.ScrollViewer(name);
        sv.width = UI.SVWIDTH();
        sv.height = UI.SVHEIGHT();
        sv.barSize = UI.SVBARSIZE();
        sv.color = 'black';
        return sv;
    }

    // helpers
    static AddControlsToTarget(controls, target) {
        // controls is ar(control)
        // root is the gui texture
        for(var i = 0; i < controls.length; i++) {
            target.addControl(controls[i]);
        }
    }

    static SetControlsPadding(controls, padding) {
        for(var i = 0; i < controls.length; i++) {
            controls[i].paddingTop = padding;
            controls[i].paddingBottom = padding;
            controls[i].paddingLeft = padding;
            controls[i].paddingRight = padding;
        }
    }

    static AlignControlsTop(controls) {
        for(var i = 0; i < controls.length; i++) {
            controls[i].verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        }
    }

    static AlignControlsBottom(controls) {
        for(var i = 0; i < controls.length; i++) {
            controls[i].verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        }
    }

    static AlignControlsLeft(controls) {
        for(var i = 0; i < controls.length; i++) {
            controls[i].horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        }
    }

    static AlignControlsTopLeft(controls) {
        for(var i = 0; i < controls.length; i++) {
            controls[i].horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            controls[i].verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        }
    }

    static AlignControlsBottomLeft(controls) {
        for(var i = 0; i < controls.length; i++) {
            controls[i].horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            controls[i].verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        }
    }

    static AdaptContainerWidth(container) {
        container.adaptWidthToChildren = true;
    }

    static AdaptContainerHeight(container) {
        container.adaptHeightToChildren = true;
    }

    static AdaptContainerWidthHeight(container) {
        container.adaptWidthToChildren = true;
        container.adaptHeightToChildren = true;
    }

    static SetControlsWidthHeight(controls, width, height) {
        for(var i = 0; i < controls.length; i++) {
            controls[i].width = width;
            controls[i].height = height;
        }
    }
}

class UI3D {
    static SLIDERLINEWIDTH() { return .25 }
    static SLIDERLINEHEIGHT() { return .1 }
    static SLIDERTEXTPLANEHEIGHT() { return 10 }
    static SLIDERTEXTFONTSIZE() { return 130 }

    static RISINGPANELDEPTH() { return 1 }
    static RISINGPANELANIMKEYS() { return 40 }
    static RISINGPANELCONTROLANIMKEYS() { return 20 }

    static PUCKDEPTH() { return .9 }

    static MakeTextPlane(name, scene, width, height, text, fontSize) {
        // oriented in X-Y plane, text on pos z side
        var textPlane = BF.MakePlane(name, scene, width, height);
        var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(textPlane);

        textPlane.textBlock = UI.MakeTextBlock(text, fontSize);
        textPlane.textBlock.width = 1;
        textPlane.textBlock.height = 1;
        textPlane.textBlock.background = 'green';

        advancedTexture.addControl(textPlane.textBlock);

        textPlane.setText = function(text) {
            textPlane.textBlock.text = text;
        }

        return textPlane;
    }

    static MakeSlider(name, scene, sliderMesh, backgroundMesh, range, initVal, length, onValChange, verticleOffset = 0) {
        // uses position of a sphere on a line in 3d to set slider value
        // range is [minVal, maxVal]
        // mode is the pointerManager interact mode control is added to
        // default slider oriented sitting in x-z plane and centered at origin
        // slider can move length/2 in pos/neg x direction
        // onValChange is function of value
        var slider = {};
        slider.node = BF.MakeTransformNode(name.concat('Node'), scene);
        slider.name = name;

        slider.mesh = sliderMesh;
        slider.mesh.parent = slider.node;
        slider.mesh.position.y = verticleOffset;
        slider.mesh.material = window.myMats.sun;

        slider.backgroundMesh = backgroundMesh;
        slider.rangeSize = range[1] - range[0];
        slider.onValChange = onValChange;

        slider.lineHeight = UI3D.SLIDERLINEHEIGHT();
        slider.line = BF.MakeBox(name.concat('Line'), scene, length, slider.lineHeight, UI3D.SLIDERLINEWIDTH(), {}, false);
        slider.line.parent = slider.node;
        slider.line.position.y = UI3D.SLIDERLINEHEIGHT()/2;
        BF.BakeMeshs([slider.line]);
        slider.line.material = window.myMats.darkSun;

        slider.pointerDown = function(pointerInfo) {
            if (pointerInfo.pickInfo.pickedMesh == slider.mesh) {
                return true;
            }
            return false;
        }

        slider.pointerUp = function(pointerInfo) {
            // may not need to do anything bc pointerManager will unlink control
        }

        slider.pointerMove = function(pointerInfo) {
            var sliderPos = slider.getNewSliderPos(scene);
            if (sliderPos) {
                slider.mesh.position.x = MF.Clamp(sliderPos, -length/2, length/2);
                slider.updateValue();
                slider.onValChange(slider.value);
                if (slider.textPlane) {
                    slider.textPlane.setText(slider.text + slider.getValString() + ' ' + slider.units);
                }
            }
        }

        slider.getNewSliderPos = function(scene) {
            var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == slider.backgroundMesh; });
            if (pickInfo.hit) {
                return BF.TransformVecWorldToOTensLocal(slider.oTens, pickInfo.pickedPoint.subtractInPlace(slider.node.position))[0];
            }
            return null;
        }

        slider.updateValue = function() {
            slider.value = (slider.mesh.position.x/length + .5) * (slider.rangeSize) + range[0];
        }

        slider.addToPointerManager = function(mode) {
            window.pointerManager.addInteractCallbacksToMode(slider.name, slider, mode);
        }

        slider.setSliderPositionFromValue = function(val) {
            val = MF.Clamp(val, range[0], range[1]);
            slider.mesh.position.x = ((val - range[0]) / slider.rangeSize - .5) * length;
        }

        slider.setValue = function(val) {
            slider.value = val;
            slider.setSliderPositionFromValue(val);
        }

        slider.addText = function(text, units = '') {
            slider.text = text.concat(': ');
            slider.units = units;
            var sliderText = slider.text + slider.getValString() + ' ' + units;
            slider.textPlane = UI3D.MakeTextPlane(slider.name.concat('TextPlane'), scene, length, UI3D.SLIDERTEXTPLANEHEIGHT(), sliderText, UI3D.SLIDERTEXTFONTSIZE());
            slider.textPlane.parent = slider.node;
            slider.textPlane.position.z = -3;
            slider.textPlane.position.y = .1;
            slider.textPlane.rotation.x = Math.PI/2;
        }

        slider.getValString = function() {
            var valString = (math.round(10*slider.value)/10).toString();
            if (valString.length < 3) {
                valString = valString.concat('.0');
            }
            return valString;
        }

        slider.updateNodeOTens = function() {
            // called after rotating slider node
            slider.oTens = BF.GetOTens(slider.node);
        }

        slider.setValue(initVal);
        slider.updateNodeOTens();

        return slider;
    }

    static MakeSphereSlider(name, scene, sphereRad, backgroundMesh, range, initVal, length, onValChange, verticleOffset = 0) {
        var sphere = BF.MakeSphere(name.concat('Sphere'), scene, 2 * sphereRad);
        return UI3D.MakeSlider(name, scene, sphere, backgroundMesh, range, initVal, length, onValChange, verticleOffset);
    }

    static MakePuckSlider(name, scene, puckDiameter, puckHeight, backgroundMesh, range, initVal, length, fontSize, onValChange) {
        // oriented with cyl axis in y dir - ie on ground facing up
        var puck = BF.MakeCylinder(name.concat('Puck'), scene, puckHeight, puckDiameter);
        puck.position.y = puckHeight/2;
        BF.BakeMeshs([puck]);

        var slider = UI3D.MakeSlider(name, scene, puck, backgroundMesh, range, initVal, length, onValChange);
        slider.height = puckHeight;

        var valTextSide = puckDiameter / Math.sqrt(2);
        slider.valText = UI3D.MakeTextPlane(name.concat('ValText'), scene, valTextSide, valTextSide, (Math.round(slider.value*10)/10).toString(), fontSize);
        slider.valText.parent = slider.mesh;
        slider.valText.position.y = puckHeight + .1;
        slider.valText.rotation.x = Math.PI/2;

        slider.pointerDown = function(pointerInfo) {
            if (pointerInfo.pickInfo.pickedMesh == slider.mesh || pointerInfo.pickInfo.pickedMesh == slider.valText) {
                return true;
            }
            return false;
        }

        slider.pointerMove = function(pointerInfo) {
            var sliderPos = slider.getNewSliderPos(scene);
            if (sliderPos) {
                slider.mesh.position.x = MF.Clamp(sliderPos, -length/2, length/2);
                slider.updateValue();
                slider.onValChange(slider.value);
                slider.valText.setText(slider.getValString());
            }
        }

        slider.addText = function(text) {
            slider.text = text;
            slider.textPlane = UI3D.MakeTextPlane(slider.name.concat('TextPlane'), scene, length, UI3D.SLIDERTEXTPLANEHEIGHT(), slider.text, UI3D.SLIDERTEXTFONTSIZE());
            slider.textPlane.parent = slider.node;
            slider.textPlane.position.z = -3;
            slider.textPlane.position.y = .1;
            slider.textPlane.rotation.x = Math.PI/2;
        }

        return slider;
    }

    static MakeRisingPanel(name, scene, width, height, downHeight, gridDimensions, pointerManagerMode) {
        // risingPanel is oriented in x-y plane
        // gridDimensions is [numRows, numColumns]
        var risingPanel = {};
        risingPanel.node = BF.MakeTransformNode(name.concat('Node'), scene);
        risingPanel.panel = BF.MakeBox(name.concat('Panel'), scene, width, height, UI3D.RISINGPANELDEPTH());
        risingPanel.upTarget = height/2;
        risingPanel.downTarget = -height/2 + downHeight
        risingPanel.panel.position.y = risingPanel.downTarget;
        risingPanel.panel.parent = risingPanel.node;
        risingPanel.isDown = true;

        var controlNode = BF.MakeTransformNode(name.concat('ControlNode'), scene);
        controlNode.parent = risingPanel.panel;
        controlNode.rotation.x = -Math.PI/2;
        controlNode.position.z = -UI3D.RISINGPANELDEPTH()/2;
        risingPanel.controls = {node: controlNode};

        risingPanel.pointerDown = function(pointerInfo) {
            if (pointerInfo.pickInfo.pickedMesh == risingPanel.panel) {
                risingPanel.isDown = !risingPanel.isDown;
                if (window.funcBuffer[name]) {
                    risingPanel.removeFromFuncBuffer();
                    if (risingPanel.isDown) {
                        risingPanel.onPanelDown();
                    } else {
                        risingPanel.onPanelUp();
                    }
                } else {
                    if (risingPanel.isDown) {
                        risingPanel.onPanelDown();
                    } else {
                        risingPanel.onPanelUp();
                    }
                }
                return true;
            }
            return false;
        }

        risingPanel.onPanelDown = function() {
            window.funcBuffer.addFunc(name, risingPanel.moveDown, UI3D.RISINGPANELCONTROLANIMKEYS(), UI3D.RISINGPANELANIMKEYS(), GF.DoNothing);
            if (risingPanel.controls.sliders) {
                for (var i = 0; i < risingPanel.controls.sliders.length; i++) {
                    window.funcBuffer.addFunc(name.concat('Slider') + i, risingPanel.controls.sliders[i].moveIn, 0, UI3D.RISINGPANELCONTROLANIMKEYS(), GF.DoNothing);
                    window.funcBuffer.addFunc(name.concat('SliderLine') + i, risingPanel.controls.sliders[i].moveLineIn, 0, UI3D.RISINGPANELCONTROLANIMKEYS(), GF.DoNothing);
                }
            }
            if (risingPanel.controls.knobNode) {
                window.funcBuffer.addFunc(name.concat('KnobNode'), risingPanel.controls.knobNode.moveIn, 0, UI3D.RISINGPANELCONTROLANIMKEYS(), GF.DoNothing);
            }
        }

        risingPanel.onPanelUp = function() {
            window.funcBuffer.addFunc(name, risingPanel.moveUp, 0, UI3D.RISINGPANELANIMKEYS(), GF.DoNothing);
            if (risingPanel.controls.sliders) {
                for (var i = 0; i < risingPanel.controls.sliders.length; i++) {
                    window.funcBuffer.addFunc(name.concat('Slider') + i, risingPanel.controls.sliders[i].moveOut, UI3D.RISINGPANELANIMKEYS(), UI3D.RISINGPANELCONTROLANIMKEYS(), GF.DoNothing);
                    window.funcBuffer.addFunc(name.concat('SliderLine') + i, risingPanel.controls.sliders[i].moveLineOut, UI3D.RISINGPANELANIMKEYS(), UI3D.RISINGPANELCONTROLANIMKEYS(), GF.DoNothing);
                }
            }
            if (risingPanel.controls.knobNode) {
                window.funcBuffer.addFunc(name.concat('KnobNode'), risingPanel.controls.knobNode.moveOut, UI3D.RISINGPANELANIMKEYS(), UI3D.RISINGPANELCONTROLANIMKEYS(), GF.DoNothing);
            }
        }

        risingPanel.removeFromFuncBuffer = function() {
            window.funcBuffer.removeFunc(name);
            if (risingPanel.controls.sliders) {
                for (var i = 0; i < risingPanel.controls.sliders.length; i++) {
                    window.funcBuffer.removeFunc(name.concat('Slider') + i);
                    window.funcBuffer.removeFunc(name.concat('SliderLine') + i);
                }
            }
        }

        risingPanel.pointerUp = GF.DoNothing;

        risingPanel.pointerMove = GF.DoNothing;

        risingPanel.interpMultFunc = function(i) { return .01 * i }

        risingPanel.moveUp = IF.MakeInterpFunc(risingPanel.panel.position, 'y', risingPanel.upTarget, risingPanel.interpMultFunc);

        risingPanel.moveDown = IF.MakeInterpFunc(risingPanel.panel.position, 'y', risingPanel.downTarget, risingPanel.interpMultFunc);

        risingPanel.addToPointerManager = function(mode) {
            window.pointerManager.addInteractCallbacksToMode(risingPanel.name, risingPanel, mode);
        }

        risingPanel.makeGrid = function(gridDimensions) {
            // gridDimensions is [numRow, numCol]
            risingPanel.grid = [];
            var scale = 1.3; // spread out the grid a little bit;
            var hStep = width / (gridDimensions[1] + 1);
            var vStep = height / (gridDimensions[0] + 1);
            for (var i = 1; i < gridDimensions[0] + 1; i++) {
                var row = [];
                var zpos = height/2 - i*vStep;
                for (var j = 1; j < gridDimensions[1] + 1; j++) {
                    var pos = BF.Vec3([-width/2 + j*hStep, 0, zpos]).scaleInPlace(scale);
                    row.push(pos);
                }
                risingPanel.grid.push(row);
            }
        }

        risingPanel.addSlider = function(slider, gridCoord) {
            // gridCoord is [row, col]
            // slider needs a height
            if (!risingPanel.controls.sliders) {
                risingPanel.controls.sliders = [];
            }

            slider.node.parent = risingPanel.controls.node;
            slider.updateNodeOTens();
            slider.node.position = risingPanel.grid[gridCoord[0]][gridCoord[1]];
            slider.addToPointerManager(pointerManagerMode);
            slider.mesh.position.y = -slider.height + .02;
            slider.line.position.y = -slider.lineHeight + .01;

            slider.interpMultFunc = function(i) { return i * .05 }
            slider.moveOut = IF.MakeInterpFunc(slider.mesh.position, 'y', 0, slider.interpMultFunc);
            slider.moveIn = IF.MakeInterpFunc(slider.mesh.position, 'y', -slider.height + .02, slider.interpMultFunc);
            slider.moveLineOut = IF.MakeInterpFunc(slider.line.position, 'y', 0, slider.interpMultFunc);
            slider.moveLineIn = IF.MakeInterpFunc(slider.line.position, 'y', -slider.lineHeight + .01, slider.interpMultFunc);

            risingPanel.controls.sliders.push(slider);
        }

        risingPanel.addKnob = function(knob, gridCoord) {
            // gridCoord is [row, col]
            if (!risingPanel.controls.knobNode) {
                risingPanel.controls.knobNode = BF.MakeTransformNode(name.concat('KnobNode'), scene);
                risingPanel.controls.knobNode.parent = risingPanel.controls.node;
                risingPanel.controls.knobNode.position.y = -knob.height + .02;
                risingPanel.controls.knobNode.interpMultFunc = function(i) { return i * .05 }
                risingPanel.controls.knobNode.moveOut = IF.MakeInterpFunc(risingPanel.controls.knobNode.position, 'y', 0, risingPanel.controls.knobNode.interpMultFunc);
                risingPanel.controls.knobNode.moveIn = IF.MakeInterpFunc(risingPanel.controls.knobNode.position, 'y', -knob.height + .02, risingPanel.controls.knobNode.interpMultFunc);
            }

            knob.node.parent = risingPanel.controls.knobNode;
            knob.node.position = risingPanel.grid[gridCoord[0]][gridCoord[1]];
            knob.addToPointerManager(pointerManagerMode);
        }

        risingPanel.makeGrid(gridDimensions);
        risingPanel.addToPointerManager(pointerManagerMode);

        return risingPanel;
    }

    static MakeTwistKnob(name, scene, diameter, depth, backgroundMesh, range, initVal, sensitivityMult, fontSize, onValChange) {
        var knob = {};
        knob.node = BF.MakeTransformNode(name.concat('node'), scene);
        knob.name = name;
        knob.range = range;
        knob.totRange = range[1] - range[0];
        knob.value = initVal;
        knob.maxRot = 9*Math.PI/10;
        knob.minRot = -knob.maxRot;
        knob.totRot = 2 * knob.maxRot;
        knob.sensitivity = sensitivityMult;
        knob.backgroundMesh = backgroundMesh;
        knob.onValChange = onValChange;
        knob.height = depth;

        knob.mesh = BF.MakeCylinder(name.concat('Mesh'), scene, depth, diameter);
        knob.mesh.position.y = depth/2;
        BF.BakeMeshs([knob.mesh]);
        knob.mesh.parent = knob.node;
        knob.mesh.material = window.myMats.lightBlue;

        var indWidth = diameter/24;
        var indLength = diameter/5;
        knob.indicator = BF.MakeBox(name.concat('Indicator'), scene, indWidth, indWidth, indLength);
        knob.indicator.parent = knob.mesh;
        knob.indicator.position.z = diameter/2 - indLength/2;
        knob.indicator.position.y = depth;
        knob.indicator.material = window.myMats.black;

        var valTextSide = diameter/Math.sqrt(2);
        knob.valText = UI3D.MakeTextPlane(name.concat('ValText'), scene, valTextSide, valTextSide, (Math.round(knob.value*10)/10).toString(), fontSize);
        knob.valText.parent = knob.node;
        knob.valText.rotation.x = Math.PI/2;
        knob.valText.position.y = depth + .1;

        knob.pointerDown = function(pointerInfo) {
            if (pointerInfo.pickInfo.pickedMesh == knob.mesh || pointerInfo.pickInfo.pickedMesh == knob.valText) {
                knob.startVal = knob.value;
                knob.startPos = scene.pointerY;
                return true;
            }
            return false;
        }

        knob.pointerUp = GF.DoNothing;

        knob.pointerMove = function(pointerInfo) {
            var res = knob.setNewVal(scene);
            if (res) {
                knob.setRot();
                knob.valText.setText(knob.getValString());
                knob.onValChange(knob.value);
                return true;
            }
            return false;
        }

        knob.setNewVal = function(scene) {
            knob.value = MF.Clamp(knob.startVal + knob.sensitivity * (knob.startPos - scene.pointerY), knob.range[0], knob.range[1]);
            return true;
        }

        knob.getValString = function() {
            return (Math.round(knob.value*10)/10).toString();
        }

        knob.setValText = function() {
            knob.valText.setText(knob.getValString());
        }

        knob.setRot = function() {
            knob.mesh.rotation.y = MF.TransformScaleWithTotRange(knob.value, knob.range[0], knob.totRange, knob.minRot, knob.totRot);
        }

        knob.addToPointerManager = function(mode) {
            window.pointerManager.addInteractCallbacksToMode(knob.name, knob, mode);
        }

        knob.setRot();

        return knob;
    }

    static MakeTwistKnobPrecise(name, scene, diameter, depth, backgroundMesh, range, initVal, sensitivityMult, fontSize, onValChange) {
        var knob = UI3D.MakeTwistKnob(name, scene, diameter, depth, backgroundMesh, range, initVal, sensitivityMult, fontSize, onValChange);

        knob.getValString = function() {
            return (Math.round(knob.value*100)/100).toString();
        }

        return knob;
    }

    static MakeTwistKnobInt(name, scene, diameter, depth, backgroundMesh, range, initVal, sensitivityMult, fontSize, onValChange) {
        var knob = UI3D.MakeTwistKnob(name, scene, diameter, depth, backgroundMesh, range, initVal, sensitivityMult, fontSize, onValChange);

        knob.setNewVal = function(scene) {
            knob.value = Math.round(MF.Clamp(knob.startVal + knob.sensitivity * (knob.startPos - scene.pointerY), knob.range[0], knob.range[1]));
            return true;
        }

        knob.getValString = function() {
            return knob.value.toString();
        }

        return knob;
    }
}

class PointerManager {
    // handles the scene pointer observable
    // controls which pointer callbacks are active
    constructor (scene) {
        this.interactModes = {};
        this.camModes = {};
        this.activePointerUps = {};
        this.activePointerMoves = {};
        this.activePointerIds = [];
        scene.onPointerObservable.add(PointerManager.MakeOnPointerObservableCallback(this));
    }

    pointerDown(pointerInfo) {
        if (this.interactModes.activeMode) {
            var aiMode = this.interactModes.activeMode; //active interact mode
            var aiDownKeys = aiMode.pointerDownKeys; // active interact pointerDown keys
            var isInteracting = false;
            for (var i = 0; i < aiDownKeys.length; i++) {
                isInteracting = aiMode.pointerDowns[aiDownKeys[i]](pointerInfo);
                if (isInteracting) {
                    this.activePointerUps[pointerInfo.event.pointerId] = aiMode.pointerUps[aiDownKeys[i]];
                    this.activePointerMoves[pointerInfo.event.pointerId] = aiMode.pointerMoves[aiDownKeys[i]];
                    this.activePointerIds = Object.keys(this.activePointerUps);
                    break;
                }
            }
            if (!isInteracting) {
                var res = this.camModes.activeMode.pointerDown(pointerInfo);
                if (res) {
                    this.activePointerUps[pointerInfo.event.pointerId] = this.camModes.activeMode.pointerUp;
                    this.activePointerMoves[pointerInfo.event.pointerId] = this.camModes.activeMode.pointerMove;
                    this.activePointerIds = Object.keys(this.activePointerUps);
                }
            }
        } else {
            var res = this.camModes.activeMode.pointerDown(pointerInfo);
            if (res) {
                this.activePointerUps[pointerInfo.event.pointerId] = this.camModes.activeMode.pointerUp;
                this.activePointerMoves[pointerInfo.event.pointerId] = this.camModes.activeMode.pointerMove;
                this.activePointerIds = Object.keys(this.activePointerUps);
            }
        }
    }

    pointerUp(pointerInfo) {
        var activeIds = this.activePointerIds; //active interact mode
        for (var i = 0; i < activeIds.length; i++) {
            if (activeIds[i] == pointerInfo.event.pointerId) { // use == for type conversion (activeIds are converted to strings, pointerId is number)
                this.activePointerUps[activeIds[i]](pointerInfo);
                delete this.activePointerUps[activeIds[i]];
                delete this.activePointerMoves[activeIds[i]];
                this.activePointerIds = Object.keys(this.activePointerUps);
            }
        }
    }

    pointerMove(pointerInfo) {
        var activeIds = this.activePointerIds; //active interact mode
        for (var i = 0; i < activeIds.length; i++) {
            if (activeIds[i] == pointerInfo.event.pointerId) {
                this.activePointerMoves[activeIds[i]](pointerInfo);
            }
        }
    }

    addInteractCallbacksToMode (name, obj, mode) {
        // modeType is 'interact' or 'cam'
        if (!this.interactModes[mode]) {
            this.interactModes[mode] = {
                pointerDowns: {},
                pointerUps: {},
                pointerMoves: {}
            }
        }

        this.interactModes[mode].pointerDowns[name] = obj.pointerDown;
        this.interactModes[mode].pointerDownKeys = Object.keys(this.interactModes[mode].pointerDowns);
        this.interactModes[mode].pointerUps[name] = obj.pointerUp;
        this.interactModes[mode].pointerMoves[name] = obj.pointerMove;

        if (!this.interactModes.activeMode) {
            this.interactModes.activeMode = this.interactModes[mode];
        }
    }

    addCamCallbacksToMode (mode, obj) {
        // modeType is 'interact' or 'cam'
        if (!this.camModes[mode]) {
            this.camModes[mode] = {};
        }

        this.camModes[mode].pointerDown = obj.pointerDown;
        this.camModes[mode].pointerUp = obj.pointerUp;
        this.camModes[mode].pointerMove = obj.pointerMove;

        if (!this.camModes.activeMode) {
            this.camModes.activeMode = this.camModes[mode];
        }
    }

    switchActiveInteractMode (mode) {
        // modeType is 'cam' or 'interact'
        this[interactModes].activeMode = this[interactModes][mode];
    }

    switchActiveCamMode (mode) {
        // modeType is 'cam' or 'interact'
        this.camModes.activeMode = this.camModes[mode];
    }

    static MakeOnPointerObservableCallback(pointerManager) {
        var onPointerObservableCallback = function(pointerInfo) {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    pointerManager.pointerDown(pointerInfo);
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    pointerManager.pointerUp(pointerInfo);
                    break;
                case BABYLON.PointerEventTypes.POINTERMOVE:
                    pointerManager.pointerMove(pointerInfo);
                    break;
            }
        }
        return onPointerObservableCallback;
    }
}
