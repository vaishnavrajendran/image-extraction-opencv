const tesseract = require("node-tesseract-ocr");

const config = {
  lang: "eng",
  oem: 1,
  psm: 3,
};

tesseract
  .recognize("./images/rot-4.jpg", config)
  // .recognize("./images/test4.jpg", config)
  .then((inputText) => {
    console.log(inputText);
  })
  .catch((error) => {
    console.log(error.message);
  });
