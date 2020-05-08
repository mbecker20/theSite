class AnimTemplate {
    constructor(scene, myMats, shadows, gui) {
        // sphere swings, cube up and down
        this.node = new BABYLON.TransformNode('animNode', scene);

        // setup lagrangian update system
        this.setupLagrangian();

        // setup meshes
        this.setupMeshs(scene, shadows);

        // set materials
        this.setMaterials(myMats);


        this.setupGUIMenu(gui, this);
    }

    step() {
        // this is func that steps positions/anything forward by a step

    }

    setPos() {

    }

    setupLagrangian() {

    }

    setupMeshs(scene, shadows) {
        // setup the meshes needed in anim. use BF.Make...

        // all meshs need to have this.node as their parent at some level
        // eg. ring.parent = mass, mass.parent = this.node is good

        // then connect meshs to shadows
        // eg BF.ConnectMeshsToShadows([mesh0, mesh1, ...], shadows);
    }

    setMaterials(myMats) {
        //set materials

        //then BF.ForceCompileMaterials([mesh0, mesh1, ...])
    }

    setupGUIMenu(gui, anim) {
        this.guiMenu = UI.MakeSubMenu('sim settings', gui.mainMenu, gui);

        var names = [];
        var controls = [];

        // add controls here 

        this.guiMenu.addControls(names, controls);
    }

    activate() {
        // setEnabled controls visibility of this.node, which is parent of all meshs in anim
        this.node.setEnabled(true);
        this.guiMenu.parentButton.isVisible = true;
    }

    deactivate() {
        this.node.setEnabled(false);
        this.guiMenu.parentButton.isVisible = false;
    }
}
