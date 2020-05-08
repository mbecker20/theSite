window.addEventListener('DOMContentLoaded', function() {
    // get the canvas DOM element
    var canvas = document.getElementById('renderCanvas');

    // load the 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    // check if user device is iPhone
    window.ONIPHONE = (window.navigator.platform === 'iPhone');

    // call the createScene function
    var scene = createTestingScene(canvas, engine);

    // run the render loop
    engine.runRenderLoop(function(){
        scene.render();
    });

    // the canvas/window resize event handler
    window.addEventListener('resize', function(){
        engine.resize();
        window.camera.virtualController.onResize();
    });
});
