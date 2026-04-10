let imageModelURL = "https://teachablemachine.withgoogle.com/models/2-N_OgCRb/";
let classifier = null;
let imgs = [];
let imgData = [];
let slider;
let modelReady = false;
let classificationsComplete = false;
let imagesLoaded = false;
let classificationStarted = false;
let classes = [];

let sound = null;
let sounds = {};
let className = null;
currentSound = null; //track the current sound
let previousClassIndex = -1; //track last slider position

async function setup() {
  console.log("SETUP RUNNING - LOADING EVERYTHING HERE");
  createCanvas(1265, 540);

  slider = createSlider(0, 0, 0);
  slider.position(540, 510);
  slider.size(200);
  slider.hide(); // hide until classification ready
    slider.input(onSliderChange); // Calls function when slider moves

  // Load images
  // Load the three images
  let bellImg = await loadImage("images/bell.png");
  let keyboardImg = await loadImage("images/keyboard.png");
  let plantImg = await loadImage("images/plant.png");

  imgs = [bellImg, keyboardImg, plantImg];
  console.log("All images r loaded! :*) ");

  // Load classifier and wait for it to load
  console.log("Loading ml5 classifier...");
  classifier = await ml5.imageClassifier(imageModelURL + "model.json");
  console.log("MODEL LOADED!");
  modelReady = true;

  // now, start classification
  console.log("Starting classification...");
  await classifyAllImages();

  console.log("Everything complete!");
  slider.show(); //slider back in
  console.log("Setup complete!");

  //loading the sound for each class

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

async function classifyAllImages() {
  console.log("Starting classification...");
  console.log("Classifier:", classifier);
  console.log("Images:", imgs);
  for (let i = 0; i < 3; i++) {
    try {
      const results = await classifier.classify(imgs[i]);

      // Set threshold
      let threshold = 0.0;

      if (results[0].confidence > threshold) {
        imgData.push({
          index: i,
          class: results[0].label,
          confidence: results[0].confidence,
        });
      }

      console.log(
        `Image ${i + 1}/${3}: ${results[0].label} (${(results[0].confidence * 100).toFixed(1)}%)`,
      );
    } catch (error) {
      console.error(`Error classifying image ${i}:`, error);
    }
  }
  console.log("Classification complete!", imgData);

  classes = [...new Set(imgData.map(d => d.class))];  // Extract unique classes
  console.log("Classes found:", classes);

  slider.attribute('max', classes.length - 1);  // Update slider max
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

function draw() {
  background(220);
  background("rgb(187,215,250)");

  if (!classificationsComplete) {
    fill(0);
    textSize(20);
    text("loading...", 500, 270);
    return;
  }
  
  // Get current class from slider
  let currentClassIndex = slider.value();
  let currentClass = classes[currentClassIndex];

  // Debug logs
  console.log("Current class:", currentClass);
  console.log("imgData:", imgData);
  console.log("imgs array:", imgs);
  
  // Find the image that matches this class
  let matchingImage = null;
  for (let data of imgData) {
    console.log("Checking:", data.class, "against", currentClass);
    if (data.class === currentClass) {
      matchingImage = imgs[data.index];
      console.log("Found match! Image index:", data.index);
      break;
    }
  }
  
  // Display the matching image
  if (matchingImage) {
    image(matchingImage, 420, 40, 400, 400);  // Adjust position/size as needed
  } else {
    fill(255, 0, 0);
    text("No matching image found", 640, 270);
  }
  
  // Show current class label
  fill(0);
  noStroke();
  textSize(18);
  textAlign(CENTER);
  text("Showing: " + currentClass, 640, 470);
  
  textSize(14);
  text("Move slider to listen to different objects :P", 640, 495);
}
 
