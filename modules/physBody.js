function makePhysBody(scene, node, mesh, v, angMom, density, dt) {
    // returns the mesh with added functions and properties
    // mesh will have COM at origin after creation
    PF.MoveToCOM(mesh);
    mesh.node = node;
    mesh.nodeAngMom = angMom // angMom relative to node. must mesh.updateAngMom() after node transform
    mesh.angMom = BF.TransformArMeshLocalToWorld(mesh.node, mesh.nodeAngMom);
    mesh.p = BF.ZeroVec3();
    mesh.v = v; //babylon vec3
    mesh.scaledV = BF.ZeroVec3();
    mesh.momTens = PF.GetMomentTensor(mesh,density);
    mesh.oTens = BF.GetOTens(mesh);
    mesh.wVec3 = BF.ZeroVec3();
    mesh.w = PF.getCorrW(mesh.oTens, mesh.momTens, mesh.angMom, dt);

    mesh.arrowScale = 1;
    mesh.wArrow = BF.MakeArrow(mesh.name.concat(' wArrow'), scene, math.multiply(mesh.w, mesh.arrowScale), .3, .7);
    mesh.wArrow.position = mesh.position;

    mesh.axes = BF.MakeAxes(mesh.name.concat(' axes'), scene, 8);
    mesh.axes.parent = mesh;

    mesh.showWArrow = false;
    mesh.showAxes = false;

    mesh.step = function(g, dt) {
        mesh.oTens = BF.GetOTens(mesh);
        mesh.p.addInPlace(mesh.v.scaleToRef(dt, mesh.scaledV));
        mesh.v.y += g*dt;
        mesh.w = PF.getCorrW(mesh.oTens, mesh.momTens, mesh.angMom, dt);
        mesh.rotate(BF.SetVec3(mesh.w, mesh.wVec3), VF.Mag(mesh.w)*dt, BABYLON.Space.WORLD);
        mesh.wArrow.addRot(VF.Mag(mesh.w) * dt);
    }

    mesh.updateMeshArrow = function() {
        mesh.position = mesh.p;
        mesh.wArrow.setDirLength(math.multiply(mesh.w, mesh.arrowScale));
        mesh.wArrow.position = mesh.absolutePosition;
    }

    mesh.updateMeshNoArrow = function() {
        mesh.position = mesh.p;
    }

    mesh.setState = function(showWArrow, showAxes) {
        if(showWArrow) {
            mesh.updateMesh = mesh.updateMeshArrow;
            mesh.wArrow.setEnabled(true);
            mesh.axes.setEnabled(showAxes);
        } else {
            mesh.updateMesh = mesh.updateMeshNoArrow;
            mesh.wArrow.setEnabled(false);
            mesh.axes.setEnabled(showAxes);
        }
    }

    mesh.setShowWArrow = function(showWArrow) {
        // showWArrow is boolean
        if(showWArrow) {
            mesh.updateMesh = mesh.updateMeshArrow;
            mesh.wArrow.setEnabled(true);
        } else {
            mesh.updateMesh = mesh.updateMeshNoArrow;
            mesh.wArrow.setEnabled(false);
        }
    }

    mesh.setShowAxes = function(showAxes) {
        mesh.axes.setEnabled(showAxes);
    }

    mesh.updateAngMom = function() {
        mesh.angMom = BF.TransformArMeshLocalToWorld(mesh.node, mesh.nodeAngMom); //ar 3 relative to node space
    }

    mesh.setState(mesh.showWArrow, mesh.showAxes);
}
