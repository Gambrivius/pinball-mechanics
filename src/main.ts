import "./style.css";
import * as Matter from "matter-js";
// import matter attractors plugin
import MatterAttractors from "matter-attractors";

Matter.use(MatterAttractors);

async function loadSvg(
  url: string,
  x: number,
  y: number
): Promise<Matter.Body> {
  const response = await fetch(url);
  const text = await response.text();
  const document = new window.DOMParser().parseFromString(
    text,
    "image/svg+xml"
  );
  console.log(document);

  var bodies: Matter.Body[] = [];
  document.querySelectorAll("path").forEach((path) => {
    console.log(path);
    var b = Matter.Bodies.fromVertices(
      x,
      y,
      [Matter.Svg.pathToVertices(path, 6)],
      {
        render: {
          fillStyle: "transparent",
          strokeStyle: "#FFFFFF",
        },
      },
      true
    );
    bodies.push(b);
  });
  const finalBody = Matter.Body.create({
    parts: bodies,
    render: {
      fillStyle: "transparent",
      strokeStyle: "#FFFFFF",
    },
  });
  return finalBody;
}

var paddleLDown = false;
var paddleRDown = false;

async function buildLFlipper(x: number, y: number): Promise<Matter.Composite> {
  const bodies = await loadSvg("./flipperL.svg", x, y);
  console.log("Loading left");
  console.log(bodies);
  const c = Matter.Composite.create();
  var blockerBottom = Matter.Bodies.rectangle(x + 12, y + 45, 105, 35, {
    isStatic: true,
    render: {},
    collisionFilter: {
      category: 0x0010, // special category just for flipper
      mask: 0x1010,
    },
  });
  const blockerTop = Matter.Bodies.rectangle(x + 20, y - 55, 105, 55, {
    isStatic: true,
    render: {
      strokeStyle: "#333333",
      fillStyle: "blue",
    },
    collisionFilter: {
      category: 0x010, // special category just for flipper
      mask: 0x1010,
    },
  });

  // flipper constraints

  var pivotConstraint = Matter.Constraint.create({
    pointA: { x: x - 12, y: y },
    bodyB: bodies,
    pointB: { x: -20, y: 0.0 },
    stiffness: 1,
    length: 0,
    render: {
      visible: true,
      type: "line",
    },
  });

  var springConstraint = Matter.Constraint.create({
    bodyA: bodies,
    pointA: { x: 22, y: 0 },
    bodyB: blockerBottom,
    pointB: { x: -0, y: 0 },
    stiffness: 0.02,
    length: 0,
    render: {
      visible: true,
      strokeStyle: "green",
    },
  });
  bodies.collisionFilter.category = 0x1001;
  bodies.collisionFilter.mask = 0x1111; // collides with anything
  var flipper = Matter.Composite.create({
    bodies: [bodies],
    constraints: [pivotConstraint, springConstraint],
  });

  var body = Matter.Bodies.circle(x + 30, y - 70, 35, {
    plugin: {
      attractors: [
        function (bodyA: Matter.Body, bodyB: Matter.Body) {
          if (!paddleLDown) {
            return;
          }
          if (bodyA != bodies && bodyB != bodies) {
            return;
          }

          var force = {
            x: (bodyA.position.x - bodyB.position.x) * 0.002,
            y: (bodyA.position.y - bodyB.position.y) * 0.002,
          };
          // apply force to both bodies
          Matter.Body.applyForce(
            bodyA,
            bodyA.position,
            Matter.Vector.neg(force)
          );
          Matter.Body.applyForce(bodyB, bodyB.position, force);
        },
      ],
    },
    isStatic: true,
    render: {
      visible: true,
      fillStyle: "red",
    },
    collisionFilter: {
      category: 0x0000, // special category just for flipper
      mask: 0x0000,
    },
  });
  Matter.Composite.add(c, flipper);
  Matter.Composite.add(c, body);
  Matter.Composite.add(c, [blockerBottom, blockerTop]);
  return c;
}

