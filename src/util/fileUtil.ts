import fs from "fs";

const readFileAsStream = (filePath: string) => {
  const fileStream = fs.createReadStream(filePath);
  return fileStream;
};

export { readFileAsStream };
