class VF {
    // Vector Functions
    static Mag(vec) {
        return math.sqrt(math.dot(vec,vec));
    }

    static Unit(vec) {
        const magnitude=VF.Mag(vec);
        if(magnitude!==0) {
            return math.multiply(vec,1/magnitude);
        } else {
            return [0,0,0];
        }
    }

    static Unit2(vec, mag) {
        if(mag!==0) {
            return math.multiply(vec,1/mag);
        } else {
            return [0,0,0];
        }
    }

    static Unit2D(vec) {
        const magnitude=VF.mag(vec);
        if(magnitude!==0) {
            return math.multiply(vec,1/magnitude);
        } else {
            return [0,0];
        }
    }

    static R(v1,v2) {
        //returns vector from v1 to v2
        return math.add(v2,math.multiply(v1,-1));
    }

    static RHat(v1,v2) {
        return VF.Unit(VF.R(v1,v2));
    }

    static ScaleVecToLength(vec, length) {
        return math.multiply(VF.Unit(vec), length);
    }

    static ScaleVecToLength2(vec, mag, length) {
        return math.multiply(VF.Unit2(vec, mag), length);
    }

    static GetAzimXZ(vec) {
        // ground plane is xz
        // from -pi to pi
        // measures azim from pos x axis
        // positive azim if z < 0, negative if z > 0 because positive rotation about yHat moves xHat away from positive zhat
        // vec must be unit
        if(vec[0]>0) {
            if(vec[2]>0) {
                return -math.atan2(vec[2],vec[0]);
            } else if(vec[2]<0) {
                return math.atan2(-vec[2],vec[0]);
            } else {
                return 0;
            }
        } else if(vec[0]<0) {
            if(vec[2]>0) {
                return math.atan2(vec[2],-vec[0]) - Math.PI;
            } else if(vec[2]<0) {
                return Math.PI - math.atan2(-vec[2],-vec[0]);
            } else {
                return Math.PI;
            }
        } else { // vec[0] = 0;
            if(vec[2]>0) {
                return -Math.PI/2;
            } else if(vec[2]<0) {
                return Math.PI/2;
            } else {
                return null;
                console.log('cant get azim of yHat');
            }
        }
    }

    static GetAzimZX(vec) {
        // ground plane is zx
        // from -pi to pi
        // measures azim from pos Z axis (direction camera points)
        // positive azim if x > 0, negative if x < 0 because positive rotation about yHat moves zHat towards positive xhat
        // vec must be unit
        if (vec[2]>0) {
            if (vec[0]>0) {
                return math.atan2(vec[0], vec[2]);
            } else if (vec[0]<0) {
                return -math.atan2(-vec[0], vec[2]);
            } else {
                return 0;
            }
        } else if (vec[2]<0) {
            if(vec[0]>0) {
                return  Math.PI - math.atan2(vec[0], -vec[2]);
            } else if(vec[0]<0) {
                return math.atan2(-vec[0], -vec[2]) - Math.PI;
            } else {
                return Math.PI;
            }
        } else { // vec[2] = 0;
            if (vec[0]>0) {
                return Math.PI/2;
            } else if (vec[0]<0) {
                return -Math.PI/2;
            } else {
                return 0;
                console.log('cant get azim of yHat');
            }
        }
    }

    static GetAzimXY(vec) {
        // ground plane is xy
        // from -pi to pi
        // measures azim from pos x axis
        // positive azim if y > 0, negative if y < 0;
        // vec must be unit
        if(vec[0]>0) {
            if(vec[1]>0) {
                return math.atan2(vec[1],vec[0]);
            } else if(vec[1]<0) {
                return -math.atan2(-vec[1],vec[0]);
            } else {
                return 0;
            }
        } else if(vec[0]<0) {
            if(vec[1]>0) {
                return Math.PI - math.atan2(vec[1],-vec[0]);
            } else if(vec[1]<0) {
                return math.atan2(-vec[1],-vec[0]) - Math.PI;
            } else {
                return Math.PI;
            }
        } else { // vec[0] = 0;
            if(vec[1]>0) {
                return Math.PI/2;
            } else if(vec[1]<0) {
                return -Math.PI/2;
            } else {
                return 0;
            }
        }
    }

    static GetAltAzimXZ(vec) {
        // vec must be unit vector
        // for xz ground plane
        const alt = math.asin(vec[1]);
        const azim = VF.GetAzimXZ(vec);
        return [alt,azim];
    }

