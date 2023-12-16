const { Canvas, createCanvas, Image, ImageData, loadImage } = require("canvas");
const { JSDOM } = require("jsdom");
const { writeFileSync, existsSync, mkdirSync } = require("fs");
const tesseract = require("node-tesseract-ocr");

(async () => {
  await loadOpenCV();

  const image = await loadImage("./images/test4.jpg");
  const src = cv.imread(image);

  const dst = new cv.Mat();
  cv.cvtColor(src, dst, cv.COLOR_BGR2GRAY);
  cv.threshold(dst, dst, 0, 255, cv.THRESH_BINARY);

  let angle = 0;
  let foundText = false;

  while (!foundText && angle < 360) {
    const rotated = rotateImage(src, angle);
    const extractedText = await recognizeText(rotated);

    console.log(`Angle: ${angle.toFixed(3)}, Text: ${extractedText}`);

    if (extractedText.toLowerCase().includes("year")) {
      foundText = true;
      console.log("Found 'Year' in the text. Save the rotated image.");

      // Save the rotated image
      const rotatedCanvas = createCanvas(rotated.cols, rotated.rows);
      cv.imshow(rotatedCanvas, rotated);
      const buffer = rotatedCanvas.toBuffer("image/jpeg");
      const outputFilePath = "./rotated_image_with_year.jpg";
      writeFileSync(outputFilePath, buffer);
    } else {
      angle += 2; // Rotate by 2 degrees in each iteration
    }

    rotated.delete(); // Release resources
  }

  if (!foundText) {
    console.log("Text 'Year' not found in the rotated images.");
  }

  // Release resources
  src.delete();
  dst.delete();
})();

function loadOpenCV(rootDir = "/work", localRootDir = process.cwd()) {
  if (
    global.Module &&
    global.Module.onRuntimeInitialized &&
    global.cv &&
    global.cv.imread
  ) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    installDOM();
    global.Module = {
      onRuntimeInitialized() {
        cv.FS.chdir(rootDir);
        resolve();
      },
      preRun() {
        const FS = global.Module.FS;
        if (!FS.analyzePath(rootDir).exists) {
          FS.mkdir(rootDir);
        }
        if (!existsSync(localRootDir)) {
          mkdirSync(localRootDir, { recursive: true });
        }
        FS.mount(FS.filesystems.NODEFS, { root: localRootDir }, rootDir);
      },
    };
    global.cv = require("./js/opencv.js");
  });
}

function installDOM() {
  const dom = new JSDOM();
  global.document = dom.window.document;
  global.Image = Image;
  global.HTMLCanvasElement = Canvas;
  global.ImageData = ImageData;
  global.HTMLImageElement = Image;
}

async function recognizeText(image) {
  const buffer = await imageToBuffer(image);
  const config = {
    lang: "eng",
    oem: 1,
    psm: 3,
  };
  const text = await tesseract.recognize(buffer, config);
  return text;
}

function imageToBuffer(image) {
  return new Promise((resolve) => {
    const canvas = createCanvas(image.cols, image.rows);
    cv.imshow(canvas, image);
    const buffer = canvas.toBuffer("image/jpeg");
    resolve(buffer);
  });
}

function rotateImage(src, angle) {
  const h = src.rows;
  const w = src.cols;
  const center = new cv.Point(w / 2, h / 2);
  const M = cv.getRotationMatrix2D(center, angle, 1.0);
  const rotated = new cv.Mat();
  cv.warpAffine(
    src,
    rotated,
    M,
    new cv.Size(w, h),
    cv.INTER_CUBIC,
    cv.BORDER_REPLICATE
  );
  return rotated;
}