async function buildRFlipper(x: number, y: number): Promise<Matter.Composite> {
  const bodies = await loadSvg("./a.svg", x, y);
  console.log("Loading right");
  console.log(bodies);
  const c = Matter.Composite.create();
  var blockerBottom = Matter.Bodies.rectangle(x - 12, y + 45, 105, 35, {
    isStatic: true,
    render: {},
    collisionFilter: {
      category: 0x0010, // special category just for flipper
      mask: 0x1010,
    },
  });
  const blockerTop = Matter.Bodies.rectangle(x - 20, y - 55, 105, 55, {
    isStatic: true,
    render: {
      strokeStyle: "#333333",
      fillStyle: "blue",
    },
    collisionFilter: {
      category: 0x0100, // special category just for flipper
      mask: 0x1010,
    },
  });

  // flipper constraints

  bodies.collisionFilter.category = 0x1001;
  bodies.collisionFilter.mask = 0x1111; // collides with anything

  var body = Matter.Bodies.circle(x - 30, y - 70, 35, {
    plugin: {
      attractors: [
        function (bodyA: Matter.Body, bodyB: Matter.Body) {
          if (!paddleRDown) {
            return;
          }
          if (bodyA != bodies && bodyB != bodies) {
            return;
          }
          var force = {
            x: (bodyA.position.x - bodyB.position.x) * 0.002,
            y: (bodyA.position.y - bodyB.position.y) * 0.002,
          };
          // apply force to both bodies
          Matter.Body.applyForce(
            bodyA,
            bodyA.position,
            Matter.Vector.neg(force)
          );
          Matter.Body.applyForce(bodyB, bodyB.position, force);
        },
      ],
    },
    isStatic: true,
    render: {
      visible: true,
      fillStyle: "red",
    },
    collisionFilter: {
      category: 0x0000, // does not collide
      mask: 0x0000,
    },
  });
  var pivotConstraint = Matter.Constraint.create({
    pointA: { x: x + 12, y: y },
    bodyB: bodies,
    pointB: { x: 20, y: 0.0 },
    stiffness: 1,
    length: 0,
    render: {
      visible: true,
      type: "line",
    },
  });

  var springConstraint = Matter.Constraint.create({
    bodyA: bodies,
    pointA: { x: -22, y: 0 },
    bodyB: blockerBottom,
    pointB: { x: -0, y: 0 },
    stiffness: 0.02,
    length: 0,
    render: {
      visible: true,
      strokeStyle: "green",
    },
  });

  var flipper = Matter.Composite.create({
    bodies: [bodies],
    constraints: [pivotConstraint, springConstraint],
  });
  Matter.Composite.add(c, flipper);
  Matter.Composite.add(c, body);
  Matter.Composite.add(c, [blockerBottom, blockerTop]);
  return c;
}
// onload
window.addEventListener("load", async () => {
  // module aliases

  var engine = Matter.Engine.create({});

  // change frequency of engine
  engine.timing.timeScale = 0.8;

  // create a renderer

  var render = Matter.Render.create({
    element: document.body,
    engine: engine,
    options: {
      width: 640,
      height: 480,
      showCollisions: true,
      showVelocity: true,
    },
  });

  // build flipper
  const flipperL = await buildLFlipper(320 - 60, 400);
  Matter.World.add(engine.world, flipperL);
  const flipperR = await buildRFlipper(320 + 60, 400);
  Matter.World.add(engine.world, flipperR);

  // add walls
  const wallOptions = {
    isStatic: true,
    render: {
      fillStyle: "blue",
    },
  };
  const walls = [
    Matter.Bodies.rectangle(320, 0, 640, 15, wallOptions),
    Matter.Bodies.rectangle(320, 480, 640, 15, wallOptions),
    Matter.Bodies.rectangle(0, 240, 15, 480, wallOptions),
    Matter.Bodies.rectangle(640, 240, 15, 480, wallOptions),
  ];

  Matter.World.add(engine.world, walls);

  // add ball
  function spawnBall() {
    const ball = Matter.Bodies.circle(280, 40, 10, {
      render: {
        fillStyle: "red",
      },
      collisionFilter: {
        category: 0x0001,
        mask: 0x0001,
      },
    });
    Matter.World.add(engine.world, ball);
  }
  // run the renderer
  Matter.Render.run(render);

  // create runner
  var runner = Matter.Runner.create();

  // run the engine
  Matter.Runner.run(runner, engine);
  // stop in 10ms

  // on keydown
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      paddleLDown = true;
    }
    if (e.key === "ArrowRight") {
      paddleRDown = true;
    }
  });

  // on key up

  window.addEventListener("keyup", (e) => {
    if (e.key === " ") {
      spawnBall();
    }
    if (e.key === "ArrowLeft") {
      paddleLDown = false;
    }
    if (e.key === "ArrowRight") {
      paddleRDown = false;
    }
  });
});