    static GetAltAzimZX(vec) {
        // vec must be unit vector
        // for xz ground, measuring from pos Z axis
        // alt is neg bc neg rot about x rotates poz z upwards
        const alt = -math.asin(vec[1]);
        const azim = VF.GetAzimZX(vec);
        return [alt, azim];
    }

    static GetAltAzimXY(vec) {
        // vec must be unit vector
        // for xy ground plane
        // alt is negative because positive rotation about yHat moves xHat away from positive zhat
        const alt = -math.asin(vec[2]);
        const azim = VF.GetAzimXY(vec);
        return [alt,azim];
    }

    static ShortestAzimRoute(initAzim,finalAzim) {
        if(initAzim<=quad2) {
            if(finalAzim<=(initAzim+Math.PI)){
                return finalAzim-initAzim;
            } else {
                return finalAzim-initAzim-quad4;
            }
        } else {
            if(finalAzim>=initAzim) {
                return finalAzim-initAzim;
            } else if(finalAzim<initAzim-PI) {
                return finalAzim+quad4-initAzim;
            } else {
                return finalAzim-initAzim;
            }
        }
    }

    static GetDeltaAltAzim(iVec,fVec) {
        const iVecAltAzim=VF.GetAltAzim(iVec);
        const fVecAltAzim=VF.GetAltAzim(fVec);
        const deltaAlt=fVecAltAzim[0]-iVecAltAzim[0];
        const deltaAzim=VF.ShortestAzimRoute(iVecAltAzim[1],fVecAltAzim[1]);
        return [deltaAlt,deltaAzim];
    }

    static GetPointBetweenWithZ(p0,p1,zFinal) {
        const rHat=VF.rHat(p0,p1);
        const d=(zFinal-p0[2])/rHat[2];
        return math.add(p0,math.multiply(rHat,d));
    }

    static AddVecToRows(mat,vec) {
        // does not work for math.js matrices. use standard js matrices. does not change input matrix.
        const out=mat.map(function(row) {
            return math.add(row,vec);
        })
        return out;
    }

    static GetAvgPoint(pointsMat) {
        let avg=[0,0,0];
        pointsMat.forEach(function(point) {
            avg=math.add(avg,point);
        });
        return math.divide(avg,pointsMat.length);
    }

    staticGgetAvgPoint2D(pointsMat) {
        let avg=[0,0];
        pointsMat.forEach(function(point) {
            avg=math.add(avg,point);
        });
        return math.divide(avg,pointsMat.length);
    }

    static ArrSum(arrayOfNums) {
        return arrayOfNums.reduce(function(a,b) {
            return a+b;
        }, 0);
    }

    static GetAvgNum(arrayOfNums) {
        return VF.arrSum(arrayOfNums)/arrayOfNums.length;
    }

    static toPolar(x,y) {
        const r=VF.Mag([x,y]);
        const theta=VF.getAzim([x,y]);
        return [r,theta];
    }

    static fromPolar(r,theta) {
        return [r*math.cos(theta),r*math.sin(theta)]
    }

    static rot2D(point,alpha) { //rotates clockwise with y pointing down
        let rotMat=[[math.cos(alpha),math.sin(alpha)],[-math.sin(alpha),math.cos(alpha)]];
        return math.multiply(point,rotMat);
    }

    static linspace(start,stop,N) {
        // N is length of linspace array
        const step=(stop-start)/(N-1);
        let space=[];
        for(var i=0;i<N;i++) {
            space.push(start+i*step);
        }
        return space
    }

    static linspace2D(start,stop,N) {
        // N is length of linspace array
        const step=math.multiply(math.add(stop,math.multiply(-1,start)),1/(N-1));
        let space=[];
        for(var i=0;i<N;i++) {
            space.push(math.add(start,math.multiply(step,i)));
        }
        return space
    }

    static zeroes(length) {
        let space=[]
        for(var i=0;i<length;i++) {
            space.push(0)
        }
        return space
    }

