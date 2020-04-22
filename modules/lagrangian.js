class Lagrangian {
    // lagrangian update system
    static MakeStepFunc(mode, params, damping) {
        // slight velocity correction
        // steps any forced params by its constant paramDot;
        var step = function(dt) {
            mode.setPDD();
            for(var i = 0; i < mode.paramKeys.length; i++) {
                const vNext = params[mode.paramDotKeys[i]] + (mode.pDD[mode.paramKeys[i]] - damping[mode.paramDotKeys[i]] * params[mode.paramDotKeys[i]]) * dt;
                params[mode.paramKeys[i]] += .5 * (params[mode.paramDotKeys[i]] + vNext) * dt;
                params[mode.paramDotKeys[i]] = vNext;
            }
            for(var i = 0; i < mode.forcedParamKeys.length; i++) {
                params[mode.forcedParamKeys[i]] += params[mode.forcedParamDotKeys[i]] * dt;
            }   
        }
        return step;
    }

    static MakeSetPDDFunc(mode, pdfs, params, pConst) {
        var setPDD = function() {
            // sets PDD at current params
            var m = [];
            var mDot = [];
            var b = [];
            for(var i = 0; i < mode.paramKeys.length; i++) {
                var row = [];
                var rowDot = [];
                for(var j = 0; j < mode.allParamKeys.length; j++) {
                    row.push(pdfs[mode.paramDotKeys[i]][mode.allParamKeys[j]](params, pConst));
                }
                for(var j = 0; j < mode.paramDotKeys.length; j++) {
                    rowDot.push(pdfs[mode.paramDotKeys[i]][mode.paramDotKeys[j]](params, pConst));
                }
                b.push(pdfs[mode.paramKeys[i]](params, pConst));
                m.push(row);
                mDot.push(rowDot);
            }
            var c = math.add(b, math.multiply(math.multiply(m, mode.getQDot()), -1));
            var qDD = math.transpose(math.lusolve(mDot, c))[0];
            GF.SetObjWithKeyVal(mode.pDD, mode.paramKeys, qDD);
        }
        return setPDD;
    }

    static SetModeParamKeys(mode, params, forcedParamKeys) {
        mode.paramKeys = [];
        mode.paramDotKeys = [];
        mode.allParamKeys = [];
        mode.allParamDotKeys = [];
        mode.forcedParamDotKeys = [];
        var allKeys = Object.keys(params);
        for(var i = 0; i < allKeys.length; i++) {
            if(allKeys[i].slice(allKeys[i].length - 3) === 'Dot') {
                mode.allParamDotKeys.push(allKeys[i]);
                if(!GF.StringIn(allKeys[i].slice(0, allKeys[i].length - 3), mode.forcedParamKeys)) {
                    mode.paramDotKeys.push(allKeys[i]);
                } else {
                    mode.forcedParamDotKeys.push(allKeys[i]);
                }
            } else {
                mode.allParamKeys.push(allKeys[i]);
                if(!GF.StringIn(allKeys[i], mode.forcedParamKeys)) {
                    mode.paramKeys.push(allKeys[i]);
                }
            }
        }
    }

    static MakeMode(params, pConst, damping, pdfs, forcedParamKeys) {
        // forced params is array of all the paramKeys that are forced in this mode
        var mode = {};
        mode.forcedParamKeys = forcedParamKeys;
        Lagrangian.SetModeParamKeys(mode, params);
        mode.pDD = {};
        mode.qDot = Lagrangian.MakeQDot(params, mode.allParamDotKeys);
        mode.setPDD = Lagrangian.MakeSetPDDFunc(mode, pdfs, params, pConst);

        mode.getQDot = function() {
            for(var i = 0; i < mode.allParamDotKeys.length; i++) {
                mode.qDot[i] = params[mode.allParamDotKeys[i]];
            }
            return mode.qDot;
        }

        mode.step = Lagrangian.MakeStepFunc(mode, params, damping);

        return mode;
    }

    static MakeQDot(params, allParamDotKeys) {
        var qDot = [];
        for(var i = 0; i < allParamDotKeys.length; i++) {
            qDot.push(params[allParamDotKeys[i]]);
        }
        return qDot;
    }

    constructor(funcs, params, pConst, damping, dx = .01) {
        // funcs is array of functions for terms in lagrangian
        // each func has property paramKeys
        // paramKeys is ar(string) for all parameters in the term;
        // params is array of param obj properties (strings) eg. {x: 1, xDot:2, ...}
        // params should have one key for variable, one key for variableDot
        // ie has params.x and params.xDot;
        // works by creating m, mDot (matrices) based on the partial derivs evaluated at current params
        // then mDot * qDD = b - m * qDot = c
        // b = [dL/dq1, dL/dq2, ...], qDot = [q1Dot, q2Dot, ...], qDD = [q1DoubleDot, q2DoubleDot, ...]
        // params ordered {x: x0, xDot: xDot0, y: y0, yDot: yDot0, ...}
        // damping is parameter object with keys xDot, yDot, etc.
        // damping is velocity based
        // vf = vi + (vDot - damping*vi)*dt
        this.funcs = funcs;
        this.params = params;
        this.pConst = pConst;
        this.damping = damping;
        this.setAllParamKeys();
        this.setPartialDerivFuncs(dx);
        this.modes = {};
        this.addForcingMode('free', []);
        this.activeMode = this.modes['free'];
        this.bcFunc = GF.DoNothing;
    }

    step(dt, numTimes = 1) {
        for(var i = 0; i < numTimes; i++) {
            this.activeMode.step(dt);
            this.bcFunc();
        }
    }

    addForcingMode(name, forcedParamKeys) {
        // name becomes the key of the mode obj in this.modes
        // paramKey is the param that becomes forced
        // updateWithDot is boolean indicated whether the param should be stepped by paramDot;
        this.modes[name] = Lagrangian.MakeMode(this.params, this.pConst, this.damping, this.pdfs, forcedParamKeys);
    }

    switchForcingMode(name) {
        this.activeMode = this.modes[name];
    }

    setPartialDerivFuncs(dx) {
        this.pdfs = {} // partial deriv funcs
        this.setStandardPartialDerivs(dx);
        this.setDottedPartialDerivs(dx)
    }

    setStandardPartialDerivs(dx) {
        // sets dL/dq, for standard (non-dotted) params
        // also sets relevant first partial derivs with respect to dotted coords
        for(var i = 0; i < this.allParamKeys.length; i++) {
            var funcsWithParamKey = [];
            for(var j = 0; j < this.funcs.length; j++) {
                if(GF.StringIn(this.allParamKeys[i], this.funcs[j].paramKeys)) {
                    funcsWithParamKey.push(this.funcs[j]);
                }
                if(GF.StringIn(this.allParamDotKeys[i], this.funcs[j].paramKeys)) {
                    this.funcs[j][this.allParamDotKeys[i]] = MF.MakePartialDerivFunc(this.funcs[j], this.allParamDotKeys[i], dx);
                }
            }
            this.pdfs[this.allParamKeys[i]] = MF.MakePartialDerivFuncMult(funcsWithParamKey, this.allParamKeys[i], dx);
        }
    }

    setDottedPartialDerivs(dx) {
        for(var i = 0; i < this.allParamKeys.length; i++) {
            this.pdfs[this.allParamDotKeys[i]] = {};
            for(var j = 0; j < this.allParamKeys.length; j++) {
                var funcsWithDotAndStandardKey = [];
                var funcsWithDotAndDotKey = [];
                for(var k = 0; k < this.funcs.length; k++) {
                    if(GF.BothStringsIn(this.allParamDotKeys[i], this.allParamKeys[j], this.funcs[k].paramKeys)) {
                        funcsWithDotAndStandardKey.push(this.funcs[k][this.allParamDotKeys[i]]);
                    }
                    if(GF.BothStringsIn(this.allParamDotKeys[i], this.allParamDotKeys[j], this.funcs[k].paramKeys)) {
                        funcsWithDotAndDotKey.push(this.funcs[k][this.allParamDotKeys[i]]);
                    }
                }
                this.pdfs[this.allParamDotKeys[i]][this.allParamKeys[j]] = MF.MakePartialDerivFuncMult(funcsWithDotAndStandardKey, this.allParamKeys[j], dx);
                this.pdfs[this.allParamDotKeys[i]][this.allParamDotKeys[j]] = MF.MakePartialDerivFuncMult(funcsWithDotAndDotKey, this.allParamDotKeys[j], dx);
            }
        }
    }

    setAllParamKeys() {
        this.allParamKeys = [];
        this.allParamDotKeys = [];
        var allKeys = Object.keys(this.params);
        for(var i = 0; i < allKeys.length; i++) {
            if(allKeys[i].slice(allKeys[i].length - 3) === 'Dot') {
                this.allParamDotKeys.push(allKeys[i]);
            } else {
                this.allParamKeys.push(allKeys[i]);
            }
        }
    }

    addBCFunc(bcFunc) {
        this.bcFunc = bcFunc;
    }

    removeBCFunc() {
        this.bcFunc = GF.DoNothing;
    }
}