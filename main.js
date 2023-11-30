import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Inspector } from '@babylonjs/inspector';

const canvas = document.getElementById('canva');

const engine = new BABYLON.Engine(canvas);

let cameraPosY = window.innerHeight/2;
let cameraPosX = window.innerWidth/2;

const createScene = async function() {
  const scene = new BABYLON.Scene(engine);
  const utilLayer = new BABYLON.UtilityLayerRenderer(scene);

  new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0));

  const camera = new BABYLON.ArcRotateCamera(
    "arcRotateCamera",
    0,
    1,
    10,
    new BABYLON.Vector3(0, 2, 0),
    scene
  );
  camera.speed - 0.1;
  camera.attachControl(canvas, true);

  camera.wheelPrecision = 10;

  camera.upperBetaLimit = Math.PI/2;

  BABYLON.SceneLoader.ImportMesh(
    '',
    '/',
    'HVGirl.glb',
    scene,
    function(meshes, particleSystems, skeletons, animationGroups) {
      const model = meshes[0];
      model.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
      // Idle : 0
      // samba : 1
      // Walk : 2
      // BackWalk : 3
      camera.setTarget(model);

      const walkAnim = animationGroups[2];
      const walkBackAnim = animationGroups[3];
      const idleAnim = animationGroups[0];
      const sambaAnim = animationGroups[1];

      const playerWalkSpeed = 0.03;
      const playerRunSpeed = 0.1;
      const playerSpeedBack = 0.01;
      const playerRotationSpeed = 0.01;
      const runAnimSpeed = 3;
      const walkAnimSpeed = 1;

      let speed;
      let animSpeed;

      let keyStatus = {
        w: false,
        s: false,
        a: false,
        d: false,
        b: false,
        c: false,
        v: false,
        Shift: false
      };

      scene.actionManager = new BABYLON.ActionManager(scene);

      scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (event) => {
        let key = event.sourceEvent.key;
        if (key !== "Shift") {
          key = key.toLowerCase();
        }
        if (key in keyStatus) {
          keyStatus[key] = true;
        }
        // console.log(keyStatus);
      }));

      scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (event) => {
        let key = event.sourceEvent.key;
        if (key !== "Shift") {
          key = key.toLowerCase();
        }
        if (key in keyStatus) {
          keyStatus[key] = false;
        }
      }));

      let moving = false;
      let activate = false;
      let sphere;

      scene.onBeforeRenderTargetsRenderObservable.add(() => {
        if (keyStatus.w || keyStatus.s || keyStatus.a || keyStatus.d || keyStatus.b) {
          moving = true;
          cameraPosX = window.innerWidth/2;
          cameraPosY = window.innerHeight/2;
          if (keyStatus.s && !keyStatus.w) {
            speed = -playerSpeedBack;
            walkBackAnim.start(true, 1, walkBackAnim.from, walkBackAnim.to, false);
          } else if (keyStatus.w || keyStatus.a || keyStatus.d) {
            speed = keyStatus.Shift ? playerRunSpeed : playerWalkSpeed;
            animSpeed = keyStatus.Shift ? runAnimSpeed : walkAnimSpeed;
            walkAnim.speedRatio = animSpeed;
            walkAnim.start(true, animSpeed, walkAnim.from, walkAnim.to, false);
          }

          if (keyStatus.a) {
            model.rotate(BABYLON.Vector3.Up(), -playerRotationSpeed);
          }
          if (keyStatus.d) {
            model.rotate(BABYLON.Vector3.Up(), playerRotationSpeed);
          }
          if (keyStatus.b) {
            sambaAnim.start(true, 1, sambaAnim.from, sambaAnim.to, false);
          }
  
          model.moveWithCollisions(model.forward.scaleInPlace(speed));
        } else if (moving) {
          idleAnim.start(true, 1, idleAnim.from ,idleAnim.to, false);
          sambaAnim.stop();
          walkAnim.stop();
          walkBackAnim.stop();
          moving = false;
        }
        if (keyStatus.c && !moving) {
          if (!activate) {
            sphere = new BABYLON.MeshBuilder.CreateSphere('powerSphere', {
              segments: 20,
              diameter: 0.1
            });
            sphere.position = new BABYLON.Vector3(model.position.x, model.position.y + 1.5, model.position.z - 0.5);
            const sphereMaterial = new BABYLON.StandardMaterial();
            sphere.material = sphereMaterial;
            sphereMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
            console.log("created");
            activate = true;
          }
          if (keyStatus.v) {
            BABYLON.Animation.CreateAndStartAnimation(
              'movementAnimation',
              sphere,
              'position.x',
              30,
              120,
              0,
              10,
              BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            );
            BABYLON.Animation.CreateAndStartAnimation(
              'movementAnimation',
              sphere,
              'scaling.z',
              30,
              120,
              1,
              10,
              BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            );
            activate = false;
          }
        }
      });
    }
  );

  // scene.onPointerMove = function findPos() {
  //   var currentX = scene.pointerX;
  //   var currentY = scene.pointerY;
  //   if (currentX < cameraPosX) {
  //     camera.alpha += 0.01;
  //     cameraPosX = currentX;
  //   } else if (currentX > cameraPosX) {
  //     camera.alpha -= 0.01;
  //     cameraPosX = currentX;
  //   }
  //   if (currentY < cameraPosY) {
  //     camera.beta += 0.01;
  //     cameraPosY = currentY;
  //   } else if (currentY > cameraPosY) {
  //     camera.beta -= 0.01;
  //     cameraPosY = currentY;
  //   }
  // }

  return scene;
}

const scene = await createScene();

engine.runRenderLoop(function() {
  scene.render();
});

window.addEventListener('resize', function() {
  engine.resize();
});

scene.createDefaultEnvironment({
  createGround: false,
  createSkybox: false
});

const ground = BABYLON.CreateGround("ground", {width: 50, height: 50, subdivisions: 10});
ground.material = new BABYLON.StandardMaterial();
ground.material.wireframe = true;

// Inspector.Show(scene, {});