    static rk4(derivs,params,xy0,dt,t) {
        //derivs is func of x, y, params, t that returns [xDot,yDot]
        //this func returns update x,y after one step of dt
        const x0=xy0[0];
        const y0=xy0[1];
        const k1=derivs(x0,y0,params,t);
        const k2=derivs(x0+k1[0]*dt/2, y0+k1[1]*dt/2, params, t+dt/2);
        const k3=derivs(x0+k2[0]*dt/2, y0+k2[1]*dt/2, params, t+dt/2);
        const k4=derivs(x0+k3[0]*dt, y0+k3[1]*dt ,params, t+dt);
        const k=(1/6)*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);
        const l=(1/6)*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);
        return [x0+k*dt,y0+l*dt];
    }

    static rk4Double(deriv,xy0,dt) {
        //performs 2D rk4 for xDoubleDot=f(x)
        //deriv is func of x=[x,y], v=[xDot,yDot], and params, returns [v,a]
        //xy0=[[x,y],v=[xDot,yDot]]
        //this func returns [x,v] after one step
        const x0=xy0[0];
        const y0=xy0[1];
        const k1=deriv(x0,y0);
        const k2=deriv(math.add(x0,math.multiply(k1[0],dt/2)),math.add(y0,math.multiply(k1[1],dt/2)));
        const k3=deriv(math.add(x0,math.multiply(k2[0],dt/2)),math.add(y0,math.multiply(k2[1],dt/2)));
        const k4=deriv(math.add(x0,math.multiply(k3[0],dt/2)),math.add(y0,math.multiply(k3[1],dt/2)));;
        const k=math.multiply(math.add(k1[0],math.multiply(k2[0],2),math.multiply(k3[0],2),k4[0]),(1/6));
        const l=math.multiply(math.add(k1[1],math.multiply(k2[1],2),math.multiply(k3[1],2),k4[1]),(1/6));
        return [math.add(x0,math.multiply(k,dt)),math.add(y0,math.multiply(l,dt))];
    }
}

class Rot {
    // 3D Rotatation Funcs
    static quatMultReal(q1Real,q1Vect,q2Real,q2Vect) {
        return q1Real*q2Real-q1Vect[0]*q2Vect[0]-q1Vect[1]*q2Vect[1]-q1Vect[2]*q2Vect[2];
    }

    static quatMultVect(q1Real,q1Vect,q2Real,q2Vect) {
        const vect0=q1Real*q2Vect[0]+q2Real*q1Vect[0]+q1Vect[1]*q2Vect[2]-q1Vect[2]*q2Vect[1];
        const vect2=q1Real*q2Vect[1]+q2Real*q1Vect[1]+q1Vect[2]*q2Vect[0]-q1Vect[0]*q2Vect[2];
        const vect3=q1Real*q2Vect[2]+q2Real*q1Vect[2]+q1Vect[0]*q2Vect[1]-q1Vect[1]*q2Vect[0];
        return [vect0,vect2,vect3]
    }

    static quatRot(pVect,qReal,qVect) {
        const real0=Rot.quatMultReal(qReal,qVect,0,pVect);
        const vect0=Rot.quatMultVect(qReal,qVect,0,pVect);
        return Rot.quatMultVect(real0,vect0,qReal,math.multiply(qVect,-1));
    }

    static point(point,wHat,rad) {
        const qReal=math.cos(rad/2);
        const qVect=math.multiply(wHat,math.sin(rad/2));
        return Rot.quatRot(point,qReal,qVect);
    }

    static points(points,wHat,rad) {
        const qReal=math.cos(rad/2);
        const qVect=math.multiply(wHat,math.sin(rad/2));
        const rotPoints=points.map(function(point) {
            return Rot.quatRot(point,qReal,qVect);
        });
        return rotPoints;
    }

    static oTens(oTens,wHat,rad) {
        const qReal=math.cos(rad/2);
        const qVect=math.multiply(wHat,math.sin(rad/2));
        return [VF.Unit(Rot.quatRot(oTens[0],qReal,qVect)),VF.Unit(Rot.quatRot(oTens[1],qReal,qVect)),VF.Unit(Rot.quatRot(oTens[2],qReal,qVect))];
    }

    static oTens2(oTens,w,dt) {
        let rad=VF.Mag(w);
        const wHat=math.divide(w,rad);
        rad=rad*dt;
        const qReal=math.cos(rad/2);
        const qVect=math.multiply(wHat,math.sin(rad/2));
        return [VF.Unit(Rot.quatRot(oTens[0],qReal,qVect)),VF.Unit(Rot.quatRot(oTens[1],qReal,qVect)),VF.Unit(Rot.quatRot(oTens[2],qReal,qVect))];
    }
}

