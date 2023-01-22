import "./style.css";
import * as Matter from "matter-js";
// import matter attractors plugin
import MatterAttractors from "matter-attractors";

Matter.use(MatterAttractors);

async function loadSvg(
  url: string,
  x: number,
  y: number
): Promise<Matter.Body[]> {
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
      [Matter.Svg.pathToVertices(path, 1)],
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
  return bodies;
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
    bodyB: bodies[0],
    pointB: { x: -12.8, y: 0.0 },
    stiffness: 1,
    length: 0,
    render: {
      visible: true,
      type: "line",
    },
  });

  var springConstraint = Matter.Constraint.create({
    bodyA: bodies[0],
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
  bodies.forEach((b) => {
    b.collisionFilter.category = 0x1000;
    b.collisionFilter.mask = 0x1111; // collides with anything
  });
  var flipper = Matter.Composite.create({
    bodies: bodies,
    constraints: [pivotConstraint, springConstraint],
  });

  var body = Matter.Bodies.circle(x + 30, y - 70, 35, {
    plugin: {
      attractors: [
        function (bodyA: Matter.Body, bodyB: Matter.Body) {
          if (bodyA != bodies[0] && bodyB != bodies[0]) {
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
          if (paddleLDown) {
            Matter.Body.applyForce(bodyB, bodyB.position, force);
          }
        },
      ],
    },
    isStatic: true,
    render: {
      visible: true,
      fillStyle: "red",
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
      category: 0x010, // special category just for flipper
      mask: 0x1010,
    },
  });

  // flipper constraints

  bodies.forEach((b) => {
    b.collisionFilter.category = 0x1000;
    b.collisionFilter.mask = 0x1111; // collides with anything
  });

  var body = Matter.Bodies.circle(x - 30, y - 70, 35, {
    plugin: {
      attractors: [
        function (bodyA: Matter.Body, bodyB: Matter.Body) {
          if (bodyA != bodies[0] && bodyB != bodies[0]) {
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
          if (paddleRDown) {
            Matter.Body.applyForce(bodyB, bodyB.position, force);
          }
        },
      ],
    },
    isStatic: true,
    render: {
      visible: true,
      fillStyle: "red",
    },
  });
  var pivotConstraint = Matter.Constraint.create({
    pointA: { x: x + 12, y: y },
    bodyB: bodies[0],
    pointB: { x: 12.8, y: 0.0 },
    stiffness: 1,
    length: 0,
    render: {
      visible: true,
      type: "line",
    },
  });

  var springConstraint = Matter.Constraint.create({
    bodyA: bodies[0],
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
    bodies: bodies,
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

  // create an engine without gravity
  var engine = Matter.Engine.create({
    gravity: {
      x: 0,
      y: 0,
    },
  });

  // create a renderer
  var render = Matter.Render.create({
    element: document.body,
    engine: engine,
    options: {
      width: 800,
      height: 600,
    },
  });

  // load svg files

  // build flipper
  const flipperL = await buildLFlipper(200, 200);
  Matter.World.add(engine.world, flipperL);
  const flipperR = await buildRFlipper(400, 200);
  Matter.World.add(engine.world, flipperR);

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
    if (e.key === "ArrowLeft") {
      paddleLDown = false;
    }
    if (e.key === "ArrowRight") {
      paddleRDown = false;
    }
  });
});
