let imageModelURL = "https://teachablemachine.withgoogle.com/models/xmL1AGDzM/";
let classifier;
let img;
let gridImgs = [];
let gridData = [];
let classes = [];
let slider;
let modelReady = false;
let classificationsComplete = false;
let imagesLoaded = false;
let mainImageLoaded = false;
let classificationStarted = false;

let gridCols = 6;
let gridRows = 6;
let gridCount = gridCols * gridRows;
let sound = null;
let sounds = {};
let className = null;
let currentSound = null; //track the current sound
let previousClassIndex = -1; //track last slider position

async function setup() {
  console.log("SETUP RUNNING - LOADING EVERYTHING HERE");
  createCanvas(1265, 540);

  // Create slider
  slider = createSlider(0, 0, 0);
  slider.position(540, 510);
  slider.size(200);
  slider.hide(); // hide until classification ready
  slider.input(onSliderChange); // Calls function when slider moves

  // Load main image
  img = await loadImage("image/room.png");
  console.log("Main image loaded!");
  mainImageLoaded = true;

  // Load ALL grid images and wait for them
  console.log("Loading grid images...");
  let gridPromises = [];
  for (let i = 1; i <= gridCount; i++) {
    let promise = loadImage("grids/grid_" + i + ".png");
    gridPromises.push(promise);
  }

  gridImgs = await Promise.all(gridPromises);
  console.log("ALL grid images loaded!");
  imagesLoaded = true;

  // Load classifier and wait for it to load
  console.log("Loading ml5 classifier...");
  classifier = await ml5.imageClassifier(imageModelURL + "model.json");
  console.log("MODEL LOADED!");
  modelReady = true;

  // now everything is guaranteed ready - start classification
  console.log("Starting classification...");
  await classifyAllGrids();

  console.log("Everything complete!");
  slider.show();
  console.log("Setup complete!");

  // loading the sound for each class
  console.log("Loading sounds ...");
  for (let className of classes) {
    try {
      let sound = await loadSound(`sounds/${className}.mp3`);
      sounds[className] = sound;
      console.log(` Loaded sounds/${className}.mp3 for ${className} !!`);
    } catch (err) {
      console.log(`Could not load sounds/${className}.mp3 for ${className}`);
    }
  }
}
////////////
function classifyGrid(gridImage, index) {
  return new Promise((resolve, reject) => {
    classifier.classify(gridImage, (results, error) => {
      if (error) {
        reject(error);
      } else if (results && results.length > 0) {
        resolve(results);
      } else {
        reject("No results returned");
      }
    });
  });
}

async function classifyAllGrids() {
  console.log(" Starting classification of all grids...");
  gridData = [];

  for (let i = 0; i < gridImgs.length; i++) {
    try {
      const results = await classifyGrid(gridImgs[i], i);

      // Calculate grid position
      const row = Math.floor(i / gridCols);
      const col = i % gridCols;

      //Only add grids with confidence above 99.9%
      // Set different thresholds based on class
      let threshold = results[0].label === "plants" ? 0.999 : 0.0; // 99.9% for plants, 0% for others

      if (results[0].confidence > threshold) {
        gridData.push({
          index: i,
          row: row,
          col: col,
          class: results[0].label,
          confidence: results[0].confidence,
        });
      }
      console.log(
        `Grid ${i + 1}/${gridCount}: ${results[0].label} (${(results[0].confidence * 100).toFixed(1)}%)`,
      );
    } catch (error) {
      console.error(` Error classifying grid ${i}:`, error);
    }
  }

  // Extract unique classes
  classes = [...new Set(gridData.map((g) => g.class))];
  console.log("Classification complete! Found classes:", classes);

  // Update slider max value
  slider.attribute("max", classes.length - 1);

  classificationsComplete = true;
}

function onSliderChange() {
  // This runs ONLY when the slider is moved by the user

  // Get current class
  currentClassIndex = slider.value();
  currentClass = classes[currentClassIndex];

  for (let className in sounds) {
    if (className !== currentClass) {
      // If it's NOT the current class
      sounds[className].stop();
    }
  }
  sounds[currentClass].play();
}

function highlightGrids(targetClass) {
  //calculate grid cell dimensions on the displayed img
  let cellWidth = 400 / gridCols;
  let cellHeight = 400 / gridRows;
  let startX = 420; // where image starts on canvas
  let startY = 40;

  //highlight each grid
  noFill();
  stroke(255, 255, 0); // yellow for now
  strokeWeight(4);

  //loop to all the grid classes
  for (let grid of gridData) {
    if (grid.class == targetClass) {
      //calculates position of the grid in the displayed img
      let x = startX + grid.col * cellWidth;
      let y = startY + grid.row * cellHeight;

      // draw da highlighted boxxxx
      rect(x, y, cellWidth, cellHeight);
    }
  }
}

function draw() {
  background(187, 215, 250);
  background("rgb(187,215,250)");

  if (!classificationsComplete) {
    fill(0);
    textSize(20);
    text("loading...", 500, 270);
    // text("Progress:" + gridData.lenght * "/" * gridCount, 500, 300);
    return;
  }
  //draw image
  if (img && mainImageLoaded) {
    image(img, 420, 40, 400, 400);
  }
  //get current class from the slider
  let currentClassIndex = slider.value();
  let currentClass = classes[currentClassIndex];

  //highlight those grids
  highlightGrids(currentClass);
  //show current class labl
  fill(0);
  noStroke(0);
  textSize(20);
  textAlign(CENTER);
  text("Showing: " + currentClass, 640, 470);

  textSize(14);
  text("Move slider to listen to different objects :P");
}