class PF {
    //Phys Funcs
    static MoveToCOM(mesh) {
        // translates mesh so local origin at COM
        // bakes transformation into vertices;
        let com=[0,0,0];
        let totMass=0;
        const verts=mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for(var i = 0; i < verts.length; i += 3) {
            com = math.add(com,[verts[i],verts[i+1],verts[i+2]]);
            totMass += 1;
        };
        com = math.divide(com,totMass);
        mesh.translate(BF.Vec3(math.multiply(com, -1)), 1, BABYLON.Space.WORLD);
        mesh.bakeCurrentTransformIntoVertices();
    }

    static GetMomentTensor(mesh,density) {
        let Ixx=0;
        let Iyy=0
        let Izz=0;
        let Ixy=0;
        let Ixz=0;
        let Iyz=0;
        let x;
        let y;
        let z;
        let xx;
        let yy;
        let zz;
        const verts=mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for(var i=0; i < verts.length; i += 3) {
            x=verts[i];
            y=verts[i+1];
            z=verts[i+2];
            xx=[y,z];
            yy=[x,z];
            zz=[x,y];
            Ixx+=math.dot(xx,xx)*density;
            Iyy+=math.dot(yy,yy)*density;
            Izz+=math.dot(zz,zz)*density;
            Ixy+=x*y*density;
            Ixz+=x*z*density;
            Iyz+=y*z*density;
        }
        return [[Ixx,-Ixy,-Ixz],[-Ixy,Iyy,-Iyz],[-Ixz,-Iyz,Izz]];
    }

    static getMT(oTens,princMomTens) {
        return math.multiply(math.multiply(math.transpose(oTens),princMomTens),oTens);
    }

    static getW(oTens,princMomTens,angMom) {
        const momTens=PF.getMT(oTens,princMomTens);
        return math.transpose(math.lusolve(momTens,math.transpose(angMom)))[0];
    }

    static getCorrW(oTens,princMomTens,angMom,dt) {
        const k1=PF.getW(oTens,princMomTens,angMom)
        const k2=PF.getW(Rot.oTens2(oTens,math.divide(k1,2),dt),princMomTens,angMom)
        const k3=PF.getW(Rot.oTens2(oTens,math.divide(k2,2),dt),princMomTens,angMom)
        const k4=PF.getW(Rot.oTens2(oTens,k3,dt),princMomTens,angMom)
        return math.divide(math.add(k1,math.multiply(k2,2),math.multiply(k3,2),k4),6)
    }
}

class MF {
    // math Funcs
    static MakeDerivFunc(func, dx = .01) {
        // func is func of 1 number variable
        // dx defines accuracy
        var deriv = function(x) {
            return (1/dx) * (func(x+dx/2) - func(x-dx/2));
        }
        return deriv;
    }

    static MakePartialDerivFunc(func, prop, dx = .01) {
        // func is func of p (parameter object)
        // prop is parameter property derivative is respect to
        // returns func of p
        // pConst is param object of any needed constants
        var multiplier = (1/dx);
        var partDeriv = function(p, pConst) {
            var pClone = Object.assign({}, p);
            pClone[prop] += dx/2;
            var top = func(pClone, pConst);
            pClone[prop] -= dx; // now p[prop] is x - dx/2
            var bottom = func(pClone, pConst);
            return multiplier * (top - bottom);
        }
        return partDeriv;
    }

    static MakePartialDerivFuncMult(funcs, prop, dx = .01) {
        // funcs is ar(funcs
        // prop is parameter property derivative is respect to
        // returns func of p
        // pConst is param object of any needed constants
        if(funcs.length === 0) {
            var zeroFunc = function(p, pConst) {
                return 0;
            }
            return zeroFunc;
        } else if(funcs.length === 1) {
            return MF.MakePartialDerivFunc(funcs[0], prop, dx);
        } else {
            var multiplier = (1/dx);
            var partDerivMult = function(p, pConst) {
                var pClone = Object.assign({}, p);
                pClone[prop] += dx/2;
                var top = 0;
                for(var i = 0; i < funcs.length; i++){
                    top += funcs[i](pClone, pConst);
                }
                pClone[prop] -= dx;
                var bottom = 0;
                for(var i = 0; i < funcs.length; i++){
                    bottom += funcs[i](pClone, pConst);
                }
                return multiplier * (top - bottom);
            }
            return partDerivMult;
        }
    }

    static Square(n) {
        return Math.pow(n, 2);
    }

