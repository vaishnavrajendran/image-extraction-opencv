const { Canvas, createCanvas, Image, ImageData, loadImage } = require("canvas");
const { JSDOM } = require("jsdom");
const { writeFileSync, existsSync, mkdirSync } = require("fs");

(async () => {
  await loadOpenCV();

  //   const image = await loadImage("./images/test1.jpg");
  const image = await loadImage("./images/test2.jpg");
  //   const image = await loadImage("./images/test3.jpg");
  //   const image = await loadImage("./images/test4.jpg");
  //   const image = await loadImage("./images/dl.jpeg");
  // Load the image
  const src = cv.imread(image);

  // Convert to grayscale and invert
  const dst = new cv.Mat();
  cv.cvtColor(src, dst, cv.COLOR_BGR2GRAY);
  cv.threshold(dst, dst, 0, 255, cv.THRESH_BINARY);

  const nonZeroCoords = [];
  for (let y = 0; y < dst.rows; y++) {
    for (let x = 0; x < dst.cols; x++) {
      const pixelValue = dst.ucharAt(y, x);
      if (pixelValue > 0) {
        nonZeroCoords.push([x, y]);
      }
    }
  }

  // Convert nonZeroCoords to a Mat object
  const nonZeroMat = new cv.Mat(nonZeroCoords.length, 2, cv.CV_32F);
  for (let i = 0; i < nonZeroCoords.length; i++) {
    nonZeroMat.data32F[i * 2] = nonZeroCoords[i][0];
    nonZeroMat.data32F[i * 2 + 1] = nonZeroCoords[i][1];
  }

  // Calculate skew angle
  const minAreaRect = cv.minAreaRect(nonZeroMat);
  let angle = minAreaRect.angle;

  // Adjust angle range
  if (angle < -45) {
    angle = -(90 + angle);
  } else {
    angle = -angle;
  }

  // Get image dimensions
  const h = src.rows;
  const w = src.cols;

  const center = new cv.Point(w / 2, h / 2);

  // Create rotation matrix and rotate image
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

  // Create a new canvas and draw the rotated image on it
  const rotatedCanvas = createCanvas(w, h);
  cv.imshow(rotatedCanvas, rotated);

  // Convert the canvas to a buffer
  const buffer = rotatedCanvas.toBuffer("image/jpeg");

  // Save the rotated image
  const outputFilePath = "./rotated_image.jpg";
  writeFileSync(outputFilePath, buffer);

  // Print angle and show images
  console.log(`Angle: ${angle.toFixed(3)}`);
  cv.imshow("Input", src);
  cv.imshow("Rotated", rotated);
  cv.waitKey(0);
  cv.destroyAllWindows();

  // Release resources
  image.delete();
  dst.delete();
  rotated.delete();
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
