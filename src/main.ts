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

var paddleDown = false;

async function buildFlipper(x: number, y: number): Promise<Matter.Composite> {
  const bodies = await loadSvg("./flipper.svg", x, y);

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
          var force = {
            x: (bodyA.position.x - bodyB.position.x) * 0.001,
            y: (bodyA.position.y - bodyB.position.y) * 0.001,
          };
          // apply force to both bodies
          Matter.Body.applyForce(
            bodyA,
            bodyA.position,
            Matter.Vector.neg(force)
          );
          if (paddleDown) {
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
  const flipper = await buildFlipper(200, 200);
  Matter.World.add(engine.world, flipper);

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
      paddleDown = true;
    }
  });

  // on key up

  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") {
      paddleDown = false;
    }
  });
});