    static Clamp(x, a, b) {
        // clamps x to between a and b
        return Math.min(b, Math.max(a, x));
    }

    static TransformScale(val, range0, range1) {
        // transforms val position in range0 to val position in range1
        // (val - range0[0])/totRange0 = (returnVal - range1[0])/totRange1
        // range0, range1 are ar2: [min, max]
        var totRange0 = range0[1] - range0[0];
        var totRange1 = range1[1] - range1[0];
        return MF.TransformScaleWithTotRange(val, range0[0], totRange0, range1[0], totRange1);
    }

    static TransformScaleWithTotRange(val, minRange0, totRange0, minRange1, totRange1) {
        // transforms val position in range0 to val position in range1
        // (val - range0[0])/totRange0 = (returnVal - range1[0])/totRange1
        // minRange0, minRange1 are numbers (min val of range)
        return (val - minRange0) * (totRange1 / totRange0) + minRange1;
    }
}

class GF {
    // General Funcs
    static DownOne(func, prop, val) {
        // works with func(p), where p is parameter object
        // prop is string, defines property that is being set
        var down = function(p) {
            p[prop] = val;
            return func(p);
        }
        return down;
    }

    static DownToOne(func, p, finalProp) {
        // p is param obj
        // returns func of 1 variable (variable not parameter object)
        var dto = function(x) {
            p[finalProp] = x;
            return func(p);
        }
        return dto;
    }

    static SetObjWithKeyVal(obj, keys, vals) {
        // keys and vals have equal length
        for(var i = 0; i < keys.length; i++) {
            obj[keys[i]] = vals[i];
        }
    }

    static StringIn(str, ar) {
        // returns true if string is an element of array
        // false otherwise
        for(var i = 0; i < ar.length; i++) {
            if(ar[i] === str) {
                return true;
            }
        }
        return false;
    }

    static BothStringsIn(str1, str2, ar) {
        return (GF.StringIn(str1, ar) && GF.StringIn(str2, ar));
    }

    static DoNothing() {
        // does nothing
    }

    static SwitchVarIntoList(variable, list, index) {
        // variable is set to list[index]
        // puts variable into list at index (replacing what's there)
        // ex. variable = GF.SwitchVarIntoList(variable, list, index);
        var temp = list[index];
        list[index] = variable;

        return temp;
    }

    static Wrap(func, ...args) {
        var wrapped = function() {
            func(...args);
        }

        return wrapped;
    }
}

class FuncBuffer {
    // each func in buffer is func(animKey, ...args)
    constructor() {
        this.funcBuff = {};
        this.funcKeys = [];
    }

    addFunc(key, func, stepsUntil, numTimes, onRemove, ...args) {
        this.funcBuff[key] = {
            func:func, args:args,
            stepsUntil:stepsUntil,
            numTimes:numTimes,
            totNumTimes: numTimes,
            onRemove: onRemove
        };
        this.funcKeys = Object.keys(this.funcBuff);
    }

    removeFunc(key) {
        this.funcBuff[key].onRemove();
        delete this.funcBuff[key];
    }

    exist() {
        let keysToRemove=[];
        for (var i = 0; i < this.funcKeys.length; i++) {
            if(this.funcBuff[this.funcKeys[i]]['stepsUntil'] == 0) {
                if(this.funcBuff[this.funcKeys[i]]['numTimes'] != 0) {
                    this.funcBuff[this.funcKeys[i]]['func'](this.getAnimKey(this.funcKeys[i]), ...this.funcBuff[this.funcKeys[i]]['args']);
                    this.funcBuff[this.funcKeys[i]]['numTimes'] -= 1;
                } else {
                    keysToRemove.push(this.funcKeys[i]);
                }
            } else {
                this.funcBuff[this.funcKeys[i]]['stepsUntil'] -= 1;
            }
        }
        for(var i = 0; i < keysToRemove; i++) {
            this.removeFunc(keyToRemove[i]);
        }
        this.funcKeys = Object.keys(this.funcBuff);
    }

    getAnimKey(funcKey) {
        return this.funcBuff[funcKey].totNumTimes - this.funcBuff[funcKey].numTimes;
    }
}

class IF {
    // interpolation functions
    static MakeInterpFunc(obj, prop, target, interpMultFunc) {
        var interpFunc = function(i) {
            var delta = interpMultFunc(i) * (target - obj[prop]);
            obj[prop] += delta;
        }

        return interpFunc;
    }
}
